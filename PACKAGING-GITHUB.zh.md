# 用 GitHub Actions 打三端包（配置与操作手册）

目标：把 Windows / macOS / Linux 三个无签名安装包交给 GitHub 托管的 runner 构建，避免本机打包的环境依赖与耗时。

---

## 一、最关键的结论：之前那份 workflow 永远不会运行

GitHub 只会读取**仓库根目录**的 `.github/workflows/`。

本仓库的 git 根目录是**工作区根**（`fanyu-desktop/`），而全部 66 个 `.github/` 文件都在**代码子目录** `fanyu-harness/.github/` 下。结果是：

- 上游自带的 80 多个 workflow（`ci.yml`、`windows-package.yml`、`macos-package.yml`…）**一个都没在 GitHub 上跑过**；
- 之前放在 `fanyu-harness/.github/workflows/fanyu-desktop.yml` 的三端打包工作流**同样从未运行**。

本轮已修正：

| 动作 | 路径 |
| --- | --- |
| **新增**（GitHub 实际读取的位置） | `/.github/workflows/fanyu-desktop.yml`（工作区根，已入库） |
| **删除**（永远不会运行的死副本） | `fanyu-harness/.github/workflows/fanyu-desktop.yml` |

新工作流用 `defaults.run.working-directory: fanyu-harness` 把每条命令落到代码目录，并把所有产物路径前缀成 `fanyu-harness/apps/desktop/...`。**两份文件之间没有任何自动联动**，所以死副本直接删掉，避免以后又改错那一份。

> 附带好处：`fanyu-harness/.github/` 下那些绑定 DeepSeek 自托管 runner 的上游 workflow 依然不会运行，不会因为找不到 `dsh-win-package-trial` 之类 runner 而报红。

---

## 二、工作流做了什么

矩阵三腿，全部跑 GitHub 托管 runner，不发布、不需要任何密钥：

| 目标 | runner | 命令 | 产出 |
| --- | --- | --- | --- |
| `linux-x64` | `ubuntu-24.04` | `pnpm --dir apps/desktop run package:linux:x64:unsigned` | `*.AppImage`、`*.deb`、`*.tar.gz` |
| `win-x64` | `windows-latest` | `pnpm --dir apps/desktop run package:win:x64:unsigned` | `*.exe`（NSIS）+ `.blockmap` |
| `mac-arm64` | `macos-15` | `pnpm --dir apps/desktop run package:mac:arm64:unsigned` | `*.dmg`、`*.zip` |

- 三条腿都跑完整的 `pnpm install --frozen-lockfile` + `pnpm --dir apps/desktop run package:*`，含运行时准备与冒烟检查。
- Windows 腿额外写一份占位 `apps/desktop/.env.windows`：**无签名 Windows 包仍会注入并校验强制更新策略**，所以必须有 HTTPS 占位域名与 `allowedAuthOrigins`。这些域名在构建期不会被访问。
- Linux 腿装 `squashfs-tools` + `libfuse2t64`，并把 AppImage 解包校验 payload 结构。
- 每条腿把产物上传为 artifact `fanyu-harness-<target>-unsigned`，保留 14 天。**不发布、不上传更新源、不做公证、不做签名。**

### 触发方式

```sh
# 方式一：手动触发（推荐第一次用这个）
#   GitHub 仓库页 → Actions → "Desktop packages (unsigned, all platforms)" → Run workflow

# 方式二：推 tag
git tag fanyu-desktop-v0.2.2-rc.1
git push origin fanyu-desktop-v0.2.2-rc.1
```

刻意**不**使用 `desktop-v*` 前缀——那个前缀属于上游的签名发布流程。

产物在哪：仓库 → Actions → 选那次运行 → 页面底部 **Artifacts** → 下载对应 zip。

---

## 三、前置条件（都已核对）

| 条件 | 状态 |
| --- | --- |
| Node ≥ 24.9 | 工作流用 `actions/setup-node@v7.0.0` 装 Node 24 ✓ |
| pnpm **11.28.5** | 工作流显式写 `version: 11.28.5`。**必须显式写**：`pnpm/action-setup` 默认去仓库根找 `package.json` 读 `packageManager`，而本仓库的 `package.json` 在 `fanyu-harness/` 下，自动发现会失败。改版本时请与 `fanyu-harness/package.json` 的 `packageManager` 同步。 |
| Windows 需要 MSVC C++ 工具链 | `desktop-toolchain-preflight.ts` 用 `vswhere -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64` 预检，缺了直接终止（安装器外壳 `installer/window-frame.cpp` 要用 `cl.exe` 编译）。`windows-latest` 自带 ✓ |
| macOS 需要 arm64 主机 | `package:mac:arm64` 在非 arm64 主机上拒绝启动；`macos-15` 是 Apple Silicon ✓（仓库自己的注释也确认：「`macos-latest` is Apple Silicon; `macos-15-intel` is native x64」） |
| Apple 公证 / 代码签名 | **不需要**：`--unsigned` 走 `localMacOSPackageEnvironment()`，不读 `.env.macos`，用 ad-hoc 签名保证可运行 |
| 任何 Secrets | **不需要**。工作流里没有一处引用 `secrets.*` |

