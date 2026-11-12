# Fanyu harness

English | [中文](README.zh.md)

Fanyu harness is 泛语科技's distribution of DeepSeek Harness (`dsh`), the open-source agent harness developed by [DeepSeek AI](https://deepseek.com).

Fanyu harness is **built on DeepSeek Harness** and is not affiliated with, sponsored by, or endorsed by DeepSeek. "DeepSeek Harness" is a trademark of DeepSeek, used here only to describe this project's upstream.

This repository **is** the code root: `pnpm` commands run here. Downstream-only notes live in [`FANYU.md`](FANYU.md) (deltas from upstream, packaging, placeholders), [`BRANDING.zh.md`](BRANDING.zh.md) (brand ledger) and [`PACKAGING-GITHUB.zh.md`](PACKAGING-GITHUB.zh.md) (Windows/Linux/macOS packaging on GitHub Actions).

It is built on an **everything-is-a-plugin** architecture and powered by [Cordis](https://github.com/cordiverse/cordis), whose design is described in [_A Programming Paradigm for Spatiotemporal Composability_](https://arxiv.org/abs/2608.25512).

Documentation: [https://deepseek-harness.github.io/deepseek-harness/](https://deepseek-harness.github.io/deepseek-harness/)

## Developer preview

DeepSeek Harness is in _developer preview_ and iterating rapidly. **THERE WILL BE COMPATIBILITY-BREAKING CHANGES.**

Review the [safety notice](SAFETY.md) before running the project.

## Run

### Run from `npm`

Install `Node.js`, then run:

```sh
npx @deepseek-ai/dsh web
```

The command starts the Web UI at `http://127.0.0.1:3080` by default and opens it in the default browser for a local launch. An SSH launch only prints the host URL because the SSH client or editor owns the local forwarded address. Pass `--no-open` to run the server without opening a browser. See [Web UI guide](docs/user/guide/index.md).

### Run from source

To run from a repository checkout:

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

`pnpm run build` prepares the repository artifacts. `pnpm dsh web` uses those built artifacts without rebuilding.

## How this fork is maintained

Fanyu harness is developed and released by 泛语科技; 泛语科技 owns the packaged installers, the product name, and the release channels. The codebase tracks upstream DeepSeek Harness, so internal package names (`@deepseek-ai/*`), the `dsh` command, the `dsh` URL scheme, environment variables (`DSH_*`), the `~/.dsh` home, and update feed identifiers stay as upstream defines them and are not renamed by this fork.

## Community and support

- Submit feedback or bug reports through [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions).
- Add the [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic to your plugin repository for discoverability.
- Join <a href="https://discord.gg/4MrtZUhpxg">DeepSeek Harness Discord community</a>.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Development

Start with the [development guide](docs/development.md) and [architecture documentation](docs/architecture.md).

`pnpm run dev:web` builds, serves, and rebuilds client bundles on source edits in one terminal, and `make help` lists the matching Make targets for Web and Desktop; the guide's application commands section owns the full table.

For agents, follow [AGENTS.md](AGENTS.md).

## Citation

```bibtex
@misc{deepseek-harness2026,
  title={DeepSeek Harness: Everything is a Plugin},
  author={DeepSeek-AI},
  year={2026},
  publisher={GitHub},
  howpublished={\url{https://github.com/deepseek-ai/deepseek-harness}},
}
```

## License

[MIT](LICENSE)

Third-party dependencies and their licenses are disclosed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
