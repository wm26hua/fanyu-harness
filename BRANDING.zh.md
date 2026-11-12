# 品牌定制清单（表层 UI）

本文件是下游发行版 **维普学域 / Fanyu harness** 的品牌改造台账：本轮已改了什么、还剩什么要改、哪些是刻意不改的。

- 产品中文名：**维普学域**
- 产品英文名：**Fanyu harness**
- 机器可读名：**`fyh`**（可执行文件、安装目录、userData、`~/.fyh`、深链协议）
- `productName`（决定 macOS bundle 目录名、可执行文件名、CLI 入口路径）：**Fanyu harness**（保持 ASCII，路径安全）
- 法律主体：**泛语科技**（`copyright`、`author`、`homepage` 均不变）

改动前提：本轮遵循「低风险优先」，只动**表层 UI 与美术**，不动内部功能、协议标识与模型供应商。

---

## 一、本轮已完成

### 1. 图标与美术（新 Logo 全量替换）

原始素材：外部提供的 `logo-2.svg`（41×32，浅蓝→紫渐变的 "vi" 书法字形，含 5 条轮廓与 5 组线性渐变）。
底板风格：沿用上游的「圆角浅色纸底 + 柔和投影」，标记居中占瓦片宽度 70%。

| 文件 | 尺寸/形态 | 说明 |
| --- | --- | --- |
| [`apps/desktop/resources/icon.svg`](./apps/desktop/resources/icon.svg) | SVG 1104×1104 | Linux 图标源；**保留** `filter0_d_1637_371` / `filter1_ddi_1637_371` 两个分组 id，因为 `apps/web/scripts/render-app-icons.ts` 按字面量匹配它们 |
| [`apps/desktop/resources/icon-windows.svg`](./apps/desktop/resources/icon-windows.svg) | SVG 1024×1024，圆角 192 | **保留** `<g id="tray-glyph"`，因为 `apps/desktop/scripts/render-tray-icon.ts` 按字面量匹配并给它加 `translate(552 544) scale(1.2) translate(-552 -544)` |
| [`apps/desktop/resources/icon-macos.svg`](./apps/desktop/resources/icon-macos.svg) | SVG 1024×1024，圆角 230 | 无 `tray-glyph` 分组（与上游一致） |
| [`apps/desktop/resources/icon.png`](./apps/desktop/resources/icon.png) | PNG 1104×1104 RGBA | linux.icon + 打包态 About 面板图标 |
| [`apps/desktop/resources/icon-windows.png`](./apps/desktop/resources/icon-windows.png) | PNG 1024×1024 RGBA | win.icon（electron-builder 据此生成 exe/安装器 多尺寸 ICO） |
| [`apps/desktop/resources/icon-macos.png`](./apps/desktop/resources/icon-macos.png) | PNG 1024×1024 RGBA | mac.icon（electron-builder 转 .icns） |
| [`apps/desktop/resources/tray-windows.ico`](./apps/desktop/resources/tray-windows.ico) | ICO，7 档 16/20/24/32/40/48/64（PNG 条目） | 由 `icon-windows.svg` 按仓库自带算法重生成；托盘 + Windows 退出确认对话框图标 |
| [`apps/desktop/installer/assets/brand.png`](./apps/desktop/installer/assets/brand.png) | PNG 600×196 RGBA | 安装器首页品牌区（浅色主题），透明底由安装器按主题填白 |
| [`apps/desktop/installer/assets/brand-2x.png`](./apps/desktop/installer/assets/brand-2x.png) | PNG 1200×392 RGBA | >96 dpi，进度页固定用它 |
| [`apps/desktop/installer/assets/brand-dark.png`](./apps/desktop/installer/assets/brand-dark.png) | PNG 600×196 RGBA | 暗色主题版 |
| [`apps/desktop/installer/assets/brand-dark-2x.png`](./apps/desktop/installer/assets/brand-dark-2x.png) | PNG 1200×392 RGBA | 暗色主题 @2x |
| [`apps/desktop/installer/assets/uninstaller-sidebar.png`](./apps/desktop/installer/assets/uninstaller-sidebar.png) | PNG 164×314 **RGB（无 alpha）** | MUI 侧栏，安装器/卸载器共用；尺寸是契约 |
| [`apps/desktop/renderer/assets/welcome-brand.svg`](./apps/desktop/renderer/assets/welcome-brand.svg) | SVG 472×40 | 欢迎页字标；保持自包含的 `:root` + `prefers-color-scheme` 变量机制 |
| [`apps/web/public/favicon.svg`](./apps/web/public/favicon.svg) / [`favicon-dark.svg`](./apps/web/public/favicon-dark.svg) | SVG 50×50 | **单色**标记，单一 `fill`，明暗两版互为精确字符串替换（`pwa-manifest.e2e.ts` 有断言） |
| [`apps/web/public/icon-192.png`](./apps/web/public/icon-192.png) / [`icon-512.png`](./apps/web/public/icon-512.png) / [`icon-maskable-512.png`](./apps/web/public/icon-maskable-512.png) / [`apple-touch-icon.png`](./apps/web/public/apple-touch-icon.png) | PNG | 由 `icon.svg` 按 `render-app-icons.ts` 的算法（裁掉投影、maskable 缩放 0.82）重生成 |
| [`website/public/favicon.svg`](./website/public/favicon.svg) | SVG 50×50 | 文档站图标，保留品牌渐变 |
| [`packages/client/ui-brand-official/src/client/Brand.tsx`](./packages/client/ui-brand-official/src/client/Brand.tsx) | TSX | 应用内品牌位：`OfficialBrandMark` 渲染新标记（渐变 id 按实例用 `useId` 去重），`OfficialBrandName` 改为**文字字标** |