可选：如果 GitHub 到 npmjs 太慢，在仓库 **Settings → Variables** 里加一个 `DSH_DESKTOP_NPM_REGISTRY`（例如 `https://registry.npmmirror.com`）——工作流已经写成 `vars.DSH_DESKTOP_NPM_REGISTRY || 'https://registry.npmjs.org'`。托管 runner 在国外，通常**不需要**加。

---

## 四、第一次推送

仓库目标：**`wm26hua/fanyu-harness`（私有）**。本会话已把 `origin` 配好：

```sh
git remote -v
# origin    git@github.com:wm26hua/fanyu-harness.git (fetch)
# origin    git@github.com:wm26hua/fanyu-harness.git (push)
# linux-fork https://github.com/Zhou-Yujing114514/deepseek-harness-linux.git
# upstream   https://github.com/deepseek-ai/deepseek-harness.git
```

推送步骤：

1. 在 GitHub 上建一个**空的私有仓库** `fanyu-harness`（**不要**勾选 README / .gitignore / license，否则会与本地历史冲突）。
2. 先确认工作树状态、提交本轮改动。
3. 推送。

```sh
# 在 fanyu-desktop/（工作区根）执行
git status --short
git add -A
git commit -m "feat(brand): 维普学域 / Fanyu harness 品牌改造，图标与命名全量替换；三端打包工作流移到仓库根"
git push -u origin main
```

推送后到 `https://github.com/wm26hua/fanyu-harness/actions` 确认工作流已出现在列表里——**这是验证「位置修对了」的唯一可靠办法**。

---

## 五、SSH 诊断结果（本会话实测）

**结论：你系统里有一把 GitHub 用的 SSH 私钥，但它没有注册到 GitHub 上，所以现在用 SSH 推不上去。**

### 扫到的东西

| 项目 | 实际情况 |
| --- | --- |
| SSH 私钥 | `~/.ssh/id_ed25519`（另有 `.pub`），类型 ed25519，注释 `wm26hua-pc` |
| `~/.ssh/config` | 只有两个自用主机（`wm26hua.xyz`、`baota`），**没有** `Host github.com` 条目 |
| `~/.ssh/known_hosts` | 含 `[ssh.github.com]:443`，说明以前用过 SSH-over-443 |
| GitHub 账号 | **`wm26hua`** —— 依据：同机 `~/Documents/fanyu/nixcfg` 的 remote 是 `git@github.com:wm26hua/nixcfg.git`；Windows 凭据管理器里有 `git:https://github.com` 与 `git:https://wm26hua@github.com`（User: `wm26hua`） |
| DNS | `github.com` → `198.18.1.49`、`ssh.github.com` → `198.18.1.50`（是本机代理/VPN 的 fake-IP 网段，不是 GitHub 真实地址） |
| SSH :22 | `ssh -T git@github.com` → `Connection closed by 198.18.1.49 port 22`（**被本机代理截断，22 端口不通**） |
| SSH :443 | `ssh -p 443 -T git@ssh.github.com` → `git@ssh.github.com: Permission denied (publickey)`（**传输通，但 GitHub 不认这把钥匙**） |
| `gh` CLI | 未安装 |
| git HTTPS | 在本会话沙箱里 schannel 后端报 `SEC_E_NO_CREDENTIALS`；换 `-c http.sslBackend=openssl` 后 `git ls-remote` 公开仓库成功 |

### 要你需要提供/做的事

**方案 A：把公钥加到 GitHub（推荐，一次到位）**

