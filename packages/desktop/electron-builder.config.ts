import { execFile } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

import type { Configuration } from "electron-builder"

const execFileAsync = promisify(execFile)
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const signScript = path.join(rootDir, "script", "sign-windows.ps1")

async function signWindows(configuration: { path: string }) {
  if (process.platform !== "win32") return
  if (process.env.GITHUB_ACTIONS !== "true") return

  await execFileAsync(
    "pwsh",
    ["-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", signScript, configuration.path],
    { cwd: rootDir },
  )
}

const channel = (() => {
  const raw = process.env.SHRIMPAI_CHANNEL || process.env.OPENCODE_CHANNEL
  if (raw === "dev" || raw === "beta" || raw === "prod") return raw
  return "dev"
})()

const getBase = (): Configuration => ({
  artifactName: "shrimpai-code-${os}-${arch}.${ext}",
  directories: {
    output: "dist",
    buildResources: "resources",
  },
  files: ["out/**/*", "resources/**/*"],
  extraResources: [
    {
      from: "native/",
      to: "native/",
      filter: ["index.js", "index.d.ts", "build/Release/mac_window.node", "swift-build/**"],
    },
  ],
  mac: {
    category: "public.app-category.developer-tools",
    icon: `resources/icons/icon.icns`,
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: "resources/entitlements.plist",
    entitlementsInherit: "resources/entitlements.plist",
    notarize: true,
    target: ["dmg", "zip"],
  },
  dmg: {
    sign: true,
  },
  protocols: {
    name: "Shrimpai Code",
    schemes: ["shrimpai"],
  },
  win: {
    icon: `resources/icons/icon.ico`,
    signtoolOptions: {
      sign: signWindows,
    },
    target: ["nsis"],
    verifyUpdateCodeSignature: false,
  },
  nsis: {
    oneClick: true,
    perMachine: false,
    installerIcon: `resources/icons/icon.ico`,
    installerHeaderIcon: `resources/icons/icon.ico`,
  },
  linux: {
    icon: `resources/icons`,
    category: "Development",
    target: ["AppImage", "deb", "rpm"],
  },
})

function getConfig() {
  const base = getBase()

  switch (channel) {
    case "dev": {
      return {
        ...base,
        appId: "cc.shrimpai.code.dev",
        productName: "Shrimpai Code Dev",
        rpm: { packageName: "shrimpai-code-dev" },
      }
    }
    case "beta": {
      return {
        ...base,
        appId: "cc.shrimpai.code.beta",
        productName: "Shrimpai Code Beta",
        protocols: { name: "Shrimpai Code Beta", schemes: ["shrimpai"] },
        publish: { provider: "github", owner: "Zenwh", repo: "shrimpai-shrimpai-code", channel: "beta" },
        rpm: { packageName: "shrimpai-code-beta" },
      }
    }
    case "prod": {
      return {
        ...base,
        appId: "cc.shrimpai.code",
        productName: "Shrimpai Code",
        protocols: { name: "Shrimpai Code", schemes: ["shrimpai"] },
        publish: { provider: "github", owner: "Zenwh", repo: "shrimpai-shrimpai-code", channel: "latest" },
        rpm: { packageName: "shrimpai-code" },
      }
    }
  }
}

export default getConfig()