**重新生成的全部命令**（改了上面任一 SVN 源之后必须重跑）：

```sh
pnpm --dir apps/desktop run render:tray-icon                      # tray-windows.ico
pnpm --filter @deepseek-ai/dsh-web-frontend run render:app-icons  # apps/web/public/icon-*.png
```

`icon.png` / `icon-windows.png` / `icon-macos.png` 三个位图**没有**仓库脚本，是手工从三个 SVG 导出（这是上游的既有约定，见 `apps/desktop/README.zh.md`）；改动后需按同样方式重导。

### 2. 应用内字标

- 侧边栏「deepseek HARNESS」矢量字标（14 条字形 path + 小鲸鱼 + V4 徽标）已换成**文字字标 `Fanyu harness`**，用仓库已内置的 Montserrat Medium（`ui-theme/src/styles/brand-font.css`，OFL）渲染，无新增运行时字体依赖。
- 标记与字标分别在 `sidebar.brand.mark` / `sidebar.brand.name` 两个 slot 上注册，仅在 `DSH_CLIENT_BUILD_PROFILE === 'official'` 时生效——**无签名打包（用户实际构建的方式）就是 official**，见 `apps/desktop/tests/package-target-stages.spec.ts:223`。

### 3. 命名统一（桌面壳）

- [`apps/desktop/src/locale.ts`](./apps/desktop/src/locale.ts)：11 个品牌键 × 8 语言（en/zh/ja/es/fr/de/ru/pt）全部改完；`zh` 块用「维普学域」，其余 7 语言用「Fanyu harness」；`startupAddressInUse` 里的产品缩写 `DSH` 同步改（`dsh web` 命令名保留）；zh 混排空格一并清理。
- [`apps/desktop/src/main.ts`](./apps/desktop/src/main.ts) `setAboutPanelOptions({ applicationName })`：macOS 原生 About 面板的应用名（改 locale.ts 覆盖不到）。
- Windows 单一字符串面：[`electron-builder-config.mjs`](./apps/desktop/scripts/electron-builder-config.mjs) 的 `uninstallDisplayName = '维普学域 (Fanyu harness)'`、`shortcutName = '维普学域'`。

### 4. 命名统一（Web 客户端）

