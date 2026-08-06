@echo off
REM FP Benchmark — one-click blind eval + multi-turn E2E
REM Usage: set FP_API_KEY=your-key && benchmarks\run-eval.cmd

if "%FP_API_KEY%"=="" (
  echo Error: FP_API_KEY not set. Set it first:
  echo   set FP_API_KEY=your-key
  exit /b 1
)

echo === FP Blind Eval (63 scenarios x 3 trials x dual judge) ===
node benchmarks\real-eval-v2.mjs all --versions v0,v-final %*

echo.
echo === FP Multi-Turn E2E (5 scenarios, real tool calls) ===
node benchmarks\multi-turn-harness-v2.mjs --versions v0,v-final

echo.
echo === Done. Results in benchmarks\real-eval-results\ and benchmarks\multi-turn-results\ ===
