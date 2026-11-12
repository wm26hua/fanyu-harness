# 用 GitHub Actions 打 Windows + Linux 包（配置与操作手册）

目标：把 Windows 与 Linux 两个无签名安装包交给 GitHub 托管的 runner 构建，避免本机打包的环境依赖与耗时。**macOS 腿已刻意关闭**，原因见第二节。

---

## 一、最关键的结论：之前那份 workflow 永远不会运行

GitHub 只会读取**仓库根目录**的 `.github/workflows/`。

本仓库的 git 根目录是**工作区根**（`fanyu-desktop/`），而全部 66 个 `.github/` 文件都在**代码子目录** `fanyu-harness/.github/` 下。结果是：

- 上游自带的 80 多个 workflow（`ci.yml`、`windows-package.yml`、`macos-package.yml`…）**一个都没在 GitHub 上跑过**；
- 之前放在 `fanyu-harness/.github/workflows/fanyu-desktop.yml` 的三平台打包工作流**同样从未运行**。

本轮已修正：

| 动作 | 路径 |
| --- | --- |
| **新增**（GitHub 实际读取的位置） | `/.github/workflows/fanyu-desktop.yml`（工作区根，已入库） |
| **删除**（永远不会运行的死副本） | `fanyu-harness/.github/workflows/fanyu-desktop.yml` |

新工作流用 `defaults.run.working-directory: fanyu-harness` 把每条命令落到代码目录，并把所有产物路径前缀成 `fanyu-harness/apps/desktop/...`。**两份文件之间没有任何自动联动**，所以死副本直接删掉，避免以后又改错那一份。

> 附带好处：`fanyu-harness/.github/` 下那些绑定 DeepSeek 自托管 runner 的上游 workflow 依然不会运行，不会因为找不到 `dsh-win-package-trial` 之类 runner 而报红。

---

## 二、工作流做了什么

矩阵**两条腿**（Windows + Linux），跑 GitHub 托管 runner，不发布、不需要任何密钥：

| 目标 | runner | 命令 | 产出 |
| --- | --- | --- | --- |
| `linux-x64` | `ubuntu-24.04` | `pnpm --dir apps/desktop run package:linux:x64:unsigned` | `*.AppImage`、`*.deb`、`*.tar.gz` |
| `win-x64` | `windows-latest` | `pnpm --dir apps/desktop run package:win:x64:unsigned` | `*.exe`（NSIS）+ `.blockmap` |

> **macOS 腿是刻意去掉的**，不是遗漏。macOS 的打包脚本本身没动、仍可用；去掉的原因是**私有仓库里 GitHub 按 10 倍倍率扣 macOS runner 分钟**，一次三端构建约吃掉免费额度 2000 分钟里的 500 分钟。要重新启用，把 `mac-arm64` 那一项加回矩阵即可（命令见 `apps/desktop/package.json` 的 `package:mac:arm64:unsigned`）。**仓库转公开则不受分钟数限制。**

- 两条腿都跑完整的 `pnpm install --frozen-lockfile` + `pnpm --dir apps/desktop run package:*`，含运行时准备与冒烟检查。
- Windows 腿额外写一份占位 `apps/desktop/.env.windows`：**无签名 Windows 包仍会注入并校验强制更新策略**，所以必须有 HTTPS 占位域名与 `allowedAuthOrigins`。这些域名在构建期不会被访问。
- Linux 腿装 `squashfs-tools` + `libfuse2t64`，并把 AppImage 解包校验 payload 结构。
- 每条腿把产物上传为 artifact `fanyu-harness-<target>-unsigned`，保留 14 天。**不发布、不上传更新源、不做公证、不做签名。**

### 触发方式

```sh
# 方式一：手动触发（推荐第一次用这个）
#   GitHub 仓库页 → Actions → "Desktop packages (unsigned, windows + linux)" → Run workflow

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
| Linux 需要 FUSE 2 与 squashfs 工具 | 工作流里用 `apt-get` 装 `libfuse2t64`（24.04 的新名字）与 `squashfs-tools` ✓ |
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
3. 提交并推送。

```sh
# 在 fanyu-desktop/（工作区根）执行
git status --short
git add -A
git commit -m "feat(brand): 维普学域 / Fanyu harness 品牌改造"
git push -u origin main
```

**本仓库的当前状态：以上都已完成。** 三个提交（`53546641` 图标 / `7c5cd929` 命名 / `c2ed77b4` CI+文档）已推到 `origin/main`。推送后到 `https://github.com/wm26hua/fanyu-harness/actions` 即可看到工作流——**这是验证「位置修对了」的唯一可靠办法**。

---

## 五、SSH 诊断结果（本会话实测，已解决）

**结论：你系统里的 SSH 私钥现已注册到 GitHub 并可以正常认证；推送已经跑通。**