- `DSH_CLIENT_TITLE` = `Fanyu harness`；`apps/web/vite.config.ts` 的 `DEFAULT_CLIENT_TITLE` = `FYH Local Build`（与 `apps/web/index.html` 的 `<title>` 字面量同步）；`brand.localBuild` 8 语言。
- `apps/web/public/manifest.webmanifest`：`name` = `Fanyu harness`，`short_name` = `FYH`；`apple-mobile-web-app-title` = `FYH`。
- `ui-settings-account` 的 `onboardingBrand`、`backToHarness`、`settingsSignedOutTitle/Description`、`quotaDescription` 8 语言。
- `ui-brand-official/locale/*.json` 的插件清单卡片标题（原来叫「DeepSeek 品牌展示」）。

### 5. 残留 appId / 过时声明清理

- [`apps/desktop/.env.windows.example`](./apps/desktop/.env.windows.example)、[`.env.macos.example`](./apps/desktop/.env.macos.example)：`com.deepseek.dsh` → `com.fanyu.harness`（运维最先复制这两个模板，原先只有 `config/*` 改了）。
- [`desktop-package-environment.mjs`](./apps/desktop/scripts/desktop-package-environment.mjs)：本地未签名 macOS 包的 appId 与 Linux 侧对齐为 `com.fanyu.harness`。
- [`macos-notarization-proxy.ts`](./apps/desktop/scripts/macos-notarization-proxy.ts)、[`development-app.ts`](./apps/desktop/scripts/development-app.ts)：缓存目录与开发 bundle id 跟随。
- [`electron-builder.config.d.mts`](./apps/desktop/electron-builder.config.d.mts)：过时的 `protocols: [{ name: 'DeepSeek Harness', schemes: ['dsh'] }]` 类型声明改为 `'Fanyu harness'` / `['fyh']`（它与 `macos-signature.spec.ts:52` 的断言原本就矛盾）。

### 6. 测试基线

桌面壳 17 个 `tests/expected/**` + 6 个 spec、Web 客户端 `ui-sidebar` spec/snapshot、`ui-settings-account/tests/expected` 14 个快照、`apps/web/tests/assembled-boot.ts`、`apps/desktop/tests/pack-local-packages.spec.ts`、`ui-brand-official/tests/browser-plugin.client.spec.tsx` 均已同步。

### 7. 一处可以顺手删的死代码

`packages/client/ui-primitives/src/BrandWordmark.tsx` 仍保留上游的「deepseek HARNESS」矢量字标（16 KB、14 条字形 path + V4 徽标），但**已经没有任何调用方**（`ui-brand-official` 改为自绘文字字标后不再引用它）。它现在只是一个仍在被单测覆盖的孤立导出。建议下一轮连同 `ui-primitives/tests/icons.client.spec.tsx` 的 `BrandWordmark` 用例一起删除，或直接改造成文字字标。`FishLogo` / `FISH_LOGO_PATH` **不能删**：首页鲸鱼 morph、侧栏 fallback、liveshare viewer 仍在用。

---

## 二、待改清单（按可见度排序）

> 行号为改动前的位置，本轮改动后可能有 ±2 行偏移。

### P0 —— 用户一打开就能看见

