# Shrimpai Code 视觉设计需求文档

> 文档版本：v1.0
> 日期：2026-05-15
> 业主：shrimpai.cc
> 项目：Shrimpai Code(虾酱)

---

## 1. 项目背景

### 1.1 业主介绍

**shrimpai.cc** 是一个面向开发者的 AI 模型 API 聚合分发平台,为用户提供统一的接口和订阅来访问 GPT、Claude、KIMI、GLM、DeepSeek 等多家厂商的大语言模型。用户在 shrimpai.cc 完成账号注册和订阅后,获得一份 API key,即可在所有兼容 OpenAI / Anthropic 协议的工具中使用。

### 1.2 产品定位

**Shrimpai Code(虾酱)** 是 shrimpai.cc 旗下的桌面端 AI 编程助手,是 shrimpai 这套订阅服务的"门店级"消费入口。

类比:

- shrimpai.cc 之于 Shrimpai Code,相当于「电力公司」之于「智能家居 app」
- 用户买 shrimpai.cc 的订阅 ≈ 买电
- 用户用 Shrimpai Code 写代码 ≈ 享受电力服务

竞品参考:Cursor、Claude Code、Cline、Aider。

### 1.3 工具能干什么

Shrimpai Code 是一款基于 macOS / Windows / Linux 的桌面应用:

- **交互式编码对话**:用户用自然语言描述需求,AI 自动读取代码、修改文件、运行命令
- **多模型支持**:用户在桌面 app 内自由切换 GPT-5.5、Claude Opus 4.7、KIMI K2、GLM 4.6 等
- **本地优先**:代码不离开用户的机器,AI 调用通过 shrimpai.cc 网关转发
- **订阅制**:所有计费、配额、用量管理都在 shrimpai.cc 网站完成,桌面 app 只负责"贴 key 即用"

技术形态:基于开源项目 sst/opencode(MIT license)做品牌定制 fork 和后端网关接入。

### 1.4 用户画像

- **主力人群**:中文开发者(一二线城市互联网公司中后台 / 前端 / 算法工程师)
- **次要人群**:海外华裔开发者、对 Cursor 价格敏感的独立开发者
- **痛点**:Cursor 月费 $20、Claude Code 必须海外信用卡、各家原厂 API 充值繁琐
- **决策视角**:他们见过 Cursor / Linear / Notion,对设计审美有高要求;不会接受廉价 / 过时 / 业余感的 UI

### 1.5 品牌调性

| 是 | 不是 |
|---|---|
| 专业、克制、可信任 | 可爱、卡通、童趣 |
| 接近 Cursor / Linear / Stripe 这种 SaaS 工具感 | 接近抖音、淘宝那种繁杂多色 |
| 略带温度的高饱和橙红做点睛 | 通体橙色色块 |
| 中英双名都自然("Shrimpai Code" 国际化 + "虾酱" 中文亲和) | 偏废其一 |

---

## 2. 视觉系统总规

### 2.1 设计风格定位

**参考 Shopee 视觉体系**(不是抄 Shopee logo),核心特征:

- 纯白底为主
- 饱和橙红色 `#EE4D2D` 作品牌主色,**仅用作点睛**(按钮、强调、品牌符号)
- 大量留白
- 圆角而非锐角
- 极简元素,避免装饰性图形堆叠

但与 Shopee 的不同:

- Shrimpai Code 是开发者工具,**比 Shopee 更冷静**
- 字体偏向 Inter / Helvetica Neue 这种 SaaS 系,不是 Shopee 那种零售大字
- 图形语言偏向几何抽象,不是商品摄影

### 2.2 完整色板

```
─── 主色 ───
品牌主色 (Brand Primary)        #EE4D2D    虾红橙,logo / icon / 主 CTA
品牌强调 (Brand Strong)         #FF424F    标题强调红,悬停色
品牌深色 (Brand Deep)           #B8341A    深色背景上的品牌色变体

─── 暖背景 ───
暖白 (Soft Cream)               #FFF1EA    分享卡 / 引导页背景
卡片底 (Card Soft)              #FFF8F4    可选的次级背景

─── 中性色 ───
纯白                            #FFFFFF    主背景
页面浅灰                        #F5F5F5    次级背景
描边 / 分隔线                   #E5E5E5
弱字                            #888888
正文                            #555555
标题                            #222222
深字                            #1A1A1A    最强对比

─── 状态色(仅功能性,不属品牌) ───
成功                            #2BB553
警告                            #F5A623
错误                            #E5443A
```

色板使用规则:

- **80% 白 + 中性 / 15% 主色 / 5% 其他状态色**
- 主色 `#EE4D2D` 永远不要做大块背景,只做强调
- 所有"软"背景(暖白)用于引导页 / 营销卡片,不用于桌面 app 内部 UI

### 2.3 字体系统

**英文字体**:

- 推荐:Inter(开源、免费商用、SaaS 标配)
- 备选:Helvetica Neue / SF Pro
- **不要使用** Roboto(太工程感)、Comic Sans

**中文字体**:

- macOS:PingFang SC(系统自带)
- Windows:Microsoft YaHei UI
- 设计稿用:苹方 / 思源黑体 Regular & Medium

字号层级(仅作设计稿参考,UI 内字号由代码决定):

- Hero 标题:72-96px
- 一级标题:48px
- 二级标题:32px
- 正文:16px
- 注释 / 弱字:14px

### 2.4 圆角与间距

- 卡片 / 容器圆角:8px 或 12px
- 按钮圆角:6px 或 8px
- 头像 / 图标容器:完全圆形或 `border-radius: 25%` (squircle 风)
- 网格基础间距:8px 倍数体系(8 / 16 / 24 / 32 / 48 / 64)

---

## 3. 交付物清单

### 3.1 优先级 P0(必须交付)

#### 资产 #1:应用主图标 master

```
文件名:  shrimpai-icon-master.png
格式:    PNG-32 RGBA
尺寸:    1024 × 1024 px
背景:    透明(关键:不要有自带圆角或阴影)
```

**用途**:app 在 macOS Dock / Windows 任务栏 / Finder / 安装包安装界面 / 启动画面 显示。**这是用户每天看到 50 次的图**。

**设计要求**:

- 主体居中占画幅 60%(约 614×614),四周留 20% 透明区(macOS 会自动加 squircle 圆角和投影,画太满会被裁掉)
- 单色 `#EE4D2D` 实心,白底(背景透明,但视觉上要假设它在白底上)
- **缩到 32×32 仍要能认出来**——这是硬约束,画完后必须缩小测试
- 不要写产品名"Shrimpai Code"在图标里
- 不要做 3D / 渐变 / 阴影 / 玻璃质感(会失败 macOS 自动渲染)

**形态方向(设计师选其一)**:

**A. 字母 `S` 主导(最推荐)**
一个粗体几何 `S`,纯橙色填充。可以是衬线或无衬线。优势:在任何尺寸下都清晰,国际化无认知门槛。

**B. 虾形抽象**
一只极度简化的侧视虾轮廓——一个 `C` 形大弧(虾身)+ 一根触须 + 一个三叶形尾鳍。**禁止**画虾的细节(节、腿、眼)。优势:和品牌名"虾酱"强关联。风险:32×32 易糊。

**C. `S` 与虾合体(创意空间最大)**
`S` 的下半部弯钩**同时**是一只虾的尾巴。一个图形两层含义:英文用户看到 S(产品首字母),中文用户看到虾(品牌名)。这是最有"故事"的方向。

#### 资产 #2 & #3:横版 Logo(双色版本)

```
文件名:  shrimpai-logo-dark.svg / shrimpai-logo-light.svg
格式:    SVG(矢量),文字必须转曲(outline),不引用系统字体
尺寸:    比例 4:1,画布大小不限(推荐 1200×300)
背景:    透明
```

**用途**:

- about 弹窗
- 文档站头部
- 营销页面 hero
- README.md 顶部

**结构**:

```
┌──────────────────────────────────────┐
│                                      │
│   [图标]    Shrimpai Code            │  ← 主标
│             虾酱  ← 中文小字副标      │
│                                      │
└──────────────────────────────────────┘
```

- 左侧图标尺寸 ≈ 整体高度的 80%
- 图标和文字间距 ≈ 1 倍图标宽度
- 文字 "Shrimpai Code" 大字粗体
- 文字下方 "虾酱" 小字(约主文字的 40% 大小,灰色)

**dark.svg(用于深色背景)**:

- 图标:`#FFFFFF`
- "Shrimpai Code":`#FFFFFF`
- "虾酱":`#AAAAAA`

**light.svg(用于浅色背景)**:

- 图标:`#EE4D2D`
- "Shrimpai Code":`#222222`
- "虾酱":`#888888`

#### 资产 #4:Favicon

```
文件名:  shrimpai-favicon.svg
格式:    SVG
尺寸:    1:1 方形(推荐 32×32 viewBox)
背景:    透明
```

**用途**:浏览器 tab 小图标、PWA 主屏图标、文档站标签页。**16×16 必须可识别。**

**设计要求**:

- 仅放图标,不带文字
- 必须比主图标 master **更简化**——主图标可以有内部线条细节,favicon 只能有一个核心轮廓
- 单色 `#EE4D2D`
- 必须做 16×16 渲染测试,看不清就返工

#### 资产 #5:社交分享卡

```
文件名:  shrimpai-social.png
格式:    PNG(不要 JPG)
尺寸:    1200 × 630 px
背景:    #FFF1EA 暖白
```

**用途**:

- Twitter / X 分享时的预览大图
- 微信朋友圈链接卡片
- 知乎 / 微博的链接预览
- Open Graph `og:image`

**版面**:

```
┌────────────────────────────────────────────┐  上下左右各留白 80px
│                                            │
│                                            │
│   ┌──────┐                                 │
│   │      │   Shrimpai Code                 │  ← 96px Bold #222222
│   │ 图标 │   虾酱                          │  ← 36px Regular #888888
│   │      │                                 │
│   └──────┘   AI coding for every model     │  ← 36px Regular #555555
│                                            │
│                            shrimpai.cc/code│  ← 32px Medium #EE4D2D
│                                            │
└────────────────────────────────────────────┘
```

