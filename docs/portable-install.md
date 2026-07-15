# Portable Installation

Recommended flow:

```text
download universal zip -> extract into project -> run installer -> verify -> reload -> work normally
```

The universal pack is staged so extraction alone cannot overwrite project instructions. Its installer owns preflight, merge, backup, manifest, and verification behavior. [`../INSTALL.md`](../INSTALL.md) is the only normative command guide and compatibility matrix; other pages link there instead of copying a list that can drift.

No adapter duplicates behavior. Each points to `fp/SKILL.md`. The sync script copies canonical core and installation tests; validation compares hashes.

Project-owned instruction/config files must be merged, not blindly overwritten. See `INSTALL.md` and `TEST_FP.md`.