| # | 位置 | 现状 | 说明与建议 |
| --- | --- | --- | --- |
| 1 | [`ui-conversation/src/client/skeleton/EmptyHero.tsx`](./packages/client/ui-conversation/src/client/skeleton/EmptyHero.tsx) | 首页大号鲸鱼（34px），悬停时鲸鱼摆尾变形 | **本轮刻意未动**。两条变形目标路径 `HERO_SWIM_UP_PATH` / `HERO_SWIM_DOWN_PATH` 是从 `FISH_LOGO_PATH` 的绝对 `M/C/L/Z` 命令按 smoothstep 权重**程序化生成**的（见该文件 74–83 行注释）。直接替换 `FISH_LOGO_PATH` 会让 SMIL 插值错乱，而单测大概率抓不到。要做需重跑生成器，或改为纯 CSS 变换动画。 |
| 2 | [`ui-brand-official/src/client/home-whale/`](./packages/client/ui-brand-official/src/client/home-whale/) | 首页点击后的像素鲸鱼动画 | 不是「换张图」：`renderer.ts:5,91-93` 把 137 帧图集逐像素解红通道=半径、绿=不透明度，`renderer.ts:168-171` 严格校验 192×108×12 帧几何。需重做通道编码图集。注意该 slot 在 `if (profile !== 'official') return` **之前**注册，任何 profile 都会加载。 |
| 3 | [`ui-chat/src/client/assets/running-whale@2x.png`](./packages/client/ui-chat/src/client/assets/running-whale@2x.png) + [`RunningWhaleTail.tsx`](./packages/client/ui-chat/src/client/chat/RunningWhaleTail.tsx) | 对话进行中的鲸鱼尾（APNG，被 CSS `mask` 使用） | 需保持 **APNG 动画 + alpha mask 语义（白=可见）**；reduced-motion 回退的 `REST_PATH` 也要一起换。 |
| 4 | `sidebar.brand.name` slot 契约 | 侧栏字标固定拉丁 `Fanyu harness`，中文界面也是拉丁 | 上游字标本来就是拉丁（`deepseek HARNESS`），本轮沿用了这一点。要改成 zh「维普学域」，需给 `SidebarBrandNameOwnerProps`（`ui-sidebar/src/client/contract/slots.ts:86`）增加品牌名 owner prop，由外壳用 `t()` 传入——**这会动到槽契约与其测试**，故未做。 |
| 5 | [`ui-settings-account/src/client/assets/onboarding-*.webp`](./packages/client/ui-settings-account/src/client/assets/) | 8 张首启/充值插画（390–415 KB ×4 + 180–225 KB ×4） | **图内含渲染好的品牌字样**，需重绘出图。 |
| 6 | [`ui-brand-official/src/client/assets/breach-atlas.webp`](./packages/client/ui-brand-official/src/client/assets/breach-atlas.webp) | 安全页背景底纹 | 同 #2。 |

### P1 —— 应用内文案（量大但机械）

| # | 位置 | 规模 |
| --- | --- | --- |
| 7 | [`ui-plugin-manager/src/client/locales.ts`](./packages/client/ui-plugin-manager/src/client/locales.ts) | **约 200 处**，`DSH` 与 `DeepSeek Harness` 混用；安装/升级/重启/兼容性提示全覆盖 |
| 8 | [`ui-settings-models/src/client/locales.ts`](./packages/client/ui-settings-models/src/client/locales.ts) | `deepSeekAccount`、`onboardingDescription`（"配置 DeepSeek 官方 provider"）、`welcomeBody` 预览公告 ×8 语言 |
| 9 | [`ui-model-selection/src/client/locales.ts`](./packages/client/ui-model-selection/src/client/locales.ts) | `provider.account` = "DeepSeek 账号"（模型选择器分组名，最高频品牌位之一） |
| 10 | [`ui-chat/src/client/locale.ts`](./packages/client/ui-chat/src/client/locale.ts) + [`conversation-nodes/turn-error.ts`](./packages/client/ui-chat/src/client/conversation-nodes/turn-error.ts) | 8 语言；`turn-error.ts:43` 还有一份绕过字典的硬编码英文串（不受 i18n 门禁覆盖） |
| 11 | [`ui-conversation/src/client/locales.ts`](./packages/client/ui-conversation/src/client/locales.ts) | `error.sessionInUse` 提及 `DSH` |
| 12 | [`ui-agent-preset/src/client/locales.ts`](./packages/client/ui-agent-preset/src/client/locales.ts) + [`guide-locales.ts`](./packages/client/ui-agent-preset/src/client/guide-locales.ts) | Creator 模式文案，**会被塞进 prompt** |
| 13 | [`ui-plugin-market/src/client/locales.ts`](./packages/client/ui-plugin-market/src/client/locales.ts) | `statusProvided`、`incompatible`、`noCompatibleVersion`、`exempted` ×8 |
| 14 | [`ui-settings-web-search/src/client/locales.ts`](./packages/client/ui-settings-web-search/src/client/locales.ts) | provider 显示名（**多数属 provider，应保留**）＋ `searchGuideUrl` 指向上游文档站（该改） |
| 15 | [`ui-settings-session-log/src/client/locales.ts`](./packages/client/ui-settings-session-log/src/client/locales.ts) | 遥测说明「帮助改进 DeepSeek 模型与产品」→ 应改成发行方自有表述 |
| 16 | [`ui-entry-customization/src/client/locales.ts`](./packages/client/ui-entry-customization/src/client/locales.ts) | 3 键 ×8，生成插件用的 prompt 模板 |
| 17 | [`ui-sidebar-browser`](./packages/client/ui-sidebar-browser/src/client/locales.ts) / [`ui-sidebar-documentpreview`](./packages/client/ui-sidebar-documentpreview/src/client/office/locales.ts) | 内嵌浏览器 / Office 预览错误串 ×8 |
| 18 | `packages/client/*/locale/*.json`（28 个文件） | **插件清单卡片**会把这些 JSON 的 `meta.title` / `meta.description` 渲染成「设置 → 插件」里的卡片标题与描述。极易漏，因为散在 4 个包的 28 个文件里。 |
| 19 | [`ui-shortcuts/src/client/locales.ts`](./packages/client/ui-shortcuts/src/client/locales.ts) | 显示 `dsh.keybindings.v1` 存储键，需与写入端同步 |

