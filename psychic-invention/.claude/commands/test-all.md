# Run All Tests

Run the full test suite: Python (pytest), Rust (cargo test), and Frontend (vitest).

## Steps

1. **Python tests** — activate venv, then:
   ```bash
   pytest app/tests/ -v --tb=short
   ```
   Report pass/fail count and any failures.

2. **Property-based tests** (mathematical correctness):
   ```bash
   pytest app/tests/test_mathematical_consistency_properties.py \
          app/tests/test_deriv_api_properties.py -v --tb=short
   ```

3. **Rust tests**:
   ```bash
   cargo test 2>&1
   ```
   Report pass/fail count.

4. **Frontend tests**:
   ```bash
   cd frontend && npm test 2>&1
   ```
   Report pass/fail count.

5. Summarise overall result: total tests run, pass, fail, skipped.
   Flag any failures prominently so the user can investigate.

## Options

- If the user only wants a subset, run just the relevant step.
- For coverage: add `--cov=app --cov-report=term-missing` to the pytest command.
- For benchmarks (Rust): run `cargo bench` separately — do NOT include in standard test run.