把这行加到 <https://github.com/settings/keys>（New SSH key）：

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIHrSAt8jdxOrsZll6fn6R7qXyDkqmSpRC9bU+gbOOij wm26hua-pc
```

因为本机 **22 端口被代理截断**，还要在 `~/.ssh/config` 里加一段（不要删掉你现有的两个 Host）：

```
Host github.com
  HostName ssh.github.com
  Port 443
  User git
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
```

验证：

```sh
ssh -T git@github.com
# 期望：Hi wm26hua! You've successfully authenticated, but GitHub does not provide shell access.
```

**方案 B：走 HTTPS + PAT，完全绕开 SSH**

1. 建一个 fine-grained PAT（至少 `Contents: Read and write` + `Metadata: Read`）。
2. 改用 HTTPS remote，让 Windows 凭据管理器记住它：

```sh
git remote set-url origin https://github.com/wm26hua/fanyu-harness.git
git push -u origin main     # 首次输入用户名 wm26hua + 粘贴 PAT
```

> 注意：本会话沙箱里 `git` 的 schannel 后端取不到凭据句柄。如果在你自己的终端里也遇到 `SEC_E_NO_CREDENTIALS`，加一句 `git config --global http.sslBackend openssl` 即可（这也正是本会话能成功访问 GitHub 的方式）。

**方案 C：我只需要你确认仓库名，推送你自己来**

工作流已经就位，跟 remote 无关。你在自己的终端 `git push` 之后，Actions 页面就会出现工作流。

---

## 六、GitHub 打包 vs 本机打包

| | GitHub 托管 runner | 本机 |
| --- | --- | --- |
| 三端同时构建 | ✅ 三个 job 并行 | ❌ Windows 只能出 Windows 包；macOS 的 DMG 必须 macOS 主机 |
| Windows 前置 | 自带 VS 2022 + VC Tools | 需自己装约 4 GB 的 VS Build Tools |
| 缓存 | `runner.tool_cache`（Electron 归档 + pnpm store），但**托管 runner 每次是新机器**，缓存靠 `tool_cache` 卷复用 | 可持续复用 |
| 首次耗时 | `pnpm install` + 三腿各自构建，Windows/macOS 通常各 20–40 分钟 | 首次同样慢，之后增量快 |
| 密钥 | 不需要 | 不需要 |
| 产物保存 | Artifact，14 天 | 本地 `.desktop-build/targets/*/unsigned-artifacts/` |

**本机打包慢的常见原因**（与 GitHub 无关，可单独优化）：`DSH_DESKTOP_PACKAGE_CACHE_DIR` 没设导致 Electron 归档每次重下；`TEMP` 落到慢盘导致 esbuild 清理被拒；`DSH_DESKTOP_DEFER_RUNTIME_SMOKE=1` 可跳过运行时冒烟（**但 CI 上不要设**）。

---

## 七、可预期的失败与排查

| 现象 | 原因与处理 |
| --- | --- |
| Actions 页面里**根本看不到**这个工作流 | 工作流没在仓库根 `.github/workflows/`；确认 `git ls-files \| grep '^\.github/'` 有输出 |
| `pnpm: command not found` 或 pnpm 版本不对 | `pnpm/action-setup` 的 `version` 与 `fanyu-harness/package.json` 的 `packageManager` 不一致 |
| Windows 腿在 `toolchain` 步骤失败 | runner 镜像里缺 `Microsoft.VisualStudio.Component.VC.Tools.x86.x64` |
| macOS 腿报宿主不符合 | 矩阵里把 `macos-15` 换成了 x64 镜像；`package:mac:arm64` 只接受 arm64 宿主 |
| `pnpm install` 因 lockfile 政策失败 | pnpm 版本低于 11.28.5 |
| Windows 腿报 `.env.windows` 缺字段 | 工作流里那份占位配置被改动过；`.env.windows.example` 是权威清单 |
| Linux 腿 `fpm ... failed 127` | 缺 `libcrypt`；Ubuntu 自带，如换镜像需补 |
| 产物为空、`if-no-files-found: error` 报错 | 打包实际失败但退出码被吞；去该腿的 `Package` 步骤日志里找真正的错误 |

---

## 八、以后改品牌/图标时注意

`render:tray-icon` 与 `render:app-icons` 都是**手工/脚本生成的产物入库**，CI 只消费不入库：

```sh
pnpm --dir apps/desktop run render:tray-icon                      # 改 icon-windows.svg 后
pnpm --filter @deepseek-ai/dsh-web-frontend run render:app-icons  # 改 icon.svg 后
pnpm --dir apps/desktop run package:win:x64:unsigned              # 本机验证
```

CI 不会自动重生成它们；改了 `resources/icon*.svg` 而忘了重跑，打包出来的还是旧图标。完整清单见 [`BRANDING.zh.md`](./BRANDING.zh.md)。