### P2 —— 系统集成面

| # | 位置 | 现状 | 建议 |
| --- | --- | --- | --- |
| 20 | `dsh` CLI 命令名链条 | `scripts/prepare-cli.ts:12`（产出）→ `cli/dsh{,.cmd}`（文件名）→ `src/command-manager-entry.ts:18`（macOS 注册到 `/usr/local/bin/dsh`）→ `scripts/command-path.ps1:99`（Windows PATH 查找）→ `locale.ts` 8 个 `cliCommand*` 键 ×8 语言 | **机器名已统一为 `fyh`，命令名仍是 `dsh`**，是唯一一处不一致。属功能改动（会打断用户既有命令行习惯与 PATH 注册），本轮未动。建议随下一个小版本一起改。 |
| 21 | [`scripts/command-path.ps1`](./apps/desktop/scripts/command-path.ps1) | 注册表键 `Software\DeepSeekHarness\Command`、全局互斥体 `Global\DeepSeekHarness.Command.<sid>` | 既不是上游官方命名也不是下游命名（「第三品牌」）。`regedit` 可见。 |
| 22 | [`command-installation.ts`](./apps/desktop/src/command-installation.ts) | 落盘标记 `.dsh-desktop-command.json`、备份名 `.dsh-command-backup-<uuid>` | 用户在目标目录里能看到，随 #20 一起改。 |
| 23 | [`src/welcome-backend.ts`](./apps/desktop/src/welcome-backend.ts) | `throw new Error('desktop welcome: missing official DeepSeek credential reference')` 会冒泡到致命对话框 `detail` | 错误文案改品牌；命名空间 `llm-deepseek` 是 Host 约定，需协同。 |
| 24 | `dsh-app://` 内部协议、`dsh-auth-*` cookie、`__DSH_*` 全局、`dshDesktop` 等 | 内部标识，但会出现在 DevTools/网络面板 | 低优先级；彻底一致需与 Host 协同。 |

### P3 —— 文档站与仓库文档

