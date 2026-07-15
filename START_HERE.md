# Start Here

Recommended asset: `fp-universal-v{version}.zip`.

```text
download -> extract into project -> run installer -> verify -> reload -> work normally
```

Windows: double-click `INSTALL-FP.cmd`, then verify with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\INSTALL-FP.ps1 -Verify
```

macOS/Linux:

```sh
sh ./INSTALL-FP.sh
sh ./INSTALL-FP.sh --verify
```

The matching installer can later remove only verified FP-owned content with `-Uninstall` on Windows or `--uninstall` on macOS/Linux; project files and backups are preserved.

FP activates automatically when the user's goal is engineering work: building, changing, diagnosing, reviewing, testing, operating, or planning software, repositories, infrastructure, or agent tooling. It stays dormant for casual conversation and other non-engineering goals, then chooses the lightest safe route:

```text
small -> tiny brief
unknown cause -> debug-first
medium -> brief + evidence
large/risky -> only the reasoning needed
```

The installer covers mainstream tools through native project adapters, open instruction standards, or an explicit manual fallback. The exact tier for each tool is listed in `INSTALL.md`.

No special command is required for engineering work. `FP:` and `$fp` remain optional explicit invocations:

```text
FP: Fix the password reset bug.
$fp Diagnose the intermittent test failure without editing.
```
