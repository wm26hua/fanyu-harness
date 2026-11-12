# 用 GitHub Actions 打 Windows + Linux + macOS 包（配置与操作手册）

目标：把 Windows、Linux 与 macOS 三个平台的无签名安装包交给 GitHub 托管的 runner 构建，避免本机打包的环境依赖与耗时。三端（`win-x64` / `linux-x64` / `mac-arm64`）都在矩阵里，macOS 的分钟倍率代价见第二节末尾。

---

## 一、最关键的结论：仓库根必须就是代码目录（已按此调整）

GitHub 只会读取**仓库根目录**的 `.github/workflows/`。

之前本仓库的 git 根是**工作区根**（`fanyu-desktop/`），而代码与全部 `.github/` 文件都在**下一层** `fanyu-harness/` 里。结果是：

- 上游自带的 32 个 workflow（`ci.yml`、`windows-package.yml`、`macos-package.yml`…）**一个都没在 GitHub 上跑过**；
- 当时放在根目录的 `/.github/workflows/fanyu-desktop.yml` 是唯一会被读取的工作流，靠 `defaults.run.working-directory: fanyu-harness` + 产物路径前缀 `fanyu-harness/...` 硬撑；
- 放在 `fanyu-harness/.github/workflows/` 里的任何副本**永远不会运行**。

**本轮已改为：仓库根就是代码目录。** `fanyu-harness/` 的内容被抽成独立历史（`git subtree split --prefix=fanyu-harness`），直接作为 `wm26hua/fanyu-harness` 的树：

```
wm26hua/fanyu-harness          ← 仓库根 = 代码根（package.json 在这层）
├── .github/workflows/
│   ├── fanyu-desktop.yml              ← 我们的三端无签名打包（唯一需要维护的那份）
│   └── … 31 个上游 workflow            ← 现在起会被 GitHub 真正读取，见下方警示
├── apps/desktop/scripts/package-target.ts
└── package.json
```

相应调整：

| 动作 | 结果 |
| --- | --- |
| 工作流位置 | `fanyu-harness/.github/workflows/fanyu-desktop.yml`（GitHub 直接读取，不再需要根目录那份） |
| `defaults.run.working-directory` | **已删除** |
| 产物路径前缀 | `fanyu-harness/apps/desktop/...` → `apps/desktop/...` |
| 工作区根的 `/.github/workflows/fanyu-desktop.yml` | **已删除**（死副本，避免以后改错一份） |

> **警示：上游那 31 个 workflow 现在会被真正读取，并且已决定保持不动。** 它们原本就是为 DeepSeek 的自托管 runner 写的（`dsh-win-ci`、`dsh-mac-package-trial`、`blacksmith-*`…），我们这边没有这些 runner，所以会报红：
> - 推到 `main` 触发 7 个：`ci-master.yml`、`sandbox.yml`、`e2e.yml`、`release.yml`、`release-vendor.yml`、`node-addon-system.yml`、`pr-check-on-base-branch.yml`；
> - 开 PR 触发 11 个（`ci.yml`、`ci-windows.yml`、`ci-python.yml`、`expected-filenames.yml`、`build-preview-cloudflare.yml`、`issue-lifecycle.yml`、`issue-policy.yml`、`pr-check-on-head-branch.yml`、`pr-check-after-approve.yml`、`weighted-approval.yml`、`weighted-approval-review-event.yml`）；
> - `e2e.yml` 另有 nightly schedule。
>
> **当前决定就是让它们报红**：与桌面打包互不影响（失败不拦推送，也不会消耗托管 runner 分钟——job 找不到匹配的自托管 runner 只会排队后失败）。要改这个决定：
> 1. **轻量**：GitHub 的 **Actions 页面**逐个 **Disable workflow**（文件保留，想接回来再 Enable）；
> 2. **彻底**：删掉这些 `.yml`——注意 `scripts/` 下十多个 spec（`ci-workflow.spec.ts`、`macos-package-workflow.spec.ts`、`windows-package-workflow.spec.ts`、`desktop-package-forms.spec.ts`、`desktop-package-source.spec.ts`、`desktop-publish-workflow.spec.ts`、`preview-workflow.spec.ts`、`ci-compatible-selfhosted.spec.ts`、`tests/ci-*.spec.ts`、`cua-helper/*.spec.ts` 等）会读取它们做断言，删之前要连着删/改对应 spec。
>
> 失败的 run 会占用 Actions 存储，堆积久了需要手动清理。
>
> **`.github/dependabot.yml` 已删除。** 上游那份配置每天 4:00（Asia/Shanghai）为 npm / uv / github-actions 开升级 PR，每个 PR 都自带一个新分支并触发上面的 PR workflow 报红——删掉它是为了让「多余远端分支」不再自动再生。需要时从历史取回：`git show 13de5293:.github/dependabot.yml > .github/dependabot.yml`。

