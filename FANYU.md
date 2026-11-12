# Fanyu harness — 泛语科技下游发行版

本仓库是 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的下游发行版，由泛语科技维护。产品中文名为 **维普学域**，英文名为 **Fanyu harness**，公司名为 **泛语科技**。

Fanyu harness is developed by 泛语科技 and built on DeepSeek Harness (`dsh`). DeepSeek Harness is a trademark of DeepSeek; this project is not affiliated with or endorsed by DeepSeek.

## 上游基线

| 项目 | 值 |
| --- | --- |
| 上游仓库 | `https://github.com/deepseek-ai/deepseek-harness.git`（remote `upstream`） |
| 基线 | 上游 `master` 分支的 v0.2.2-rc.1 发布提交（用 `git log upstream/master -1` 查看确切提交） |
| 本仓库分支 | `main` |
| 基础运行时 | Node ≥ 24.9，pnpm 11.28.5 |

## 仓库布局

git 根目录是**工作区根**（`fanyu-harness/` 的上一级），`fanyu-harness/` 是代码子目录。仓库只跟踪 `fanyu-harness/`、`README.md` 与 `.gitignore`，其余（`logs/`、`artifacts/`、`tools/`、`.cache/`、`node_modules/`、`.desktop-build/`）全部忽略。

- `git` 命令在**工作区根目录**执行
- `pnpm` / `npm` 命令在 **`fanyu-harness/`** 内执行

历史只有两段：`init: DeepSeek Harness v0.2.2-rc.1 官方最新版快照`（上游发布版本的完整工作树，不含上游历史），以及其后的下游提交（品牌化 + Linux 打包、去掉登录页、若干修正/文档提交，以及维普学域品牌改造）。

## 与上游的差异

只有下面三类改动，内部功能全部保持上游默认行为。

### 1. 品牌：维普学域 / Fanyu harness

产品中文名为 **维普学域**，英文名为 **Fanyu harness**，法律主体仍是 **泛语科技**（`copyright`、`author`、`homepage` 不变）。

- `productName`、协议显示名、安装包文件名前缀、macOS 麦克风用途说明改为 Fanyu harness。
- `appId` 默认值与四份打包 env 示例改为 `com.fanyu.harness`。
- `copyright` 为 `Copyright © 2026 泛语科技`；`apps/desktop/package.json` 的 `author` 为 `泛语科技 <dev@fanyu.tech>`（deb/FPM maintainer 来源）。
- Windows 安装器 8 种语言文案、安装失败报告标题、macOS 应用包名、Windows 可执行文件名与 `dsh` 命令行入口同步改名。
- **Windows 单一字符串面用中文名**：`uninstallDisplayName = 维普学域 (Fanyu harness)`、`shortcutName = 维普学域`；`productName` 仍是 ASCII 的 `Fanyu harness`，保证 bundle 目录、可执行文件与 CLI 入口路径安全。
- 应用内文案按界面语言分流：`zh` 用「维普学域」，其余 7 种语言用「Fanyu harness」。
- 身份字符串集中在一处：`apps/desktop/scripts/desktop-product-identity.mjs`（`DESKTOP_PRODUCT_NAME`、`DESKTOP_ARTIFACT_PREFIX`、`DESKTOP_EXECUTABLE_NAME`、`DESKTOP_PROTOCOL_SCHEME`），所有产物名与路径从这里派生，避免改名后生产者与消费者不一致。
- **图标已换成维普学域标记**（上游鲸鱼图标已被替换）：三平台图标源与位图、托盘 ICO、安装器品牌图与卸载侧栏图、欢迎页字标、Web/PWA 图标与 favicon、应用内侧栏标记与字标。清单与重生成命令见 [`BRANDING.zh.md`](./BRANDING.zh.md)。
- 仍有未改的品牌面（动画类鲸鱼美术、应用内其余文案、文档站、包元数据等）同样登记在 [`BRANDING.zh.md`](./BRANDING.zh.md)。

