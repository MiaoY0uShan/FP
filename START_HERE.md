# Start Here

Recommended asset: `zerotohero-universal-v{version}.zip`.

```text
download -> extract into project -> run installer -> verify -> reload -> work normally
```

Windows: double-click `INSTALL-ZEROTOHERO.cmd`, then verify with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\INSTALL-ZEROTOHERO.ps1 -Verify
```

macOS/Linux:

```sh
sh ./INSTALL-ZEROTOHERO.sh
sh ./INSTALL-ZEROTOHERO.sh --verify
```

The matching installer can later remove only verified ZeroToHero-owned content with `-Uninstall` on Windows or `--uninstall` on macOS/Linux; project files and backups are preserved.

ZeroToHero activates for coding work and chooses the lightest safe route:

```text
small -> tiny brief
unknown cause -> debug-first
medium -> brief + evidence
large/risky -> only the reasoning needed
```

The installer covers mainstream tools through native project adapters, open instruction standards, or an explicit manual fallback. The exact tier for each tool is listed in `INSTALL.md`.

No special command is required. Optional manual trigger:

```text
ZeroToHero: Fix the password reset bug.
```