- 图标尺寸:240×240 px,左对齐
- 文字组左对齐,距离图标 60px 间距
- slogan 占 1-2 行,简洁有力
- 域名右下角对齐,作为视觉收尾

**Slogan 候选**(设计师可选其一,或提新方案):

- "AI coding for every model"
- "All AI models, one workflow"
- "AI 编码助手,全模型一键切换"
- "一份订阅,所有 AI 模型"

### 3.2 优先级 P1(推荐交付)

#### 资产 #6 / #7:Channel 区分图标(开发使用)

```
shrimpai-icon-master-beta.png   1024×1024  beta 版图标
shrimpai-icon-master-dev.png    1024×1024  dev 版图标
```

**用途**:开发者机器上同时安装 prod / beta / dev 三个版本时,能一眼区分。

**设计要求**:基于 #1 主图标,**仅在右下角加角标**:

- beta:橙色斜带 / 橙色圆点 + "BETA" 字样
- dev:绿色斜带 / 绿色圆点 + "DEV" 字样
- 主体不变,确保用户能认出是同一品牌的不同版本

**不交付也可**——三档可以共用 #1 主图标,靠 app 名字("Shrimpai Code Beta" / "Shrimpai Code Dev")区分。

### 3.3 优先级 P2(暂不需要,未来再补)

- 应用内插画(空状态、错误、引导)
- App Store / Microsoft Store 上架截图(5 张)
- DMG 安装背景图(macOS)
- 营销落地页 hero 视觉

---

## 4. 验收标准

每张交付物须通过以下检查:

### 4.1 主图标 #1

- [ ] 缩到 64×64,元素清晰可辨
- [ ] 缩到 32×32,仍能识别这是同一品牌
- [ ] 在 macOS Finder 中显示时,自动 squircle 后不变形
- [ ] 不带任何阴影 / 渐变 / 3D 效果
- [ ] 透明背景(拖到 Photoshop 看 alpha 通道)

### 4.2 横版 Logo #2 #3

- [ ] dark 版放在 `#222222` 背景上,文字图标都清晰
- [ ] light 版放在 `#FFFFFF` 背景上,对比度达 4.5:1(WCAG AA)
- [ ] SVG 在 Chrome / Safari / Firefox 渲染一致
- [ ] 文字已转曲(设计师机器没装该字体也能渲染)
- [ ] 缩到高度 24px 仍可识别

### 4.3 Favicon #4

- [ ] 16×16 仍能识别核心元素
- [ ] 浏览器标签页中显示清晰(多开 5 个 tab 不糊)

### 4.4 Social 卡 #5

- [ ] Twitter Card Validator 通过预览
- [ ] 微信小程序分享预览正常
- [ ] 手机端裁切(中间 80%)后核心信息仍可见
- [ ] 文字无错别字("shrimpai.cc/code" 不要写错域名)

### 4.5 通用

- [ ] 文件命名严格按本文档(区分 dark/light,不要 dark1/dark2/最终版)
- [ ] 源文件(Figma / AI / Sketch)保留并交付
- [ ] PNG 全部 RGBA,**禁止** JPG(背景透明会丢)

---

## 5. 商标与法律边界

- 不要从 Shopee 直接抄任何 logo / icon / 字体
- "参考 Shopee 风格"指的是**色板和留白哲学**,不是抄具体形状
- 主图标和 logo 设计完成后,须避免和已有 AI 工具(Cursor / Claude Code / Cline)相似度过高
- 字体若使用付费字体(如 Helvetica Neue),仅用于设计稿展示,最终交付的 SVG 必须**转曲**(path)而不是引用字体名

---

## 6. 时间和交付方式

- **首轮设计稿提交**:建议 5-7 个工作日
- **review 反馈轮次**:预留 2 轮微调
- **最终交付**:
  - 5 张资产(按 §3.1)
  - 设计源文件(Figma 工作区或 AI / Sketch 文件)
  - 一份"使用说明 PDF",记录品牌色、字体、最小使用尺寸(这份非必需,但能帮后续 UI 改造时不跑偏)
- **交付方式**:建议放到云盘(飞书 / 腾讯文档 / Google Drive),用文件夹形式:

```
shrimpai-code-brand/
├── source/
│   └── shrimpai-brand.fig(或 .ai .sketch)
├── deliverables/
│   ├── shrimpai-icon-master.png
│   ├── shrimpai-icon-master-beta.png       (可选)
│   ├── shrimpai-icon-master-dev.png        (可选)
│   ├── shrimpai-logo-dark.svg
│   ├── shrimpai-logo-light.svg
│   ├── shrimpai-favicon.svg
│   └── shrimpai-social.png
└── guidelines.pdf                           (可选)
```

---

## 7. 联系信息

业主:[你的邮箱 / 联系方式]
项目仓库:https://github.com/Zenwh/shrimpai-shrimpai-code

---

**完。**