#### 机器可读名统一为 `fyh`，显示名仍是 Fanyu harness

上游把目录与协议都命名成 `dsh`，结果本发行版与官方版在同一台机器上会**共用同一份用户数据**。本发行版把机器可读名统一成 `fyh`：

| 用途 | 上游默认 | 本发行版 |
| --- | --- | --- |
| Windows 可执行文件 | `Fanyu harness.exe` | `fyh.exe`（`win.executableName = DESKTOP_EXECUTABLE_NAME`） |
| Windows 安装目录 | `%LOCALAPPDATA%\Programs\Fanyu harness` | `%LOCALAPPDATA%\Programs\fyh` |
| 应用数据 userData | `%APPDATA%\@deepseek-ai\dsh-desktop` | `%APPDATA%\fyh`（打包清单 `name` = `fyh`） |
| 更新缓存 | `%LOCALAPPDATA%\@deepseek-aidsh-desktop-updater` | `%LOCALAPPDATA%\fyh-updater` |
| Harness 主目录 | `~/.dsh` | `~/.fyh`（`packages/util/home-paths` 的 `DSH_HOME_DIR_NAME`） |
| 深链协议 | `dsh://` | `fyh://` |

显示名不动：窗口标题、安装器 8 种语言文案、开始菜单/桌面快捷方式名、卸载显示名仍是 **Fanyu harness**。

改名的连带影响都跟随同一处常量：Windows 命令行入口 `apps/desktop/cli/dsh.cmd` 指向 `fyh.exe`；`smoke-packaged-runtime.ts` 按 `DESKTOP_EXECUTABLE_NAME` 定位可执行文件；`main.ts` 注册 `fyh://` 深链。测试基线同步在 `apps/desktop/tests/{cli-launcher,command-management,macos-signature,welcome-startup}.spec.ts`、`apps/desktop/tests/expected/command-management-win32-*.json`、`packages/util/home-paths/tests`、`packages/shell/shell-env/tests`。

注意：**升级影响**——`~/.dsh` 与 `%APPDATA%` 下的旧数据不会自动迁移，改名后的首次启动会重新生成 profiles、凭据与设置。

### 2. 首次启动直接进入工作区（去掉登录页）

- 改动点：`apps/desktop/src/main.ts` 的 `openInitialWindow()`。上游逻辑是「无账号凭证且无 API Key → 打开登录欢迎窗口并隐藏主窗口」，本发行版删除该分支，任何一次启动都直接 `enterWorkspace()`。
- 登录能力没有删除：欢迎窗口组件、IPC、preload 全部保留，仍是**退出登录 / 会话过期**的去处；应用内账号菜单 → 登录 → `SignInDialog` 照常可用，浏览器授权链路不受影响。
- 覆盖该行为的测试是 `apps/desktop/tests/welcome-startup.spec.ts`（首次启动断言进入工作区；转入登出态后仍完整覆盖欢迎窗口的原有断言）。

### 3. Linux 打包支持与无签名构建

- 新增 `linux-x64` / `linux-arm64` 打包目标（`AppImage` + `deb` + `tar.gz`），来自社区第三方 Linux 打包方案的移植（参照副本存放在工作区外的 `~/fanyu-refs/deepseek-harness-linux`），并适配到当前上游基线。
- `--unsigned` 在 Linux 上与 macOS 同义：完全不读 `.env.linux`、不注入强制更新策略、不需要任何凭证。强制更新策略只在真正发行它的平台（win32、已签名的 darwin）注入，因为带策略的 Linux 包会在启动时因 "unsupported platform" 直接弹致命错误对话框。
- Linux 侧的运行时细节已处理：Electron 二进制路径、`chmod`、libfuse2 工具链探测、解包目录/资源目录/可执行文件名解析、Linux 上跳过 Office 转换检查、`linux-package` 阶段与 `DSH_DESKTOP_LINUX_PACK_CONCURRENCY`。