| # | 位置 | 现状 |
| --- | --- | --- |
| 25 | [`website/.vitepress/config.ts`](./website/.vitepress/config.ts) | L179 站点 `title` 仍是 `DeepSeek Harness`；L161/L168/L331 社交链接与「编辑此页」指向 `github.com/deepseek-ai/deepseek-harness`；L262 把 **DeepSeek 矢量字标**渲染进导航栏 |
| 26 | [`website/public/wordmark.svg`](./website/public/wordmark.svg) | 10 KB 的 DeepSeek 字标（纯 path，grep 不到 "deepseek" 字样但视觉就是商标）；`config.ts:187` 内联它 |
| 27 | [`website/docs.ts`](./website/docs.ts) | L111 导航/侧边栏 label `'DeepSeek Harness'`，与已改名的 `docs/user/index.md` H1 冲突 |
| 28 | [`website/.vitepress/config.ts`](./website/.vitepress/config.ts) L184/203 | 注释与 CSS 类名 `dsh-wordmark` / `dsh-lockup` / `dsh-tag` |
| 29 | `docs/**` | `architecture.md`/`.zh.md` H1、`glossary.md:5`、`cordis-primer.md:5`、`cordis-tutorial/index.md:5,18,60`、`cli-help*.md`（生成产物，改源头后跑 `pnpm run gen-cli-help`）、`user/index.md:9`（已改，与其余不一致） |
| 30 | 根 Markdown | `README.md:11,15,36,37,51,53`（文档域 `deepseek-harness.github.io`、`git clone .../deepseek-harness.git`、GitHub Discussions、Discord）、`README.zh.md:68,69`（企微/公众号二维码托管在 `cdn.deepseek.com/harness/readme/*.png`）、`CONTRIBUTING*`、`SAFETY*`、`docs/user/guide/{github-review,python-sdk,providers}.md` |
| 31 | [`BRAND_GUIDELINES.md`](./BRAND_GUIDELINES.md) / [`.zh.md`](./BRAND_GUIDELINES.zh.md) | 全文是 **DeepSeek 自己**的商标使用规范。保留义务不变，但下游不应把它当自家规范发布——建议拆成「上游商标声明（保留）+ 下游品牌规范（新写）」。 |
| 32 | [`scripts/project-doc-site.ts`](./scripts/project-doc-site.ts) L26/L143 | `REPOSITORY_URL` 与 raw.githubusercontent 重写都指向上游，改一处可覆盖全站源码链接 |
| 33 | `apps/desktop/README{,.zh}.md`、`docs/diagnostics/README*` | 仍有多处 `DeepSeek Harness`；`packaging/README*.md` 已随 appId 改动同步 |

### P4 —— 包元数据与发行物

| # | 位置 | 规模/说明 |
| --- | --- | --- |
| 34 | `packages/**/package.json` 的 `repository.url` | 约 200 处 `git+https://github.com/deepseek-ai/deepseek-harness.git`；`scripts/check-workspace-constraints.ts:65`、`native/system/test/release-packing.test.js:9` 会校验，需一起改 |
| 35 | `packages/**/package.json` 的 `name` | `@deepseek-ai/*` scope；改它会打断 `docs/user/guide/providers.md` 里 `#deepseek-aidsh-*` 形式的**用户可见 URL 锚点**，涟漪很大 |
| 36 | `python/**` | 分发名 `deepseek-harness-sdk` / `deepseek-harness-runtime-bin`、import 名 `deepseek_harness`、公开类名 `DeepSeekHarness`、可执行文件 `deepseek-harness-sdk-runtime-*`、`authors = [{ name = "DeepSeek" }]`（**署名错误，应为泛语科技**）、4 个上游 URL。注意 PyPI 分发名一旦发布无法回收，且改类名是 semver major。 |
| 37 | [`installed-update-distribution.ts`](./apps/desktop/scripts/installed-update-distribution.ts) | Windows 更新包文件名前缀仍带 `deepseek-harness-`；`desktop-auto-update-environment.mjs:49,58` 的公开下载名 `dsh-latest-<os>-<arch>.exe/dmg` 也是用户可见的浏览器保存名 |
| 38 | [`desktop-publish-config.ts`](./apps/desktop/scripts/desktop-publish-config.ts) L28 | **硬校验**生产 preset 的 origin 必须等于 `https://download.deepseek.com`，与 `desktop-auto-update-environment.mjs:29`、`config/publishing/*/production.json.example:3` 三处互相咬合，改一处会让发布命令直接失败 |
| 39 | `scripts/installed-update-qualification.ts`、`installed-update-identity.mjs` | 资格验证专用应用 `DSH Update Test <id>` / `com.deepseek.dsh.qualification.*`；不随产品发布，但 `binPrefix: 'dsh-desk/'` 与真实发布路径共用 |
| 40 | `packages/experimental/cua-macos` | helper 应用包名 `DSH Computer Use.app`，会出现在 macOS 权限/进程列表；包在 `apps/desktop` 之外 |
| 41 | `apps/desktop/packaging/README*.md`、`publishing/README*.md` | 说明文档与真实值不一致（已改的 appId 等） |

