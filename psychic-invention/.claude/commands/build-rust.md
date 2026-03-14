# Build Rust Pricing Engine

Build the Rust core and relink it as a Python extension module using maturin.

## Steps

1. Check that a Python virtual environment exists at `venv/`. If not, create it: `python -m venv venv`.
2. Activate the virtual environment.
3. Run `maturin develop` for a dev build (fast iteration).
   - If the user wants a production/release build, run `maturin develop --release`.
4. Verify the build succeeded by running a quick smoke test:
   ```python
   python -c "import pricing_engine; print('pricing_engine loaded:', pricing_engine.__doc__)"
   ```
5. Report what was built and whether the smoke test passed.

## Common Failures

- **`rustup` not found**: Rust not installed. Direct the user to install via https://rustup.rs.
- **`maturin` not found**: Run `pip install maturin==1.4.0` inside the venv.
- **Linker error on Windows**: The user may need the MSVC Build Tools. Check if Visual Studio C++ tools are installed.
- **`pyo3` ABI mismatch**: Python version in venv must match the Python used by maturin. Recreate venv if needed.