## 构建与打包

### 准备

```sh
# 依赖（国内网络建议加镜像，实测 npmjs 抖动明显）
pnpm config set registry https://registry.npmmirror.com/ --location=user
pnpm install --frozen-lockfile
pnpm run build                 # build:artifacts + build:check
```

### Linux（本机可完成）

```sh
export DSH_DESKTOP_PACKAGE_CACHE_DIR="$PWD/../.cache/desktop-package"
export DSH_DESKTOP_NPM_REGISTRY=https://registry.npmmirror.com
export DSH_DESKTOP_LINUX_PACK_CONCURRENCY=4
pnpm --dir apps/desktop run package:linux:x64:unsigned
# 另有：package:linux:x64（发行模式，需要 .env.linux）、package:linux:x64:dir（不生成安装包）
```

产物目录：`apps/desktop/.desktop-build/targets/linux-x64/unsigned-artifacts/`，形如 `fanyu-harness-<version>-linux-x86_64-unsigned.AppImage`、`fanyu-harness-<version>-linux-amd64-unsigned.deb`、`fanyu-harness-<version>-linux-x64-unsigned.tar.gz`（注意三种格式对架构的写法不同：AppImage 用 `x86_64`，deb 用 `amd64`，tar.gz 用 `x64`）。

AppImage 的桌面入口是 `Exec=AppRun %U`：由打包脚本里的 `appImage.executableArgs: []` 保证。electron-builder 在拿不到 appimage toolset 时会默认往桌面入口塞 `--no-sandbox`，那会让所有用户永久关闭 Chromium 沙箱；置空后由 AppImage 自带的 AppRun 在启动时探测 user namespace，只有在确实不可用时才自行加 `--no-sandbox`。

系统依赖（Arch 名称）：`fuse2`、`squashfs-tools`、`gtk3`、`nss`、`alsa-lib`、`libxtst`、`at-spi2-core`、`mesa`，以及 **`libxcrypt-compat`**。最后一个是 deb 打包必需的：electron-builder 会下载便携版 fpm（Ruby 3.4），它依赖 `libcrypt.so.1`，而 Arch 的新 glibc 已不再提供该库，缺了它会以 `fpm ... failed 127` 报错。Ubuntu 上对应 `libfuse2t64`（24.04+）或 `libfuse2`、`libasound2t64` 或 `libasound2`，`libcrypt` 系统自带。

### Windows

Windows NSIS 安装器必须在 Windows x64 主机上构建（打包脚本对宿主平台有硬性校验，且安装器外壳需要 MSVC 编译）：

```sh
pnpm --dir apps/desktop run package:win:x64:unsigned
```

### macOS

macOS 的 DMG/ZIP 必须在 macOS 主机上构建（脚本对宿主平台有硬性校验，DMG 依赖 `hdiutil`）：

```sh
pnpm --dir apps/desktop run package:mac:arm64:unsigned
pnpm --dir apps/desktop run package:mac:x64:unsigned
```

## 代码签名：当前阶段刻意不做

当前处于早期开发阶段，所有构建一律走官方仓库自带的**无签名路径**，不申请证书、不伪造证书：

- Linux：AppImage/deb/tar.gz 本身无签名概念，无需任何密钥。
- Windows：`package:win:x64:unsigned` 跳过证书、SignTool、PIN 与签名缓存校验。
- macOS：`package:mac:*:unsigned` 走 `localMacOSPackageEnvironment()`，不读 `.env.macos`，使用 ad-hoc 签名保证可运行。

后续补签名时需要补的东西（现在不配）：

