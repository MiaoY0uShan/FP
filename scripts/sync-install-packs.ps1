param(
    [switch] $Check
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$source = Join-Path $repoRoot "zerotohero"

$targets = @(
    "install/codex/.agents/skills/zerotohero/references/zerotohero",
    "install/claude-code/.claude/skills/zerotohero/references/zerotohero",
    "install/gemini-cli/zerotohero/zerotohero",
    "install/github-copilot-cli/zerotohero",
    "install/cursor/zerotohero",
    "install/windsurf/zerotohero",
    "install/cline/zerotohero",
    "install/roo-code/zerotohero",
    "install/opencode/zerotohero",
    "install/kiro/zerotohero",
    "install/github-copilot-editor/zerotohero",
    "install/aider/zerotohero",
    "install/universal/.zerotohero-package/payload/zerotohero"
)

$testSource = Join-Path $repoRoot "TEST_ZEROTOHERO.md"
$testTargets = @(
    "install/codex/TEST_ZEROTOHERO.md",
    "install/claude-code/TEST_ZEROTOHERO.md",
    "install/gemini-cli/TEST_ZEROTOHERO.md",
    "install/github-copilot-cli/TEST_ZEROTOHERO.md",
    "install/cursor/TEST_ZEROTOHERO.md",
    "install/windsurf/TEST_ZEROTOHERO.md",
    "install/cline/TEST_ZEROTOHERO.md",
    "install/roo-code/TEST_ZEROTOHERO.md",
    "install/opencode/TEST_ZEROTOHERO.md",
    "install/kiro/TEST_ZEROTOHERO.md",
    "install/github-copilot-editor/TEST_ZEROTOHERO.md",
    "install/aider/TEST_ZEROTOHERO.md",
    "install/universal/.zerotohero-package/payload/TEST_ZEROTOHERO.md"
)

function Get-RelativePath {
    param([string] $Path)
    return $Path.Substring($repoRoot.Length + 1)
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
        if ((Get-FileHash -Algorithm SHA256 -Path $leftPath).Hash -ne (Get-FileHash -Algorithm SHA256 -Path $rightPath).Hash) {
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
        if ((Get-FileHash -Algorithm SHA256 -Path $entry.Source).Hash -ne (Get-FileHash -Algorithm SHA256 -Path $entry.Target).Hash) {
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
        if ((Get-FileHash -Algorithm SHA256 -Path $testSource).Hash -ne (Get-FileHash -Algorithm SHA256 -Path $target).Hash) {
            throw "Generated install-pack test is out of sync: $targetRelative"
        }
        Write-Host "ok: $targetRelative"
        continue
    }

    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    Copy-Item -LiteralPath $testSource -Destination $target -Force
    Write-Host "synced: $targetRelative"
}

$copyPasteSource = Join-Path $repoRoot "zerotohero-copy-paste.md"
$copyPasteTarget = Join-Path $repoRoot "dist/zerotohero-copy-paste.md"

if ($Check) {
    if (-not (Test-Path -LiteralPath $copyPasteTarget)) {
        throw "Missing generated copy-paste fallback: dist/zerotohero-copy-paste.md"
    }
    if ((Get-FileHash -Algorithm SHA256 -Path $copyPasteSource).Hash -ne (Get-FileHash -Algorithm SHA256 -Path $copyPasteTarget).Hash) {
        throw "Generated copy-paste fallback is out of sync: dist/zerotohero-copy-paste.md"
    }
    Write-Host "ok: dist/zerotohero-copy-paste.md"
} else {
    New-Item -ItemType Directory -Path (Split-Path -Parent $copyPasteTarget) -Force | Out-Null
    Copy-Item -Path $copyPasteSource -Destination $copyPasteTarget -Force
    Write-Host "synced: dist/zerotohero-copy-paste.md"
}
