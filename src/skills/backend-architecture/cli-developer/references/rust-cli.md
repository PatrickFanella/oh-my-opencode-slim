# Rust CLI defaults

Use Rust when the CLI should be fast, portable, distributable as a static-ish binary, or robust for heavy local workflows.

## Preferred crates

- `clap` for parsing and generated help/completions.
- `anyhow` or `thiserror` for errors.
- `serde` + `toml`/`serde_json` for config and machine output.
- `indicatif` for progress bars.
- `inquire` for optional interactive prompts.

## Rules

- Always support `--help` and `--version`.
- Print machine output to stdout; diagnostics to stderr.
- Add `--json` for automation-friendly output.
- Detect non-TTY before colors/spinners/prompts.
- Use `cargo test`, `cargo clippy`, and `cargo fmt` before release.