---

## 二、工作流做了什么

矩阵**三条腿**（Windows + Linux + macOS），跑 GitHub 托管 runner，不发布、不需要任何密钥：

| 目标 | runner | 命令 | 产出 |
| --- | --- | --- | --- |
| `linux-x64` | `ubuntu-24.04` | `pnpm --dir apps/desktop run package:linux:x64:unsigned` | `*.AppImage`、`*.deb`、`*.tar.gz` |
| `win-x64` | `windows-latest` | `pnpm --dir apps/desktop run package:win:x64:unsigned` | `*.exe`（NSIS）+ `.blockmap` |
| `mac-arm64` | `macos-15` | `pnpm --dir apps/desktop run package:mac:arm64:unsigned` | `*.dmg`（无签名配置只出 dmg，`zip` 属于签名发布流程） |

> **macOS 腿已放回矩阵**（runner `macos-15`，Apple Silicon）。它之前被刻意去掉过：**私有仓库里 GitHub 按 10 倍倍率扣 macOS runner 分钟**，一次三端构建大约吃掉免费额度 2000 分钟里的 500 分钟。现在为了三端齐出，这个代价被接受；**仓库转公开则不受分钟数限制**。`mac-x64`（Intel）仍不在矩阵里——它需要 Intel 主机或 Rosetta，产物架构不同且在 arm64 镜像上无法验证，加回来会让 macOS 分钟成本翻倍；真要 Intel 包，加一条 runner 为 `macos-15-intel` 的 `mac-x64` 项（命令 `package:mac:x64:unsigned`）。

- 三条腿都跑完整的 `pnpm install --frozen-lockfile` + `pnpm --dir apps/desktop run package:*`，含运行时准备与冒烟检查。
- Windows 腿额外写一份占位 `apps/desktop/.env.windows`：**无签名 Windows 包仍会注入并校验强制更新策略**，所以必须有 HTTPS 占位域名与 `allowedAuthOrigins`。这些域名在构建期不会被访问。
- Linux 腿装 `squashfs-tools` + `libfuse2t64`，并把 AppImage 解包校验 payload 结构。
- macOS 腿**不写任何 `.env`**：`--unsigned` 走 `localMacOSPackageEnvironment()`，只用 `DSH_DESKTOP_APP_ID=com.fanyu.harness` 做 ad-hoc 签名，不读 `.env.macos`、不注入强制更新策略、不需要证书。打包后把 DMG 挂载起来，校验里面 `fanyu-harness.app` 的结构（可执行文件 + `Contents/Resources/app.asar`）。
- 每条腿把产物上传为 artifact `fanyu-harness-<target>-unsigned`，保留 14 天。**不发布、不上传更新源、不做公证、不做签名。**

### 触发方式

```sh
# 方式一：手动触发（推荐第一次用这个）
#   GitHub 仓库页 → Actions → "Desktop packages (unsigned, windows + linux + macos)" → Run workflow

# 方式二：推 tag（小心：会立刻开打三端，需要时再推）
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
| pnpm **11.28.5** | 工作流显式写 `version: 11.28.5`。仓库根现在就是 `package.json` 所在层，自动发现本来也能work，但仍**显式写**，避免以后根层多出别的手册时被悄悄改掉 pnpm 版本。改版本时请与根 `package.json` 的 `packageManager` 同步。 |
| Windows 需要 MSVC C++ 工具链 | `desktop-toolchain-preflight.ts` 用 `vswhere -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64` 预检，缺了直接终止（安装器外壳 `installer/window-frame.cpp` 要用 `cl.exe` 编译）。`windows-latest` 自带 ✓ |
| Linux 需要 FUSE 2 与 squashfs 工具 | 工作流里用 `apt-get` 装 `libfuse2t64`（24.04 的新名字）与 `squashfs-tools` ✓ |
| 任何 Secrets | **不需要**。工作流里没有一处引用 `secrets.*` |

可选：如果 GitHub 到 npmjs 太慢，在仓库 **Settings → Variables** 里加一个 `DSH_DESKTOP_NPM_REGISTRY`（例如 `https://registry.npmmirror.com`）——工作流已经写成 `vars.DSH_DESKTOP_NPM_REGISTRY || 'https://registry.npmjs.org'`。托管 runner 在国外，通常**不需要**加。

---

## 四、仓库根调整与推送

仓库：**`wm26hua/fanyu-harness`（私有）**，`origin` 已配好；本机走 GitHub 的 SSH-over-443（`core.sshCommand = ssh -p 443 -o HostName=ssh.github.com`，22 端口被本机代理截断）。

```sh
git remote -v
# origin    git@github.com:wm26hua/fanyu-harness.git (fetch)
# origin    git@github.com:wm26hua/fanyu-harness.git (push)
# linux-fork https://github.com/Zhou-Yujing114514/deepseek-harness-linux.git
# upstream   https://github.com/deepseek-ai/deepseek-harness.git
```