### P5 —— 非 UI，但属于「品牌/合规」范畴（**建议单独一轮，不要混进文案轮**）

| # | 位置 | 说明 |
| --- | --- | --- |
| 42 | `packages/host/product-telemetry-otel/src/index.ts:47` | 默认遥测端点 `https://dsh-otel-collector.deepseeksvc.com/v1/logs`，`serviceName: deepseek-harness`。**下游发行版启用遥测会把用户数据发进上游供应商的 collector**——本轮合规风险最高项，不是文案问题。`packages/session/session-telemetry-otel/src/index.ts:196,197` 联动。 |
| 43 | `packages/llm/llm/src/attribution.ts:41,43` | `product: 'deepseek-harness'` 同时是 `User-Agent` 产品 token **和** `client_metadata["deepseek-harness"]` 的服务端特性开关 key（`llm-deepseek/src/listing.ts:107,143,154`）。改则丢失服务端模型目录/徽章联动，不改则每个请求都在替上游做身份标识。JSDoc 已预留白标口子（可传自定义 `AppIdentity`）——**代价不对称，需产品决策**。 |
| 44 | 账号/用量/充值内嵌页 | origin 与登录授权 URL 由 Host 下发（运行时形如 `https://platform.deepseek.com/...`），客户端无硬编码，属**跨仓库协同项** |
| 45 | `packages/core/system-prompt/src/index.ts:459`、`packages/context/harness-dev-context/src/index.ts:40,51,144,156` | 每个会话系统提示词的固定首句与 runtime context 文本。⚠️ 第 60、68 行的 `prefix` 常量用于**识别并替换已持久化的旧文本**，不同步改会让历史会话里的旧文案永久残留。 |
| 46 | `apps/cli/src/args.ts:156`、`packages/bundle/web-app/src/startup.ts:62`、`packages/bundle/sdk-app/src/index.ts:41` | `dsh --help` 三处描述；`docs/cli-help*.md` 是生成产物 |
| 47 | `scripts/client-build-environment.ts` 以外的构建期标识 | `DSH_*` 环境变量前缀（100+ 处）——功能标识，建议保留 |
| 48 | upstream 自托管 CI 资产 | `scripts/ci-workflow.spec.ts`、`ci-compatible-selfhosted.spec.ts`、`native/system/docs/release.md:53` 仍绑定 `deepseek-harness/deepseek-harness` 与自托管 runner；`FANYU.md` 已另起三端工作流，这些是死代码，但每次同步上游都会冲突 |
| 49 | `packages/util/home-paths` 等处的过期文档 | `packages/skill/skill-filesystem/src/index.ts:53`、`packages/identity/anonymous-user-id/README.md:12,40,96`、`python/sdk-runtime/README.md:9` 仍写 `~/.dsh`，而代码里 `DSH_HOME_DIR_NAME` 已是 `.fyh`。**根 README 曾声明「不改名」，与代码矛盾**（已在本轮外，仍是错的）。 |

---

## 三、刻意保留（不是遗漏）

### A. DeepSeek 是真实模型供应商 —— **不能改**

- 模型路由显示名 `displayName: 'DeepSeek'`（`packages/llm/llm-deepseek-api-key/src/index.ts:78`、`llm-deepseek/src/adapter.ts:34`）、`'DeepSeek Account'`（`llm-deepseek-account/src/index.ts:73`）
- 端点 `platform.deepseek.com`、`api.deepseek.com`（含 `/anthropic`、`/v1/tools`）
- 环境变量 `DEEPSEEK_API_KEY` / `DEEPSEEK_BASE_URL` / `DEEPSEEK_SEARCH_BASE_URL`
- provider / 命名空间 id：`deepseek-official`、`deepseek-account`、`llm-deepseek`、`web-search-deepseek`、`session-log-deepseek`、`deepseek-search-api`、`deepseek-fetch-api`
- `packages/llm/**`、`packages/web/web-*-deepseek/**`、`packages/credentials/deepseek-account*/**`
- `docs/deepseek-llm-api-wire-extensions.md`、`docs/user/guide/providers.md` 的 DeepSeek 段落

