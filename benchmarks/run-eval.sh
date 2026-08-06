#!/bin/sh
# FP Benchmark — one-click blind eval + multi-turn E2E
# Usage: FP_API_KEY=your-key sh benchmarks/run-eval.sh
set -e

if [ -z "$FP_API_KEY" ]; then
  echo "Error: FP_API_KEY not set. Export it first:"
  echo "  export FP_API_KEY=your-key"
  exit 1
fi

echo "=== FP Blind Eval (63 scenarios × 3 trials × dual judge) ==="
node benchmarks/real-eval-v2.mjs all --versions v0,v-final "$@"

echo ""
echo "=== FP Multi-Turn E2E (5 scenarios, real tool calls) ==="
node benchmarks/multi-turn-harness-v2.mjs --versions v0,v-final

echo ""
echo "=== Done. Results in benchmarks/real-eval-results/ and benchmarks/multi-turn-results/ ==="
