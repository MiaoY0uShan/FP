param(
    [switch] $Check
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$source = Join-Path $repoRoot "fp"

$targets = @(
    "install/codex/.agents/skills/fp/references/fp",
    "install/claude-code/.claude/skills/fp/references/fp",
    "install/gemini-cli/fp/fp",
    "install/github-copilot-cli/fp",
    "install/cursor/fp",
    "install/windsurf/fp",
    "install/cline/fp",
    "install/roo-code/fp",
    "install/opencode/fp",
    "install/kiro/fp",
    "install/github-copilot-editor/fp",
    "install/aider/fp",
    "install/universal/.fp-package/payload/fp"
)

$claudeMdSource = Join-Path $repoRoot "fp/CLAUDE.md"
$claudeMdTargets = @(
    "install/universal/.fp-package/payload/.claude/CLAUDE.md",
    "install/claude-code/.claude/CLAUDE.md"
)

$alwaysAppliedSource = Join-Path $repoRoot "fp/CLAUDE.md"

# $alwaysAppliedTargets — one entry per tool.
# For tools with YAML frontmatter (SKILL.md / .mdc / agent / instructions), the
# payload file already has frontmatter + the full body, so we only need the
# per-tool reference (not the CLAUDE.md source). Sync those to
# install/<tool>/<path>/fp/SKILL.md or .mdc by re-running the sync script.
# This block syncs fp/CLAUDE.md to the plain no-frontmatter targets only:
#   - Windsurf, Roo, Cline, Qoder, Antigravity, CONVENTIONS
#
# We already synced fp/ references; the install packs' per-tool entry points
# were hand-edited. Check mode verifies those have the full routing body.
# For sync mode we propagate CLAUDE.md to no-frontmatter files too.
$noFrontmatterTargets = @(
    "install/universal/.fp-package/payload/.windsurf/rules/fp.md",
    "install/universal/.fp-package/payload/.roo/rules/fp.md",
    "install/universal/.fp-package/payload/.clinerules/fp.md",
    "install/universal/.fp-package/payload/.qoder/rules/fp.md",
    "install/universal/.fp-package/payload/.agents/rules/fp.md"
)

$testSource = Join-Path $repoRoot "TEST_FP.md"
$testTargets = @(
    "install/codex/TEST_FP.md",
    "install/claude-code/TEST_FP.md",
    "install/gemini-cli/TEST_FP.md",
    "install/github-copilot-cli/TEST_FP.md",
    "install/cursor/TEST_FP.md",
    "install/windsurf/TEST_FP.md",
    "install/cline/TEST_FP.md",
    "install/roo-code/TEST_FP.md",
    "install/opencode/TEST_FP.md",
    "install/kiro/TEST_FP.md",
    "install/github-copilot-editor/TEST_FP.md",
    "install/aider/TEST_FP.md",
    "install/universal/.fp-package/payload/TEST_FP.md"
)

function Get-RelativePath {
    param([string] $Path)
    return $Path.Substring($repoRoot.Length + 1)
}

function Get-Sha256 {
    param([string] $Path)
    $stream = [System.IO.File]::OpenRead($Path)
    $hasher = [System.Security.Cryptography.SHA256]::Create()
    try {
        return ([System.BitConverter]::ToString($hasher.ComputeHash($stream))).Replace("-", "")
    } finally {
        $hasher.Dispose()
        $stream.Dispose()
    }
}

function Compare-Directory {
    param(
        [string] $Left,
        [string] $Right
    )

    $leftFiles = Get-ChildItem -Path $Left -Recurse -File | ForEach-Object {
        $_.FullName.Substring($Left.Length + 1)
    } | Sort-Object

    $rightFiles = Get-ChildItem -Path $Right -Recurse -File | ForEach-Object {
        $_.FullName.Substring($Right.Length + 1)
    } | Sort-Object

    $leftList = [string]::Join("`n", $leftFiles)
    $rightList = [string]::Join("`n", $rightFiles)
    if ($leftList -ne $rightList) {
        return $false
    }

    foreach ($relative in $leftFiles) {
        $leftPath = Join-Path $Left $relative
        $rightPath = Join-Path $Right $relative
        if ((Get-Sha256 -Path $leftPath) -ne (Get-Sha256 -Path $rightPath)) {
            return $false
        }
    }

    return $true
}

if (-not (Test-Path -LiteralPath $source)) {
    throw "Missing source directory: $source"
}

$canonicalMetadata = @(
    @{ Source = (Join-Path $repoRoot "LICENSE"); Target = (Join-Path $source "LICENSE") },
    @{ Source = (Join-Path $repoRoot "THIRD_PARTY_NOTICES.md"); Target = (Join-Path $source "THIRD_PARTY_NOTICES.md") },
    @{ Source = (Join-Path $repoRoot "VERSION"); Target = (Join-Path $source "VERSION") }
)

foreach ($entry in $canonicalMetadata) {
    if ($Check) {
        if (-not (Test-Path -LiteralPath $entry.Target)) {
            throw "Missing canonical product metadata: $(Get-RelativePath -Path $entry.Target)"
        }
        if ((Get-Sha256 -Path $entry.Source) -ne (Get-Sha256 -Path $entry.Target)) {
            throw "Canonical product metadata is out of sync: $(Get-RelativePath -Path $entry.Target)"
        }
        Write-Host "ok: $(Get-RelativePath -Path $entry.Target)"
        continue
    }

    Copy-Item -LiteralPath $entry.Source -Destination $entry.Target -Force
    Write-Host "synced: $(Get-RelativePath -Path $entry.Target)"
}

foreach ($targetRelative in $targets) {
    $target = Join-Path $repoRoot $targetRelative

    if ($Check) {
        if (-not (Test-Path -LiteralPath $target)) {
            throw "Missing generated install-pack copy: $targetRelative"
        }
        if (-not (Compare-Directory -Left $source -Right $target)) {
            throw "Generated install-pack copy is out of sync: $targetRelative"
        }
        Write-Host "ok: $(Get-RelativePath -Path $target)"
        continue
    }

    if (Test-Path -LiteralPath $target) {
        Remove-Item -LiteralPath $target -Recurse -Force
    }

    $parent = Split-Path -Parent $target
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
    Copy-Item -Path $source -Destination $parent -Recurse -Force
    Write-Host "synced: $(Get-RelativePath -Path $target)"
}

foreach ($targetRelative in $testTargets) {
    $target = Join-Path $repoRoot $targetRelative
    if ($Check) {
        if (-not (Test-Path -LiteralPath $target)) {
            throw "Missing generated install-pack test: $targetRelative"
        }
        if ((Get-Sha256 -Path $testSource) -ne (Get-Sha256 -Path $target)) {
            throw "Generated install-pack test is out of sync: $targetRelative"
        }
        Write-Host "ok: $targetRelative"
        continue
    }

    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    Copy-Item -LiteralPath $testSource -Destination $target -Force
    Write-Host "synced: $targetRelative"
}

$copyPasteSource = Join-Path $repoRoot "fp-copy-paste.md"
$copyPasteTarget = Join-Path $repoRoot "dist/fp-copy-paste.md"

if ($Check) {
    if (-not (Test-Path -LiteralPath $copyPasteTarget)) {
        throw "Missing generated copy-paste fallback: dist/fp-copy-paste.md"
    }
    if ((Get-Sha256 -Path $copyPasteSource) -ne (Get-Sha256 -Path $copyPasteTarget)) {
        throw "Generated copy-paste fallback is out of sync: dist/fp-copy-paste.md"
    }
    Write-Host "ok: dist/fp-copy-paste.md"
} else {
    New-Item -ItemType Directory -Path (Split-Path -Parent $copyPasteTarget) -Force | Out-Null
    Copy-Item -Path $copyPasteSource -Destination $copyPasteTarget -Force
    Write-Host "synced: dist/fp-copy-paste.md"
}

# --- sync no-frontmatter always-applied files from fp/CLAUDE.md ---
foreach ($targetRelative in $noFrontmatterTargets) {
    $target = Join-Path $repoRoot $targetRelative
    if ($Check) {
        if (-not (Test-Path -LiteralPath $target)) {
            throw "Missing no-frontmatter entry: $targetRelative"
        }
        if ((Get-Sha256 -Path $alwaysAppliedSource) -ne (Get-Sha256 -Path $target)) {
            throw "No-frontmatter entry is out of sync: $targetRelative"
        }
        Write-Host "ok: $targetRelative"
        continue
    }

    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    Copy-Item -LiteralPath $alwaysAppliedSource -Destination $target -Force
    Write-Host "synced: $targetRelative"
}

# --- sync CLAUDE.md ---
foreach ($targetRelative in $claudeMdTargets) {
    $target = Join-Path $repoRoot $targetRelative
    if ($Check) {
        if (-not (Test-Path -LiteralPath $target)) {
            throw "Missing CLAUDE.md: $targetRelative"
        }
        if ((Get-Sha256 -Path $claudeMdSource) -ne (Get-Sha256 -Path $target)) {
            throw "CLAUDE.md is out of sync: $targetRelative"
        }
        Write-Host "ok: $targetRelative"
        continue
    }

    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    Copy-Item -LiteralPath $claudeMdSource -Destination $target -Force
    Write-Host "synced: $targetRelative"
}