> ⚠️ 注意 `packages/util/brand`（`@deepseek-ai/dsh-brand`）是**红鲱鱼**：里面的 `Branded<B>` / `brandString` 是 TypeScript 的**标称类型（nominal branding）**，与产品品牌无关。批量改名脚本必须白名单跳过它，否则会改坏类型。

### B. 上游归属与法律署名 —— **保留但需注意措辞**

- 商标归属声明：`README.md:7`、`README.zh.md:7`、`docs/user/index.md:13`、`FANYU.md:5` —— 措辞已正确（"DeepSeek Harness is a trademark of DeepSeek; this project is not affiliated with or endorsed by DeepSeek"）
- `THIRD_PARTY_NOTICES.md` 与生成器 `scripts/gen-third-party-notices.ts`
- `README.md:69-77` 引用 upstream 成果的 BibTeX（`DeepSeek-AI` 署名正确）
- `FANYU.md` 与工作区根 `README.md` 中对上游的指代

### C. 功能标识 —— **保留**

`dsh` 命令名（本轮）、`DSH_*` 环境变量、`dsh://`（已被 `fyh://` 取代，但 Host 侧仍可能有引用）、`@deepseek-ai/*` npm scope（本轮）、CSS token `--dsw-static-deepseek-*`（14 处定义、30+ 处引用，改错会让颜色 token 大面积失效，收益为零）

---

## 四、测试基线注意事项

改动文案后**必须同步**的基线：

- 可由脚本刷新的：`apps/web/tests/expected/**`（15 个文件含 `DeepSeek Harness`）。需 `DSH_SNAPSHOT=refresh pnpm run test:web`（需要依赖与 `DEEPSEEK_API_KEY` 之外的环境），**本机无 `node_modules` 无法执行**，请在有依赖的环境补跑。
- 不可自动刷新的（本轮已手工同步）：`apps/desktop/tests/expected/**`（17 个）、`apps/desktop/tests/*.spec.ts`（6 个）、`packages/client/ui-sidebar/tests/**`、`packages/client/ui-settings-account/tests/expected/**`（14 个）、`apps/web/tests/{assembled-boot.ts,pwa-manifest.e2e.ts,built-boot.expected.e2e.ts}`、`scripts/client-build-environment.client.spec.ts` 等。
- **已修正的遗留**：`apps/desktop/tests/fatal-recovery.spec.ts:31` 与 `tests/expected/fatal-dialog-with-report-{en,zh-CN}.txt:5` 里的崩溃日志路径原为 `...\Roaming\DeepSeek Harness\logs\...`，与打包清单 `name = fyh` 决定的真实路径 `%APPDATA%\fyh\logs` 不符；本轮已三处同步改为 `fyh`（**不是** `Fanyu harness`）。

---

## 五、上游同步注意事项

- git 根目录是**工作区根**（`fanyu-harness/` 的上一级）。`git` 命令在根目录执行，`pnpm` 命令在 `fanyu-harness/` 内执行。
- **GitHub 只读仓库根目录的 `.github/workflows/`**。上游的 66 个 `.github` 文件都在 `fanyu-harness/.github/` 下，因此**全部不会在 GitHub 上运行**（这既避免了它们的自托管 runner 报错，也意味着三端打包工作流必须放在工作区根）。详见 [`PACKAGING-GITHUB.zh.md`](./PACKAGING-GITHUB.zh.md)。
- 与上游 merge 时的优先级：**身份字段、图标美术与本清单以本仓库为准**（`desktop-product-identity.mjs`、`package-target.ts` 的 linux 目标、`electron-builder-config.mjs` 的 linux 段与 policy 注入条件、`main.ts` 的首次启动分支、`resources/icon*.{svg,png}`、`installer/assets/*`），其余跟随上游。
- 每次同步上游后，请重跑 `render:tray-icon` 与 `render:app-icons`，并用 `git diff --stat` 确认图标位图没有被上游覆盖。
