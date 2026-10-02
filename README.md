# DPUse File Store Emulator Connector

<!-- OPENING_START -->

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![DPUse version](https://img.shields.io/github/v/release/dpuse/dpuse-connector-file-store-emulator?color=f6821f&label=DPUse)](https://github.com/dpuse/dpuse-connector-file-store-emulator/releases/latest)
[![CI](https://github.com/dpuse/dpuse-connector-file-store-emulator/actions/workflows/ci.yml/badge.svg)](https://github.com/dpuse/dpuse-connector-file-store-emulator/actions/workflows/ci.yml)

[DPUse](https://www.dpuse.app) · [Report a Vulnerability](https://github.com/dpuse/dpuse-connector-file-store-emulator/security/advisories/new) · [Open an Issue](https://github.com/dpuse/dpuse-connector-file-store-emulator/issues)

Provides read-only sample data simulating a cloud-based file storage solution such as Google Drive, Dropbox, or Microsoft OneDrive.

## About DPUse

DPUse (Data Positioning & Use) is an in-browser application that positions your data for use through three core activities: sourcing, contextualising, and publishing.

**Sourcing** uses a library of [Connectors](https://www.dpuse.app/connectors) to establish [Connections](https://www.dpuse.app) to applications, databases, file stores, and curated datasets; these connections are subsequently used to configure structured [Data Views](https://www.dpuse.app) from the underlying sources.

**Contextualising** extracts chronological events from those [Data Views](https://www.dpuse.app) and maps them into comprehensive [Context Models](https://www.dpuse.app). This gives the DPUse Engine the structural framework needed to generate deterministic transactions, facts, or observations.

**Publishing** uses a library of [Presenters](https://www.dpuse.app) to render standard [Presentations](https://www.dpuse.app) immediately using the contextualised data; additionally, [Cookbooks](https://www.dpuse.app) of [Recipes](https://www.dpuse.app) let you build Data Apps using your preferred tools.

In addition, DPUse provides [Tools](https://www.dpuse.app) used by the application, and you can use them to construct connectors and presenters.

## Introduction

The File Store Emulator Connector is a read-only connector that provides access to a sample dataset simulating a hypothetical cloud-based file storage service such as Google Drive, Dropbox, or Microsoft OneDrive. It is intended for demonstration, evaluation, and testing, and is freely available to all users.

<!-- OPENING_END -->

<!-- SUPPORTED_ACTIONS_START -->

## Supported Actions

Connectors conform to a unified interface contract by implementing a specific subset of standard actions. These standardised actions allow the DPUse application to interact with any underlying data source in the same way, enabling Connectors to be built independently and loaded dynamically at runtime.

This connector is a Source connector that supports only read actions. Connectors can also function as a Destination (write-only) or Bidirectional (read/write), depending on the actions they support. The table below lists all connector actions and highlights those supported by this connector.

| Action               | Supported |
| :------------------- | :-------: |
| Abort Operation      |     ✓     |
| Audit Object Content |     ✓     |
| Create Object        |           |
| Describe Connection  |           |
| Drop Object          |           |
| Find Object          |     ✓     |
| Get Info             |           |
| Get Readable Stream  |     ✓     |
| Get Record           |           |
| List Nodes           |     ✓     |
| Preview Object       |     ✓     |
| Remove Records       |           |
| Retrieve Chunks      |           |
| Retrieve Records     |     ✓     |
| Upsert Records       |           |

<!-- SUPPORTED_ACTIONS_END -->

<!-- USAGE_START -->

## Usage

This connector is automatically uploaded to the DPUse Engine cloud once released and becomes instantly available to all new browser app instances, with existing instances notified of the update.

You may view or clone this repository for your own purposes, such as building a new, similar connector, though there is currently no process to accept third-party connectors into DPUse at this stage.

```bash
git clone https://github.com/dpuse/dpuse-connector-file-store-emulator.git
cd dpuse-connector-file-store-emulator
npm install
```

_Requires [Node.js](https://nodejs.org/) 24 or later, [npm](https://www.npmjs.com/) 12 or later, and [TypeScript](https://www.typescriptlang.org/) 6.0.3 or later._

This repository is managed using the common set of actions provided by [@dpuse/dpuse-development](https://github.com/dpuse/dpuse-development). See the `scripts` block in [package.json](https://github.com/dpuse/dpuse-connector-file-store-emulator/blob/main/package.json) for details.

<!-- USAGE_END -->

<!-- DEPENDENCY_LICENSES_START -->

## Dependency Licenses

License data is updated each time `npm run document` is run, using [license-checker](https://github.com/RSeidelsohn/license-checker-rseidelsohn) and [cargo tree](https://doc.rust-lang.org/cargo/commands/cargo-tree.html). The following table lists every package whose code, styles or assets are included in this project's build, as recorded by the build itself. Modules loaded at run time are not included; each documents its own. It also lists every Rust crate compiled into its WebAssembly, as resolved by Cargo; macros and other crates used only while compiling put none of their code in it, so are left out. These dependencies have been checked and confirmed to use MIT or Unicode-3.0, all of which allow commercial use. All are used unmodified, so any licence conditions that apply only to modified versions are not triggered. Developers cloning this repository should independently verify development dependencies.

| Dependency                                                                                    | Version | License(s)                          | Document                                                                                                                                                                                                               |
| :-------------------------------------------------------------------------------------------- | :-----: | :---------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [@dpuse/dpuse-shared](https://github.com/dpuse/dpuse-shared)                                  | 0.3.869 | MIT                                 | [LICENSE](licenses/downloads/@dpuse/dpuse-shared@0.3.869-LICENSE.txt)                                                                                                                                                  |
| [cfg-if](https://github.com/rust-lang/cfg-if)                                                 |  1.0.4  | MIT OR Apache-2.0                   | [LICENSE-APACHE](licenses/downloads/cfg-if@1.0.4-LICENSE-APACHE) [LICENSE-MIT](licenses/downloads/cfg-if@1.0.4-LICENSE-MIT)                                                                                            |
| [js-sys](https://github.com/wasm-bindgen/wasm-bindgen/tree/master/crates/js-sys)              | 0.3.83  | MIT OR Apache-2.0                   | [LICENSE-APACHE](licenses/downloads/js-sys@0.3.83-LICENSE-APACHE) [LICENSE-MIT](licenses/downloads/js-sys@0.3.83-LICENSE-MIT)                                                                                          |
| [nanoid](https://github.com/ai/nanoid)                                                        |  6.0.1  | MIT                                 | [LICENSE](licenses/downloads/nanoid@6.0.1-LICENSE.txt)                                                                                                                                                                 |
| [once_cell](https://github.com/matklad/once_cell)                                             | 1.21.3  | MIT OR Apache-2.0                   | [LICENSE-APACHE](licenses/downloads/once_cell@1.21.3-LICENSE-APACHE) [LICENSE-MIT](licenses/downloads/once_cell@1.21.3-LICENSE-MIT)                                                                                    |
| [unicode-ident](https://github.com/dtolnay/unicode-ident)                                     | 1.0.22  | (MIT OR Apache-2.0) AND Unicode-3.0 | [LICENSE-APACHE](licenses/downloads/unicode-ident@1.0.22-LICENSE-APACHE) [LICENSE-MIT](licenses/downloads/unicode-ident@1.0.22-LICENSE-MIT) [LICENSE-UNICODE](licenses/downloads/unicode-ident@1.0.22-LICENSE-UNICODE) |
| [valibot](https://github.com/open-circle/valibot)                                             |  1.5.0  | MIT                                 | [LICENSE](licenses/downloads/valibot@1.5.0-LICENSE.txt)                                                                                                                                                                |
| [wasm-bindgen](https://github.com/wasm-bindgen/wasm-bindgen)                                  | 0.2.106 | MIT OR Apache-2.0                   | [LICENSE-APACHE](licenses/downloads/wasm-bindgen@0.2.106-LICENSE-APACHE) [LICENSE-MIT](licenses/downloads/wasm-bindgen@0.2.106-LICENSE-MIT)                                                                            |
| [wasm-bindgen-shared](https://github.com/wasm-bindgen/wasm-bindgen/tree/master/crates/shared) | 0.2.106 | MIT OR Apache-2.0                   | [LICENSE-APACHE](licenses/downloads/wasm-bindgen-shared@0.2.106-LICENSE-APACHE) [LICENSE-MIT](licenses/downloads/wasm-bindgen-shared@0.2.106-LICENSE-MIT)                                                              |
| [web-sys](https://github.com/wasm-bindgen/wasm-bindgen/tree/master/crates/web-sys)            | 0.3.83  | MIT OR Apache-2.0                   | [LICENSE-APACHE](licenses/downloads/web-sys@0.3.83-LICENSE-APACHE) [LICENSE-MIT](licenses/downloads/web-sys@0.3.83-LICENSE-MIT)                                                                                        |

### Dependency Tree

The dependency tree below shows how each package in the table above is reached — direct and transitive — along with its installed version, release date, and update status. A package that does not ship itself, such as one whose parts are bundled separately, is left out and what ships beneath it is shown in its place. Packages flagged ❗ have a newer version available; ⚠️ indicates a package that hasn't been updated in the last 6 months or longer. Neither flag necessarily indicates a problem: we let new releases stabilise before upgrading, and some packages are mature and stable (have limited or no dependencies), so they require no active development.

- **[@dpuse/dpuse-shared](https://github.com/dpuse/dpuse-shared)** 0.3.869 — this month: 2026-10-02
    - **[valibot](https://github.com/open-circle/valibot)** 1.5.0 — this month: 2026-09-09
- **[nanoid](https://github.com/ai/nanoid)** 6.0.1 — **1 month** ago: 2026-08-03
- **dpuse-connector-file-store-emulator-core** 0.1.0 — this project's Rust code, compiled into its WebAssembly
    - **[wasm-bindgen](https://github.com/wasm-bindgen/wasm-bindgen)** 0.2.106 — **10 months** ago: 2025-11-28 ⚠️ → **latest**: 0.2.129 — this month: 2026-09-25 ❗
        - **[cfg-if](https://github.com/rust-lang/cfg-if)** 1.0.4 — **11 months** ago: 2025-10-15 ⚠️ → **latest**: 1.0.5 — this month: 2026-09-16 ❗
        - **[once_cell](https://github.com/matklad/once_cell)** 1.21.3 — **18 months** ago: 2025-03-28 ⚠️ → **latest**: 1.21.4 — **6 months** ago: 2026-03-12 ❗
        - **[wasm-bindgen-shared](https://github.com/wasm-bindgen/wasm-bindgen/tree/master/crates/shared)** 0.2.106 — **10 months** ago: 2025-11-28 ⚠️ → **latest**: 0.2.129 — this month: 2026-09-25 ❗
            - **[unicode-ident](https://github.com/dtolnay/unicode-ident)** 1.0.22 — **11 months** ago: 2025-10-30 ⚠️ → **latest**: 1.0.26 — this month: 2026-09-17 ❗
    - **[web-sys](https://github.com/wasm-bindgen/wasm-bindgen/tree/master/crates/web-sys)** 0.3.83 — **10 months** ago: 2025-11-28 ⚠️ → **latest**: 0.3.106 — this month: 2026-09-25 ❗
        - **[js-sys](https://github.com/wasm-bindgen/wasm-bindgen/tree/master/crates/js-sys)** 0.3.83 — **10 months** ago: 2025-11-28 ⚠️ → **latest**: 0.3.106 — this month: 2026-09-25 ❗
            - **[once_cell](https://github.com/matklad/once_cell)** 1.21.3 — **18 months** ago: 2025-03-28 ⚠️ → **latest**: 1.21.4 — **6 months** ago: 2026-03-12 ❗
            - **[wasm-bindgen](https://github.com/wasm-bindgen/wasm-bindgen)** 0.2.106 — **10 months** ago: 2025-11-28 ⚠️ → **latest**: 0.2.129 — this month: 2026-09-25 ❗
        - **[wasm-bindgen](https://github.com/wasm-bindgen/wasm-bindgen)** 0.2.106 — **10 months** ago: 2025-11-28 ⚠️ → **latest**: 0.2.129 — this month: 2026-09-25 ❗

<!-- DEPENDENCY_LICENSES_END -->

<!-- BUNDLE_START -->

## Bundle Analysis

This report is updated with each release, from the bundle the release builds, using [Sonda](https://sonda.dev/), which analyses final source maps to reveal the actual effects of tree-shaking and minification rather than relying on pre-build estimates.

_Note: Sonda's Vite reports currently exclude CSS files, since Vite does not generate source maps for CSS._

| Chunk/Module/File                                                     | Composition                                 |
| :-------------------------------------------------------------------- | :------------------------------------------ |
| **dist/dpuse-connector-file-store-emulator.es.js**                    | 56.5 kB · gzip 16.1 kB · 69.1% of the build |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared → dist/dpuse-shared.es.js | `████░░░░░░░░░░░░░░░░` 18.0% · 10.1 kB      |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                           | `██░░░░░░░░░░░░░░░░░░` 8.3% · 4.7 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ index.ts            | `▒▒░░░░░░░░░░░░░░░░░░` 7.6% · 4.3 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ rustBridge.ts       | `░░░░░░░░░░░░░░░░░░░░` 0.7% · 416 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;nanoid                                        | `░░░░░░░░░░░░░░░░░░░░` 0.3% · 196 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ 2 smaller files     | `░░░░░░░░░░░░░░░░░░░░` 0.3% · 196 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)           | `███████████████░░░░░` 73.4% · 41.5 kB      |
| **dist/dpuse_connector_file_store_emulator_core-D4jzEdo\_.js**        | 25.3 kB · gzip 11.9 kB · 30.9% of the build |
| &nbsp;&nbsp;&nbsp;&nbsp;wasm → ….js                                   | `████████████████████` 98.8% · 25.0 kB      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)           | `░░░░░░░░░░░░░░░░░░░░` 1.2% · 317 B         |

Bars show each row's share of its output file. ↳ rows are part of the row above.

(bundler output, whitespace & JSON) = bytes Sonda can't trace to a source file: whitespace (indentation and line breaks), code the bundler generates (region comments, the combined import/export lines, its small runtime helper and wrappers), and imported JSON such as `config.json`, which the bundler doesn't map. The JSON and the generated code are real bytes that ship; the whitespace mostly disappears once compressed.

<!-- BUNDLE_END -->

<!-- QUALITY_SECURITY_START -->

## Quality & Security

This section is updated each time `npm run document` is run. Settings come from the repository's workflow files and GitHub. Test coverage and the Fallow score are measured at the same time.

### Testing

| Check                | Status | What it does                                                                                                                                                                                                 |
| :------------------- | :----- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit tests           | ✅ On  | [Vitest](https://vitest.dev) runs the unit tests. Part of the [CI workflow](https://github.com/dpuse/dpuse-connector-file-store-emulator/actions/workflows/ci.yml) on every push and pull request to `main`. |
| Property-based tests | ❌ Off | [fast-check](https://fast-check.dev) runs many random inputs per test to find edge cases, alongside the unit tests.                                                                                          |

### Code Quality

| Check         | Status | What it does                                                                                                                                                                                                                                                                                                                           |
| :------------ | :----- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Code analysis | ✅ On  | [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=dpuse_dpuse-connector-file-store-emulator&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=dpuse_dpuse-connector-file-store-emulator) [SonarCloud](https://sonarcloud.io) checks every push for bugs, code smells and vulnerabilities. |
| Linting       | ✅ On  | [ESLint](https://eslint.org) checks the code for errors and style problems. Part of the [CI workflow](https://github.com/dpuse/dpuse-connector-file-store-emulator/actions/workflows/ci.yml) on every push and pull request to `main`.                                                                                                 |

### Security Analysis

| Check           | Status | What it does                                                                                                                                                                                                                                                                                                                                                                                                              |
| :-------------- | :----- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Push protection | ✅ On  | [GitHub push protection](https://docs.github.com/en/code-security/secret-scanning/push-protection-for-repositories-and-organizations) blocks pushes that contain credentials.                                                                                                                                                                                                                                             |
| Static analysis | ✅ On  | [![CodeQL](https://github.com/dpuse/dpuse-connector-file-store-emulator/actions/workflows/codeql.yml/badge.svg)](https://github.com/dpuse/dpuse-connector-file-store-emulator/security/code-scanning) [CodeQL](https://codeql.github.com) scans GitHub Actions and JavaScript/TypeScript and Rust for security vulnerabilities, using the extended security queries, on every push and pull request to `main` and weekly. |
| Secret scanning | ✅ On  | [GitHub secret scanning](https://docs.github.com/en/code-security/secret-scanning) detects credentials, such as API keys and tokens, committed to the repository.                                                                                                                                                                                                                                                         |

### Dependencies

| Check               | Status | What it does                                                                                                                                                                                                                                                                                                                               |
| :------------------ | :----- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vulnerability audit | ✅ On  | [npm audit](https://docs.npmjs.com/cli/commands/npm-audit) fails when a shipped dependency has any known vulnerability, or a development dependency has a high or critical one. Part of the [CI workflow](https://github.com/dpuse/dpuse-connector-file-store-emulator/actions/workflows/ci.yml) on every push and pull request to `main`. |
| Supply chain risk   | ✅ On  | [Socket](https://socket.dev) flags malicious packages, typosquatting and suspicious behaviour that may not yet have a CVE.                                                                                                                                                                                                                 |
| Security alerts     | ✅ On  | [Dependabot](https://docs.github.com/en/code-security/dependabot) alerts when a dependency has a known vulnerability, using the GitHub Advisory Database.                                                                                                                                                                                  |
| Security updates    | ❌ Off | [Dependabot](https://docs.github.com/en/code-security/dependabot) opens pull requests that update vulnerable dependencies. These are handled manually.                                                                                                                                                                                     |
| Version updates     | ❌ Off | [Dependabot](https://docs.github.com/en/code-security/dependabot) opens pull requests for new dependency versions. These are handled manually.                                                                                                                                                                                             |

### OpenSSF 🚧

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/dpuse/dpuse-connector-file-store-emulator/badge)](https://scorecard.dev/viewer/?uri=github.com/dpuse/dpuse-connector-file-store-emulator)

This project is working towards the [OpenSSF Best Practices](https://www.bestpractices.dev) Passing badge, a self-certification covering security policy, vulnerability reporting, build processes, code quality, and more. Currently the [OpenSSF Scorecard](https://scorecard.dev) provides an independent automated assessment of the project's security practices and is an ongoing area of improvement.

### Reporting Vulnerabilities

Please do not open public GitHub issues for security vulnerabilities. Use [GitHub private vulnerability reporting](https://github.com/dpuse/dpuse-connector-file-store-emulator/security/advisories/new) instead. See [SECURITY.md](./SECURITY.md) for the full disclosure policy, contact details, and expected response times.

<!-- QUALITY_SECURITY_END -->

<!-- CONTRIBUTING_LICENSE_START -->

## Contributing

This repository is maintained solely by its owner and does not, at present, accept external contributions into the canonical repo. Its source is published openly under the MIT License — every DPUse project is fully open source except DPUse Engine, which remains closed and proprietary.

For security vulnerabilities, see [Reporting Vulnerabilities](#reporting-vulnerabilities). For bugs, inconsistencies, or other feedback, [open a GitHub issue](https://github.com/dpuse/dpuse-connector-file-store-emulator/issues) — feedback is read, but responses and fixes are at the maintainer's discretion.

## License

This project is licensed under the MIT License, permitting free use, modification, and distribution.

[MIT](./LICENSE) © 2026 Jonathan Terrell

<!-- CONTRIBUTING_LICENSE_END -->