把 `fanyu-harness/` 抽成仓库根（保留历史）：

```sh
# 在工作区根 fanyu-desktop/ 执行
git subtree split --prefix=fanyu-harness HEAD            # 得到抽好的提交，形如 508ba6c3
git push origin <split-commit>:refs/heads/repo-root-fanyu-harness   # 先推临时分支
```

在 GitHub 上核对 `repo-root-fanyu-harness` 的内容与 `fanyu-harness/.github/workflows/` 是否正确读取后，再切换默认分支：

```sh
git push origin <split-commit>:refs/heads/main           # 或走 PR 合并
```

工作区那边建议 `git reset --hard origin/main` 保持与远端一致——**工作区根的 `README.md`、`.gitignore`、`.gitattributes` 不属于新仓库**，仓库内的说明见 [`README.md`](./README.md)、[`FANYU.md`](./FANYU.md) 与本文件。

**当前远端状态（2026-11-12 已执行）**：

| 项 | 状态 |
| --- | --- |
| 分支 | **只有 `main`**；临时分支 `repo-root-fanyu-harness` 与 13 个 `dependabot/*` 分支已全部删除 |
| tag | **零个**；`fanyu-desktop-v0.2.2-rc.1` 已删除（它当时指向旧布局的提交，且匹配工作流的 tag 触发器） |
| `main` | 强制更新为抽取后的历史（`70831883...91394ef3 (forced update)`），此后两个提交：`13de5293` 文档、`7cc06126` 删除 dependabot 配置；旧布局的历史仍保留在工作区本地仓库 |
| dependabot | `.github/dependabot.yml` 已删除，不再自动生成升级分支与 PR |
| 本地工作区 | 仍按工作区根布局（`fanyu-harness/` 子目录）；新布局的对照工作树见 `logs/repo-worktree`（本地产物目录，不入库） |

> 注意：工作流的 tag 触发器**保留**——以后再推 `fanyu-desktop-v*` tag 会立即开打三端。只想手动触发就只走 Actions 页面的 **Run workflow**，别推 tag。

推送后到 `https://github.com/wm26hua/fanyu-harness/actions` 即可看到工作流列表——**这是验证「位置修对了」的唯一可靠办法**。

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
| 多平台同时构建 | ✅ Windows + Linux + macOS 三个 job 并行 | ❌ Windows 只能出 Windows 包 |
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
| `pnpm: command not found` 或 pnpm 版本不对 | `pnpm/action-setup` 的 `version` 与根 `package.json` 的 `packageManager` 不一致 |
| Windows 腿在 `toolchain` 步骤失败 | runner 镜像里缺 `Microsoft.VisualStudio.Component.VC.Tools.x86.x64` |
| `pnpm install` 因 lockfile 政策失败 | pnpm 版本低于 11.28.5 |
| Windows 腿报 `.env.windows` 缺字段 | 工作流里那份占位配置被改动过；`.env.windows.example` 是权威清单 |
| Linux 腿 `fpm ... failed 127` | 缺 `libcrypt`；Ubuntu 自带，如换镜像需补 |
| 产物为空、`if-no-files-found: error` 报错 | 打包实际失败但退出码被吞；去该腿的 `Package` 步骤日志里找真正的错误 |
| macOS 腿报 `requires an Apple Silicon build host` | runner 选错了；`mac-arm64` 只接受 arm64 宿主，托管镜像用 `macos-15` |
| macOS 腿报缺少签名/公证凭证 | 该腿必须带 `--unsigned`（`package:mac:arm64:unsigned`）；不带时才会去读 `.env.macos` 与 `CSC_*`/`APPLE_*` |
| macOS 腿 DMG 挂载或结构校验失败 | 校验脚本期望产物根下恰好一个 `*.dmg`，且 DMG 根有一个 `fanyu-harness.app`；先看 `unsigned-artifacts/` 里实际生成了什么 |
| 想加回 Intel macOS 腿 | 加一条 runner 为 `macos-15-intel`、脚本为 `package:mac:x64:unsigned` 的 `mac-x64` 项；注意私有仓库 10× 扣费会再翻一倍 |

---

## 八、以后改品牌/图标时注意

`render:tray-icon` 与 `render:app-icons` 都是**手工/脚本生成的产物入库**，CI 只消费不入库：

```sh
pnpm --dir apps/desktop run render:tray-icon                      # 改 icon-windows.svg 后
pnpm --filter @deepseek-ai/dsh-web-frontend run render:app-icons  # 改 icon.svg 后
pnpm --dir apps/desktop run package:win:x64:unsigned              # 本机验证
```

CI 不会自动重生成它们；改了 `resources/icon*.svg` 而忘了重跑，打包出来的还是旧图标。完整清单见 [`BRANDING.zh.md`](./BRANDING.zh.md)。
