import { Button } from "@opencode-ai/ui/button"
import { Checkbox } from "@opencode-ai/ui/checkbox"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog } from "@opencode-ai/ui/dialog"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { ProviderIcon } from "@opencode-ai/ui/provider-icon"
import { Spinner } from "@opencode-ai/ui/spinner"
import { useMutation } from "@tanstack/solid-query"
import { TextField } from "@opencode-ai/ui/text-field"
import { showToast } from "@opencode-ai/ui/toast"
import { batch, createMemo, For, Show } from "solid-js"
import { createStore, produce } from "solid-js/store"
import { Link } from "@/components/link"
import { useGlobalSDK } from "@/context/global-sdk"
import { useGlobalSync } from "@/context/global-sync"
import { useLanguage } from "@/context/language"
import {
  detectModels,
  type FormState,
  headerRow,
  validateCustomProvider,
} from "./dialog-custom-provider-form"
import { DialogSelectProvider } from "./dialog-select-provider"

type Props = {
  back?: "providers" | "close"
}

export function DialogCustomProvider(props: Props) {
  const dialog = useDialog()
  const globalSync = useGlobalSync()
  const globalSDK = useGlobalSDK()
  const language = useLanguage()

  const [form, setForm] = createStore<FormState>({
    providerID: "",
    name: "",
    baseURL: "",
    apiKey: "",
    detected: [],
    detectStatus: "idle",
    detectError: undefined,
    headers: [headerRow()],
    err: {},
  })

  const goBack = () => {
    if (props.back === "close") {
      dialog.close()
      return
    }
    dialog.show(() => <DialogSelectProvider />)
  }

  const addHeader = () => {
    setForm(
      "headers",
      produce((rows) => {
        rows.push(headerRow())
      }),
    )
  }

  const removeHeader = (index: number) => {
    if (form.headers.length <= 1) return
    setForm(
      "headers",
      produce((rows) => {
        rows.splice(index, 1)
      }),
    )
  }

  const setField = (key: "providerID" | "name" | "baseURL" | "apiKey", value: string) => {
    batch(() => {
      setForm(key, value)
      if (key === "baseURL" || key === "apiKey") {
        // Invalidate detection results — user must re-run detection.
        if (form.detectStatus !== "idle") {
          setForm("detectStatus", "idle")
          setForm("detected", [])
          setForm("detectError", undefined)
        }
      }
      if (key !== "apiKey") setForm("err", key, undefined)
    })
  }

  const setHeader = (index: number, key: "key" | "value", value: string) => {
    batch(() => {
      setForm("headers", index, key, value)
      setForm("headers", index, "err", key, undefined)
    })
  }

  const detect = async () => {
    if (form.detectStatus === "loading") return
    setForm("detectStatus", "loading")
    setForm("detectError", undefined)
    setForm("err", "detected", undefined)

    const headerMap: Record<string, string> = {}
    for (const h of form.headers) {
      const k = h.key.trim()
      const v = h.value.trim()
      if (k && v) headerMap[k] = v
    }

    const result = await detectModels({
      baseURL: form.baseURL,
      apiKey: form.apiKey,
      headers: headerMap,
    })

    if (!result.ok) {
      batch(() => {
        setForm("detectStatus", "error")
        setForm("detectError", result.error)
        setForm("detected", [])
      })
      return
    }
    batch(() => {
      setForm("detectStatus", "ok")
      setForm("detected", result.models)
    })
  }

  const toggleSelected = (idx: number) => {
    const item = form.detected[idx]
    if (!item || !item.chatSupported) return
    setForm("detected", idx, "selected", !item.selected)
  }

  const setAllSelected = (value: boolean) => {
    setForm(
      "detected",
      produce((arr) => {
        for (const m of arr) {
          if (m.chatSupported) m.selected = value
        }
      }),
    )
  }

  const supportedCount = createMemo(() => form.detected.filter((m) => m.chatSupported).length)
  const selectedCount = createMemo(() => form.detected.filter((m) => m.selected && m.chatSupported).length)

  const validate = () => {
    const output = validateCustomProvider({
      form,
      t: language.t,
      disabledProviders: globalSync.data.config.disabled_providers ?? [],
      existingProviderIDs: new Set(globalSync.data.provider.all.map((p) => p.id)),
    })
    batch(() => {
      setForm("err", output.err)
      output.headers.forEach((err, index) => setForm("headers", index, "err", err))
    })
    return output.result
  }

  const saveMutation = useMutation(() => ({
    mutationFn: async (result: NonNullable<ReturnType<typeof validate>>) => {
      const disabledProviders = globalSync.data.config.disabled_providers ?? []
      const nextDisabled = disabledProviders.filter((id) => id !== result.providerID)

      if (result.key) {
        await globalSDK.client.auth.set({
          providerID: result.providerID,
          auth: {
            type: "api",
            key: result.key,
          },
        })
      }

      await globalSync.updateConfig({
        provider: { [result.providerID]: result.config },
        disabled_providers: nextDisabled,
      })
      return result
    },
    onSuccess: (result) => {
      dialog.close()
      showToast({
        variant: "success",
        icon: "circle-check",
        title: language.t("provider.connect.toast.connected.title", { provider: result.name }),
        description: language.t("provider.connect.toast.connected.description", { provider: result.name }),
      })
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : String(err)
      showToast({ title: language.t("common.requestFailed"), description: message })
    },
  }))

  const save = (e: SubmitEvent) => {
    e.preventDefault()
    if (saveMutation.isPending) return

    const result = validate()
    if (!result) return
    saveMutation.mutate(result)
  }

  const canDetect = () => !!form.baseURL.trim() && form.detectStatus !== "loading"

  return (
    <Dialog
      title={
        <IconButton
          tabIndex={-1}
          icon="arrow-left"
          variant="ghost"
          onClick={goBack}
          aria-label={language.t("common.goBack")}
        />
      }
      transition
    >
      <div class="flex flex-col gap-6 px-2.5 pb-3 overflow-y-auto max-h-[60vh]">
        <div class="px-2.5 flex gap-4 items-center">
          <ProviderIcon id="synthetic" class="size-5 shrink-0 icon-strong-base" />
          <div class="text-16-medium text-text-strong">{language.t("provider.custom.title")}</div>
        </div>

        <form onSubmit={save} class="px-2.5 pb-6 flex flex-col gap-6">
          <p class="text-14-regular text-text-base">
            {language.t("provider.custom.description.prefix")}
            <Link href="https://shrimpai.cc/code/docs/providers/#custom-provider" tabIndex={-1}>
              {language.t("provider.custom.description.link")}
            </Link>
            {language.t("provider.custom.description.suffix")}
          </p>

          <div class="flex flex-col gap-4">
            <TextField
              autofocus
              label={language.t("provider.custom.field.providerID.label")}
              placeholder={language.t("provider.custom.field.providerID.placeholder")}
              description={language.t("provider.custom.field.providerID.description")}
              value={form.providerID}
              onChange={(v) => setField("providerID", v)}
              validationState={form.err.providerID ? "invalid" : undefined}
              error={form.err.providerID}
            />
            <TextField
              label={language.t("provider.custom.field.name.label")}
              placeholder={language.t("provider.custom.field.name.placeholder")}
              value={form.name}
              onChange={(v) => setField("name", v)}
              validationState={form.err.name ? "invalid" : undefined}
              error={form.err.name}
            />
            <TextField
              label={language.t("provider.custom.field.baseURL.label")}
              placeholder={language.t("provider.custom.field.baseURL.placeholder")}
              value={form.baseURL}
              onChange={(v) => setField("baseURL", v)}
              validationState={form.err.baseURL ? "invalid" : undefined}
              error={form.err.baseURL}
            />
            <TextField
              label={language.t("provider.custom.field.apiKey.label")}
              placeholder={language.t("provider.custom.field.apiKey.placeholder")}
              description={language.t("provider.custom.field.apiKey.description")}
              value={form.apiKey}
              onChange={(v) => setField("apiKey", v)}
            />
          </div>

          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between gap-3 flex-wrap">
              <label class="text-12-medium text-text-weak">Models</label>
              <Show when={form.detectStatus === "ok" && supportedCount() > 1}>
                <div class="flex gap-3">
                  <Button type="button" size="small" variant="ghost" onClick={() => setAllSelected(true)}>
                    Select all
                  </Button>
                  <Button type="button" size="small" variant="ghost" onClick={() => setAllSelected(false)}>
                    Clear
                  </Button>
                </div>
              </Show>
            </div>
            <Button
              type="button"
              size="large"
              variant="secondary"
              icon={form.detectStatus === "loading" ? undefined : "magnifying-glass"}
              disabled={!canDetect()}
              onClick={detect}
              class="self-start"
            >
              <Show when={form.detectStatus === "loading"} fallback={<>Detect models</>}>
                <span class="flex items-center gap-2">
                  <Spinner />
                  Detecting…
                </span>
              </Show>
            </Button>

            <Show when={form.detectStatus === "error" && form.detectError}>
              <p class="text-12-regular text-text-error">{form.detectError}</p>
            </Show>

            <Show when={form.detectStatus === "ok" && form.detected.length === 0}>
              <p class="text-12-regular text-text-weak">
                Server returned no models. Check the base URL and API key.
              </p>
            </Show>

            <Show when={form.detectStatus === "ok" && form.detected.length > 0}>
              <div class="text-12-regular text-text-weak">
                Found {form.detected.length} model{form.detected.length === 1 ? "" : "s"} ({selectedCount()} selected
                {supportedCount() < form.detected.length
                  ? `, ${form.detected.length - supportedCount()} unsupported`
                  : ""}
                )
              </div>
              <div class="flex flex-col gap-2 max-h-64 overflow-y-auto border border-border-weak-base rounded-md p-3">
                <For each={form.detected}>
                  {(m, i) => (
                    <div class="flex items-center gap-3" data-row={m.id}>
                      <Checkbox
                        checked={m.selected}
                        readOnly={!m.chatSupported}
                        onChange={() => toggleSelected(i())}
                      >
                        <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                          <span
                            class="text-14-regular break-all"
                            classList={{
                              "text-text-strong": m.chatSupported,
                              "text-text-weak": !m.chatSupported,
                            }}
                          >
                            {m.id}
                          </span>
                          <Show when={!m.chatSupported && m.reason}>
                            <span class="text-12-regular text-text-weak">— {m.reason}</span>
                          </Show>
                        </div>
                      </Checkbox>
                    </div>
                  )}
                </For>
              </div>
            </Show>

            <Show when={form.err.detected}>
              <p class="text-12-regular text-text-error">{form.err.detected}</p>
            </Show>
          </div>

          <div class="flex flex-col gap-3">
            <label class="text-12-medium text-text-weak">{language.t("provider.custom.headers.label")}</label>
            <For each={form.headers}>
              {(h, i) => (
                <div class="flex gap-2 items-start" data-row={h.row}>
                  <div class="flex-1">
                    <TextField
                      label={language.t("provider.custom.headers.key.label")}
                      hideLabel
                      placeholder={language.t("provider.custom.headers.key.placeholder")}
                      value={h.key}
                      onChange={(v) => setHeader(i(), "key", v)}
                      validationState={h.err.key ? "invalid" : undefined}
                      error={h.err.key}
                    />
                  </div>
                  <div class="flex-1">
                    <TextField
                      label={language.t("provider.custom.headers.value.label")}
                      hideLabel
                      placeholder={language.t("provider.custom.headers.value.placeholder")}
                      value={h.value}
                      onChange={(v) => setHeader(i(), "value", v)}
                      validationState={h.err.value ? "invalid" : undefined}
                      error={h.err.value}
                    />
                  </div>
                  <IconButton
                    type="button"
                    icon="trash"
                    variant="ghost"
                    class="mt-1.5"
                    onClick={() => removeHeader(i())}
                    disabled={form.headers.length <= 1}
                    aria-label={language.t("provider.custom.headers.remove")}
                  />
                </div>
              )}
            </For>
            <Button type="button" size="small" variant="ghost" icon="plus-small" onClick={addHeader} class="self-start">
              {language.t("provider.custom.headers.add")}
            </Button>
          </div>

          <Button
            class="w-auto self-start"
            type="submit"
            size="large"
            variant="primary"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? language.t("common.saving") : language.t("common.submit")}
          </Button>
        </form>
      </div>
    </Dialog>
  )
}