| 项目 | 实际情况 |
| --- | --- |
| SSH 私钥 | `~/.ssh/id_ed25519`（另有 `.pub`），类型 ed25519，注释 `wm26hua-pc` |
| GitHub 账号 | **`wm26hua`** —— 依据：同机 `~/Documents/fanyu/nixcfg` 的 remote 是 `git@github.com:wm26hua/nixcfg.git`；Windows 凭据管理器里有 `git:https://github.com` 与 `git:https://wm26hua@github.com`（User: `wm26hua`） |
| `~/.ssh/config` | 只有两个自用主机（`wm26hua.xyz`、`baota`），**没有** `Host github.com` 条目 |
| `~/.ssh/known_hosts` | 含 `[ssh.github.com]:443`，说明以前用过 SSH-over-443 |
| DNS | `github.com` → `198.18.1.49`、`ssh.github.com` → `198.18.1.50`（本机代理/VPN 的 fake-IP 网段，不是 GitHub 真实地址） |
| SSH :22 | `ssh -T git@github.com` → `Connection closed by 198.18.1.49 port 22` —— **本机代理截断了 22 端口，至今仍然不通** |
| SSH :443 | `ssh -p 443 -T git@ssh.github.com` → `Hi wm26hua! You've successfully authenticated` ✓（连测 8 次全成功） |
| `git push` | `git push -u origin main` → `* [new branch] main -> main` ✓ |

### 本仓库为此做的配置

22 端口不通，所以只走 GitHub 的 SSH-over-443 端点。为了不动你的全局 `~/.ssh/config`，配置写在**仓库本地**：

```sh
git config core.sshCommand "ssh -p 443 -o HostName=ssh.github.com"
```

撤销：`git config --unset core.sshCommand`。

### 建议：给全局补一条（可选）

只用这个仓库的话不必做。但你若还用其他 GUI 客户端 / 其他仓库走 GitHub，建议在 `~/.ssh/config` 加（不要删掉现有的两个 Host）：

```
Host github.com
  HostName ssh.github.com
  Port 443
  User git
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
```

验证：`ssh -T git@github.com` → `Hi wm26hua! You've successfully authenticated, but GitHub does not provide shell access.`（这个命令返回码是 1，属正常，GitHub 不提供 shell）。

### 备选：HTTPS + PAT

如果哪天 SSH 又出问题，可以改走 HTTPS：

```sh
git remote set-url origin https://github.com/wm26hua/fanyu-harness.git
git push -u origin main     # 首次输入用户名 wm26hua + 粘贴 PAT（需要 Contents: Read and write）
```

> 若遇到 `schannel: ... SEC_E_NO_CREDENTIALS`，加一句 `git config --global http.sslBackend openssl`。

---

## 六、GitHub 打包 vs 本机打包

| | GitHub 托管 runner | 本机 |
| --- | --- | --- |
| 多平台同时构建 | ✅ Windows + Linux 两个 job 并行 | ❌ Windows 只能出 Windows 包 |
| Windows 前置 | 自带 VS 2022 + VC Tools | 需自己装约 4 GB 的 VS Build Tools |
| 缓存 | `runner.tool_cache`（Electron 归档 + pnpm store），但**托管 runner 每次是新机器**，缓存靠 `tool_cache` 卷复用 | 可持续复用 |
| 首次耗时 | `pnpm install` + 每条腿各自构建，Windows 通常 20–40 分钟 | 首次同样慢，之后增量快 |
| 密钥 | 不需要 | 不需要 |
| 产物保存 | Artifact，14 天 | 本地 `.desktop-build/targets/*/unsigned-artifacts/` |
| 计费 | 私有仓库按倍率扣分钟（Linux 1×、Windows 2×、macOS 10×）；公开仓库不限 | 免费 |

**本机打包慢的常见原因**（与 GitHub 无关，可单独优化）：`DSH_DESKTOP_PACKAGE_CACHE_DIR` 没设导致 Electron 归档每次重下；`TEMP` 落到慢盘导致 esbuild 清理被拒；`DSH_DESKTOP_DEFER_RUNTIME_SMOKE=1` 可跳过运行时冒烟（**但 CI 上不要设**）。

---

## 七、可预期的失败与排查

| 现象 | 原因与处理 |
| --- | --- |
| Actions 页面里**根本看不到**这个工作流 | 工作流没在仓库根 `.github/workflows/`；确认 `git ls-files \| grep '^\.github/'` 有输出 |
| `pnpm: command not found` 或 pnpm 版本不对 | `pnpm/action-setup` 的 `version` 与 `fanyu-harness/package.json` 的 `packageManager` 不一致 |
| Windows 腿在 `toolchain` 步骤失败 | runner 镜像里缺 `Microsoft.VisualStudio.Component.VC.Tools.x86.x64` |
| `pnpm install` 因 lockfile 政策失败 | pnpm 版本低于 11.28.5 |
| Windows 腿报 `.env.windows` 缺字段 | 工作流里那份占位配置被改动过；`.env.windows.example` 是权威清单 |
| Linux 腿 `fpm ... failed 127` | 缺 `libcrypt`；Ubuntu 自带，如换镜像需补 |
| 产物为空、`if-no-files-found: error` 报错 | 打包实际失败但退出码被吞；去该腿的 `Package` 步骤日志里找真正的错误 |
| 想加回 macOS 腿 | 把 `mac-arm64` 加回矩阵（runner 用 `macos-15`，Apple Silicon）；注意私有仓库 10× 扣费 |

---

## 八、以后改品牌/图标时注意

`render:tray-icon` 与 `render:app-icons` 都是**手工/脚本生成的产物入库**，CI 只消费不入库：

```sh
pnpm --dir apps/desktop run render:tray-icon                      # 改 icon-windows.svg 后
pnpm --filter @deepseek-ai/dsh-web-frontend run render:app-icons  # 改 icon.svg 后
pnpm --dir apps/desktop run package:win:x64:unsigned              # 本机验证
```

CI 不会自动重生成它们；改了 `resources/icon*.svg` 而忘了重跑，打包出来的还是旧图标。完整清单见 [`BRANDING.zh.md`](./BRANDING.zh.md)。