- Windows：EV 证书 + SignTool 路径 + PIN + 签名缓存目录，以及 `apps/desktop/windows-signing/README.md` 描述的自托管运行器。
- macOS：`CSC_LINK` / `CSC_KEY_PASSWORD`、`DSH_DESKTOP_MACOS_SIGNING_IDENTITY`、`DSH_DESKTOP_MACOS_TEAM_ID`，以及一种公证策略。
- 三端发布：`desktop-test` / `desktop-production` 环境与相应仓库密钥。

## 持续集成（Windows + Linux + macOS）

上游自带的 `windows-package.yml` / `macos-package.yml` 绑定 DeepSeek 的自托管 runner（`dsh-win-package-trial`、`[self-hosted, macOS, ARM64, ...]`），泛语科技的仓库没有这些 runner。无签名构建使用本仓库新增的 `/.github/workflows/fanyu-desktop.yml`，跑在 GitHub 托管 runner 上（`windows-latest` + `ubuntu-24.04` + `macos-15`），只产出无签名安装包（Windows NSIS exe / Linux AppImage + deb + tar.gz / macOS dmg），不发布、不需要任何密钥。

**macOS 腿只出 Apple Silicon**（`mac-arm64`，runner `macos-15`）：Intel 包（`mac-x64`）需要 Intel 主机或 Rosetta，产物架构不同且在 arm64 镜像上无法验证，所以不在矩阵里；真要 Intel 包时加一条 runner 为 `macos-15-intel`、脚本为 `package:mac:x64:unsigned` 的矩阵项。代价是私有仓库里 GitHub 按 10 倍倍率扣 macOS runner 分钟，一次三端构建约吃掉免费额度 2000 分钟里的 500 分钟；仓库转公开则不受分钟数限制。

**注意工作流的位置**：git 根目录是工作区根，而 GitHub 只读取**仓库根目录**的 `.github/workflows/`。上游那 66 个 `.github/` 文件都在 `fanyu-harness/.github/` 下，因此全部不会在 GitHub 上运行；打包工作流必须放在工作区根的 `.github/workflows/`。细节与推送手册见 [`PACKAGING-GITHUB.zh.md`](./PACKAGING-GITHUB.zh.md)。

## 从上游同步

在工作区根目录执行：

```sh
git fetch upstream master
git log --oneline main..upstream/master        # 看上游新增了什么
git merge upstream/master --allow-unrelated-histories   # 只有第一次需要该参数，见下
cd fanyu-harness && pnpm install --frozen-lockfile && pnpm run build && pnpm exec vitest run apps/desktop/tests
```

注意：`init` 提交是**快照**，与上游 git 历史没有共同祖先，所以第一次合并必须带 `--allow-unrelated-histories`（冲突会集中在 `apps/desktop/{scripts,src}`、`installer`、`docs`）；合并一次之后两边就有了共同祖先，后续 `git merge upstream/master` 即可。

冲突时的优先级：**身份字段与 Linux 目标以本仓库为准**（`desktop-product-identity.mjs`、`package-target.ts` 的 linux 目标、`electron-builder-config.mjs` 的 linux 段与 policy 注入条件、`main.ts` 的首次启动分支），其余一律跟随上游。

## 占位数据（后续需要替换）

| 值 | 位置 | 说明 |
| --- | --- | --- |
| `com.fanyu.harness` | 4 份 `apps/desktop/config/*/​*.env.example` | 真实打包配置在机器本地 `packaging/presets/*.env`，不在仓库里 |
| `dev@fanyu.tech` | `apps/desktop/package.json` `author.email` | deb/FPM maintainer 用的占位邮箱 |
| `https://fanyu.tech` | `apps/desktop/package.json` `homepage` | deb 元数据必须要有 homepage，这是占位域名 |
| `Copyright © 2026` | `apps/desktop/scripts/electron-builder-config.mjs` | 年份写死，建议改为取当前年份 |
| 版本号 `0.2.2-*` | 各 `package.json` | 仍跟随上游，正式发版前另定版本策略 |

## 已知差距（后续迭代）

