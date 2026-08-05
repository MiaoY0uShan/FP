---
name: fp-android-kernel
description: "Android GKI kernel compilation, patching, KMI verification, boot image repacking, and device deployment. Use when the task involves Android kernel source, defconfig modification, kernel module compilation, boot.img manipulation, or low-level device flashing (fastboot/9008). Requires fp-live-system as prerequisite."
---

# FP Android-Kernel Profile

Load with `fp-live-system` for any task involving kernel source, boot images, or device firmware.

## Android-Specific Rules

### 1. KMI Compatibility Is a Hard Gate
- Never flash a boot image without comparing `Module.symvers` against the stock baseline.
- `changed_crc > 0` or `missing > 0` → stop, do not flash.
- Adding new exports is safe only when `changed_crc=0` and `missing=0` for all existing symbols.
- On GKI 2.0 (6.x+), vendor modules in `vendor_dlkm` must match vermagic exactly, including page size suffix (`-4k`/`-16k`).

### 2. Boot Image Structure Varies
- Verify header version with `unpack_bootimg.py` before repacking.
- Never assume header v3/v4 from build config — check the actual device boot image.
- Stock ramdisk must be preserved when adding KernelSU; only the kernel Image is replaced.

### 3. Deployment Path Hierarchy
- `fastboot boot` (temporary) → `fastboot flash` (permanent) — preferred when available.
- `9008 EDL + Firehose` — fallback when fastboot is blocked; requires Firehose programmer for the specific SoC.
- `dd` from live system — highest risk; only when both fastboot and 9008 are unavailable, and only after verifying partition offsets with `lpdump` or GPT readback.

### 4. eBPF on Android
- Stock kernels may lack `CONFIG_DEBUG_INFO_BTF`; plan for raw bpf() syscall path, not CO-RE.
- Android uses BoringSSL, not OpenSSL. `SSL_read`/`SSL_write` symbols may be in `/apex/com.android.conscrypt/lib64/libssl.so`.
- SELinux context (`u:r:ksu:s0`) may deny `bpf()` or `perf_event_open()`; capture AVC denials before modifying policy.
- Verify with exact-PID uprobe + negative control (wrong PID → zero events) before claiming functional.

### 5. KernelSU Module Packaging
- `/data/adb/modules/<name>/module.prop` + `service.sh` for boot-time execution.
- ConfigFS USB Gadget functions require `CONFIG_USB_F_*` built-in, not just as modules.
- sysfs-based debug controls: expose via `/sys/kernel/debug/<subsystem>/<control>` with default-off behavior.

### 6. Progressive Test Suites
- Number tests S18→S19→S20; each builds on the previous.
- Every suite must include: positive control, negative control, controls restore, and resource cleanup.
- Use explicit verdict categories: `PASS`, `FAIL`, `FIRMWARE_BLOCKED`, `WAITING_HARDWARE`, `VENDOR_DRIVER_BLOCKED`.

## Key Reference Patterns

- `fp/lessons-learned/L004-cross-session-stage-state.md` — Stage-based project state for multi-session kernel projects.
- `fp/templates/stage-based-cross-session-handoff.md` — Template for the stage handoff file.