完整台账见 [`BRANDING.zh.md`](./BRANDING.zh.md)（含文件与行号）。要点：

1. **动画类鲸鱼美术仍是上游的**：首页大号鲸鱼（`ui-conversation/.../EmptyHero.tsx`，其摆尾变形路径由上游鲸鱼几何程序化生成，换标记会静默撕裂 morph）、首页点击的像素鲸鱼（`ui-brand-official/src/client/home-whale/`，137 帧图集按通道编码，不是换图能解决）、对话加载鲸鱼尾 `running-whale@2x.png`（APNG + alpha mask 语义）。
2. **应用内其余文案仍为上游原文**：`ui-plugin-manager`（约 200 处）、`ui-settings-models`、`ui-model-selection`、`ui-chat`、`ui-conversation`、`ui-agent-preset`、`ui-plugin-market`、`ui-settings-session-log` 等，以及 28 个 `locale/*.json` 的插件清单卡片文案。
3. **侧栏字标是拉丁的**：本轮把字标改成了文字，但固定为 `Fanyu harness`；中文界面要显示「维普学域」需给 `sidebar.brand.name` 的 owner props 增加本地化品牌名，会牵动槽契约与其测试，故未做。
4. **文档站标题与字标**：`website/.vitepress/config.ts` 的站点标题、导航栏内联的 DeepSeek 矢量字标、社交与「编辑此页」链接（指向上游仓库）仍是上游品牌；`docs/**` 亦同。
5. **发布/更新链路**：`installed-update-distribution.ts` 的更新包文件名、`desktop-auto-update-environment.mjs` 的 `dsh-latest-*` 公开下载名，以及三处互相咬合的 `download.deepseek.com` 域名校验属于发布阶段，本轮未接。
6. **`dsh` CLI 命令名未改**：机器可读名已统一为 `fyh`，但命令行入口（`/usr/local/bin/dsh`、`dsh.cmd`、注册表键 `Software\DeepSeekHarness\Command`）仍是 `dsh`。属功能改动，建议随下一个小版本处理。
7. **遥测默认出口指向上游供应商**：`packages/host/product-telemetry-otel/src/index.ts` 默认 collector 是 `deepseeksvc.com`；`packages/llm/llm/src/attribution.ts` 的 `product` token 同时是服务端特性开关 key（代价不对称）。属合规/协议议题，不在文案轮。

## 已知问题：Linux 上 Electron + sharp 的 glib 冲突

现象：在 glib 较新的发行版（如 Arch Linux 的 `glib2 2.88`）上，以 `ELECTRON_RUN_AS_NODE=1` 运行打包后的运行时，加载 `sharp` 正常，但首次 libvips 操作即以 `SIGSEGV` 退出（打包脚本的 `runtime:smoke` 阶段会因此失败）。

原因：这是 Electron 的已知缺陷 [electron#46323](https://github.com/electron/electron/issues/46323)。Electron 在 Linux 上动态链接系统 glib 并把符号泄漏进进程空间，与 sharp 预编译的 libvips 冲突。sharp 官方安装文档的 Electron 章节对此有说明。

影响范围：`sharp` 相关的图像处理能力。应用启动与其余功能不受影响。Ubuntu 24.04（glib 2.80）不受影响，因此 CI 上的完整冒烟仍然全绿。

绕过方式（仅限开发机）：`DSH_DESKTOP_DEFER_RUNTIME_SMOKE=1` 会让 `package-target.ts` 跳过 `prepare:dsh` 的运行时负载冒烟，但**不改变 CI 的默认行为**，也不修改冒烟脚本本身。

```sh
DSH_DESKTOP_DEFER_RUNTIME_SMOKE=1 pnpm --dir apps/desktop run package:linux:x64:unsigned
```

长期方案：跟随 Electron 修复该缺陷后升级 Electron，或在 Linux 上改用与 Electron 兼容的 libvips 构建。
