[CmdletBinding()]
param(
    [string] $Target = $PSScriptRoot,
    [switch] $Verify,
    [switch] $Uninstall,
    [switch] $MigrateLegacy
)

$ErrorActionPreference = "Stop"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$packageRoot = Join-Path $PSScriptRoot ".zerotohero-package"
$payloadRoot = Join-Path $packageRoot "payload"
$fragmentRoot = Join-Path $packageRoot "fragments"
$versionFile = Join-Path $packageRoot "VERSION"

$modeCount = [int] [bool] $Verify + [int] [bool] $Uninstall + [int] [bool] $MigrateLegacy
if ($modeCount -gt 1) {
    throw "-Verify, -Uninstall, and -MigrateLegacy cannot be combined."
}

function Write-Utf8NoBom {
    param([string] $Path, [string] $Content)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Read-Utf8 {
    param([string] $Path)
    return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}

function Assert-NoReparseChain {
    param([string] $Path, [string] $Label)
    $current = [System.IO.Path]::GetFullPath($Path)
    while ($current) {
        $item = Get-Item -LiteralPath $current -Force -ErrorAction SilentlyContinue
        if ($null -ne $item -and ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint)) {
            throw "Unsafe target topology: $Label traverses reparse point $current. No installation files were changed."
        }
        $parent = Split-Path -Parent $current
        if (-not $parent -or $parent -eq $current) { break }
        $current = $parent
    }
}

function Assert-SafeTargetPath {
    param([string] $RelativePath, [ValidateSet("File", "Directory")] [string] $ExpectedType)
    if ([System.IO.Path]::IsPathRooted($RelativePath) -or $RelativePath -match '(^|[\\/])\.\.([\\/]|$)') {
        throw "Unsafe managed relative path: $RelativePath. No installation files were changed."
    }
    $segments = @($RelativePath -split '[\\/]' | Where-Object { $_ -and $_ -ne '.' })
    $current = $script:targetRoot
    for ($index = 0; $index -lt $segments.Count; $index++) {
        $current = Join-Path $current $segments[$index]
        $item = Get-Item -LiteralPath $current -Force -ErrorAction SilentlyContinue
        if ($null -eq $item) { continue }
        if ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) {
            throw "Unsafe target topology: $RelativePath traverses reparse point $current. No installation files were changed."
        }
        $isLeaf = $index -eq $segments.Count - 1
        if (-not $isLeaf -and -not $item.PSIsContainer) {
            throw "Unsafe target topology: $RelativePath requires directory $current, but a file exists. No installation files were changed."
        }
        if ($isLeaf -and $ExpectedType -eq "File" -and $item.PSIsContainer) {
            throw "Unsafe target topology: $RelativePath must be a file, but a directory exists. No installation files were changed."
        }
        if ($isLeaf -and $ExpectedType -eq "Directory" -and -not $item.PSIsContainer) {
            throw "Unsafe target topology: $RelativePath must be a directory, but a file exists. No installation files were changed."
        }
    }
}

function Initialize-BackupRoot {
    if ($script:backupRoot) { return }
    $container = Join-Path $script:targetRoot ".zerotohero-backups"
    Assert-SafeTargetPath -RelativePath ".zerotohero-backups" -ExpectedType Directory
    if (-not (Test-Path -LiteralPath $container -PathType Container)) {
        New-Item -ItemType Directory -Path $container | Out-Null
    }
    Assert-NoReparseChain -Path $container -Label "backup container"
    for ($attempt = 0; $attempt -lt 10; $attempt++) {
        $candidate = Join-Path $container ("run-" + [guid]::NewGuid().ToString("N"))
        if (Test-Path -LiteralPath $candidate) { continue }
        New-Item -ItemType Directory -Path $candidate | Out-Null
        Assert-NoReparseChain -Path $candidate -Label "backup run directory"
        $script:backupRoot = $candidate
        return
    }
    throw "Could not create a unique backup run directory. No installation files were changed."
}

function Backup-ProjectFile {
    param([string] $Path, [string] $RelativePath)
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return }
    Initialize-BackupRoot
    $destination = Join-Path $script:backupRoot $RelativePath
    New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
    Copy-Item -LiteralPath $Path -Destination $destination -Force
}

function Get-AiderAnalysis {
    param([string] $Content)

    $readCount = 0
    $hasEntry = $false
    $entryCount = 0
    $shape = "none"
    $insideReadBlock = $false
    foreach ($line in ($Content -split "`r?`n")) {
        if ($line -match '^read\s*:\s*(?<rest>.*)$') {
            $readCount++
            $insideReadBlock = $false
            $rest = $Matches["rest"]
            $trimmedRest = $rest.Trim()
            $candidate = if ($trimmedRest.StartsWith("#")) { "" } else { ($rest -replace '\s+#.*$', '').Trim() }
            if ([string]::IsNullOrWhiteSpace($candidate)) {
                $shape = "block"
                $insideReadBlock = $true
            } elseif ($candidate -match '^\[[^\]]*\]$') {
                $shape = "inline"
                $entryCount += [regex]::Matches($candidate, '(?i)(?:^|[\[,\s])[''"]?ZEROTOHERO\.md[''"]?(?=[\],\s]|$)').Count
                if ($entryCount -gt 0) { $hasEntry = $true }
            } else {
                $value = $candidate
                if ($value -match '^[>|{&*!\[]') {
                    $shape = "unsupported"
                } else {
                    $shape = "scalar"
                    if ($value -match '(?i)^[''"]?ZEROTOHERO\.md[''"]?$') { $entryCount++; $hasEntry = $true }
                }
            }
            continue
        }
        if ($insideReadBlock) {
            if ($line -match '^[^\s#]') {
                $insideReadBlock = $false
            } elseif ($line -match '^\s*(?:#.*)?$') {
                continue
            } elseif ($line -match '^\s*-\s+(?<item>.+?)\s*$') {
                $item = ($Matches["item"] -replace '\s+#.*$', '').Trim()
                if ([string]::IsNullOrWhiteSpace($item) -or $item -match '^[>|{&*!\[]' -or $item -match ':\s') {
                    $shape = "unsupported"
                    $insideReadBlock = $false
                } elseif ($item -match '(?i)^[''"]?ZEROTOHERO\.md[''"]?$') {
                    $entryCount++
                    $hasEntry = $true
                }
            } else {
                $shape = "unsupported"
                $insideReadBlock = $false
            }
        }
    }
    return [pscustomobject]@{ ReadCount = $readCount; HasEntry = $hasEntry; EntryCount = $entryCount; Shape = $shape }
}

function Get-LegacyPaths {
    $candidates = @(
        "xskill",
        ".agents/skills/xskill",
        ".agents/rules/xskill.md",
        ".codex/skills/xskill",
        ".claude/skills/xskill",
        ".opencode/skills/xskill",
        ".openclaw/skills/xskill",
        ".cursor/rules/xskill.mdc",
        ".windsurf/rules/xskill.md",
        ".clinerules/xskill.md",
        ".roo/rules/xskill.md",
        ".github/agents/xskill.agent.md",
        ".github/instructions/xskill.instructions.md",
        ".kiro/steering/xskill.md",
        ".qoder/rules/xskill.md",
        ".junie/xskill.md",
        "XSKILL.md"
    )
    return @($candidates | Where-Object { Test-Path -LiteralPath (Join-Path $script:targetRoot $_) })
}

function Assert-InstallPreflight {
    Assert-NoReparseChain -Path $script:targetRoot -Label "target root"
    Assert-SafeTargetPath -RelativePath ".zerotohero-backups" -ExpectedType Directory
    foreach ($relative in @("AGENTS.md", "GEMINI.md", ".aider.conf.yml", "ZEROTOHERO.md", "zerotohero/.install-manifest.json")) {
        Assert-SafeTargetPath -RelativePath $relative -ExpectedType File
    }
    Get-ChildItem -LiteralPath $payloadRoot -Recurse -File -Force | ForEach-Object {
        $relative = $_.FullName.Substring($payloadRoot.Length + 1)
        Assert-SafeTargetPath -RelativePath $relative -ExpectedType File
    }
    if ($null -eq $script:previousManifest) {
        foreach ($relative in $script:reservedOwnedPaths) {
            if (Test-Path -LiteralPath (Join-Path $script:targetRoot $relative) -PathType Leaf) {
                throw "ZeroToHero-owned path already exists without a valid install manifest: $relative. Move it aside before installing; no installation files were changed."
            }
        }
    }

    foreach ($managed in @("AGENTS.md", "GEMINI.md")) {
        $path = Join-Path $script:targetRoot $managed
        if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { continue }
        $content = Read-Utf8 -Path $path
        $starts = [regex]::Matches($content, '(?m)^<!-- zerotohero:start -->[ \t]*\r?$')
        $ends = [regex]::Matches($content, '(?m)^<!-- zerotohero:end -->[ \t]*\r?$')
        $rawStarts = [regex]::Matches($content, '<!-- zerotohero:start -->')
        $rawEnds = [regex]::Matches($content, '<!-- zerotohero:end -->')
        if ($starts.Count -ne $ends.Count -or $starts.Count -gt 1 -or $rawStarts.Count -ne $starts.Count -or $rawEnds.Count -ne $ends.Count -or ($starts.Count -eq 1 -and $starts[0].Index -gt $ends[0].Index)) {
            throw "$managed has corrupt or duplicate ZeroToHero managed markers. No installation files were changed."
        }
    }

    $aiderPath = Join-Path $script:targetRoot ".aider.conf.yml"
    if (Test-Path -LiteralPath $aiderPath -PathType Leaf) {
        $analysis = Get-AiderAnalysis -Content (Read-Utf8 -Path $aiderPath)
        if ($analysis.ReadCount -gt 1 -or $analysis.Shape -eq "unsupported") {
            throw ".aider.conf.yml uses duplicate or unsupported read YAML. Use a block list, inline list, or simple scalar. No installation files were changed."
        }
    }

    $legacy = Get-LegacyPaths
    foreach ($relative in $legacy) {
        Assert-NoReparseChain -Path (Join-Path $script:targetRoot $relative) -Label "legacy path $relative"
    }
    if ($legacy.Count -gt 0 -and -not $Uninstall -and (-not $MigrateLegacy -or $Verify)) {
        throw "Legacy Xskill paths would create two routers: $($legacy -join ', '). Rerun with -MigrateLegacy to back them up and remove them before installing."
    }
    return $legacy
}

function Move-LegacyPathsToBackup {
    param([string[]] $Paths)
    if ($Paths.Count -gt 0) { Initialize-BackupRoot }
    foreach ($relative in $Paths) {
        $source = Join-Path $script:targetRoot $relative
        $destination = Join-Path $script:backupRoot (Join-Path "legacy-xskill" $relative)
        New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
        Copy-Item -LiteralPath $source -Destination $destination -Recurse -Force
        Remove-Item -LiteralPath $source -Recurse -Force
    }
}

function Set-ManagedMarkdownBlock {
    param([string] $RelativePath, [string] $FragmentPath)

    $path = Join-Path $script:targetRoot $RelativePath
    $start = "<!-- zerotohero:start -->"
    $end = "<!-- zerotohero:end -->"
    $fragment = (Read-Utf8 -Path $FragmentPath).Trim()
    $block = "$start`n$fragment`n$end"
    $content = if (Test-Path -LiteralPath $path -PathType Leaf) { Read-Utf8 -Path $path } else { "" }
    $pattern = "(?ms)^<!-- zerotohero:start -->[ \t]*\r?\n.*?^<!-- zerotohero:end -->[ \t]*\r?$"

    if ([System.Text.RegularExpressions.Regex]::IsMatch($content, $pattern)) {
        $regex = New-Object System.Text.RegularExpressions.Regex($pattern)
        $next = $regex.Replace($content, [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $block }, 1)
    } elseif ([string]::IsNullOrWhiteSpace($content)) {
        $next = "$block`n"
    } else {
        $next = "$($content.TrimEnd())`n`n$block`n"
    }

    if ($next -ne $content) {
        Backup-ProjectFile -Path $path -RelativePath $RelativePath
        New-Item -ItemType Directory -Path (Split-Path -Parent $path) -Force | Out-Null
        Write-Utf8NoBom -Path $path -Content $next
        $script:changedFiles.Add($RelativePath) | Out-Null
    }
}

function Set-AiderReadEntry {
    $relativePath = ".aider.conf.yml"
    $path = Join-Path $script:targetRoot $relativePath
    $entry = "ZEROTOHERO.md"
    $content = if (Test-Path -LiteralPath $path -PathType Leaf) { Read-Utf8 -Path $path } else { "" }

    $analysis = Get-AiderAnalysis -Content $content
    if ($analysis.HasEntry) { return }

    if ([string]::IsNullOrWhiteSpace($content)) {
        $next = "read:`n  - $entry`n"
    } elseif ($analysis.Shape -eq "block") {
        $regex = New-Object System.Text.RegularExpressions.Regex('(?m)^read\s*:\s*(?:#.*)?$')
        $next = $regex.Replace($content, [System.Text.RegularExpressions.MatchEvaluator]{ param($m) "$($m.Value)`n  - $entry" }, 1)
    } elseif ($analysis.Shape -eq "inline" -and $content -match "(?m)^read\s*:\s*\[(?<items>[^\]]*)\](?<comment>\s*(?:#.*)?)$") {
        $items = $Matches["items"].Trim()
        $comment = $Matches["comment"]
        $replacement = if ($items) { "read: [$items, `"$entry`"]$comment" } else { "read: [`"$entry`"]$comment" }
        $regex = New-Object System.Text.RegularExpressions.Regex('(?m)^read\s*:\s*\[[^\]]*\]\s*(?:#.*)?$')
        $next = $regex.Replace($content, $replacement, 1)
    } elseif ($analysis.Shape -eq "scalar" -and $content -match "(?m)^read\s*:\s*(?<value>[^#\r\n]+?)(?<comment>\s*(?:#.*)?)$") {
        $value = $Matches["value"].Trim()
        $comment = $Matches["comment"]
        $replacement = "read:`n  - $value$comment`n  - $entry"
        $regex = New-Object System.Text.RegularExpressions.Regex('(?m)^read\s*:\s*[^#\r\n]+?\s*(?:#.*)?$')
        $next = $regex.Replace($content, $replacement, 1)
    } else {
        $next = "$($content.TrimEnd())`n`nread:`n  - $entry`n"
    }

    if ($next -ne $content) {
        Backup-ProjectFile -Path $path -RelativePath $relativePath
        Write-Utf8NoBom -Path $path -Content $next
        $script:changedFiles.Add($relativePath) | Out-Null
    }
}

function Remove-ManagedMarkdownBlock {
    param([string] $RelativePath, [bool] $CreatedByInstaller)

    $path = Join-Path $script:targetRoot $RelativePath
    $content = Read-Utf8 -Path $path
    $pattern = "(?ms)^<!-- zerotohero:start -->[ \t]*\r?\n.*?^<!-- zerotohero:end -->[ \t]*\r?$"
    $regex = New-Object System.Text.RegularExpressions.Regex($pattern)
    $next = $regex.Replace($content, "", 1).TrimEnd()

    Backup-ProjectFile -Path $path -RelativePath (Join-Path "uninstall" $RelativePath)
    if ([string]::IsNullOrWhiteSpace($next) -and $CreatedByInstaller) {
        Remove-Item -LiteralPath $path -Force
    } elseif ([string]::IsNullOrWhiteSpace($next)) {
        Write-Utf8NoBom -Path $path -Content ""
    } else {
        Write-Utf8NoBom -Path $path -Content ($next + "`n")
    }
}

function Remove-AiderReadEntry {
    param([bool] $EntryManaged, [bool] $CreatedByInstaller, [bool] $ReadCreated)

    if (-not $EntryManaged) { return }
    $relativePath = ".aider.conf.yml"
    $path = Join-Path $script:targetRoot $relativePath
    $content = (Read-Utf8 -Path $path) -replace "`r`n", "`n"
    $analysis = Get-AiderAnalysis -Content $content
    $next = $content

    if ($analysis.Shape -eq "inline") {
        $match = [regex]::Match($content, '(?m)^(?<prefix>read\s*:\s*)\[(?<items>[^\]]*)\](?<comment>\s*(?:#.*)?)$')
        if (-not $match.Success) { throw "Safe Aider uninstall failed before replacement." }
        $items = @($match.Groups["items"].Value -split ',' | ForEach-Object { $_.Trim() } | Where-Object {
            $_ -and $_ -notmatch '(?i)^[\x27\x22]?ZEROTOHERO\.md[\x27\x22]?$'
        })
        $replacement = $match.Groups["prefix"].Value + "[" + ($items -join ", ") + "]" + $match.Groups["comment"].Value
        $next = $content.Substring(0, $match.Index) + $replacement + $content.Substring($match.Index + $match.Length)
    } elseif ($analysis.Shape -eq "scalar") {
        $regex = New-Object System.Text.RegularExpressions.Regex('(?im)^read\s*:\s*[\x27\x22]?ZEROTOHERO\.md[\x27\x22]?\s*(?:#.*)?\n?')
        $next = $regex.Replace($content, '', 1)
    } elseif ($analysis.Shape -eq "block") {
        $lines = @($content -split "`n", -1)
        $output = New-Object System.Collections.Generic.List[string]
        $insideRead = $false
        $removed = $false
        foreach ($rawLine in $lines) {
            $line = $rawLine.TrimEnd("`r")
            if (-not $insideRead -and $line -match '^read\s*:\s*(?:#.*)?$') {
                $insideRead = $true
                if (-not $ReadCreated) { $output.Add($line) | Out-Null }
                continue
            }
            if ($insideRead -and $line -match '^[^\s#]') { $insideRead = $false }
            if ($insideRead -and -not $removed -and $line -match '^\s*-\s+(?<item>.+?)\s*$') {
                $item = ($Matches["item"] -replace '\s+#.*$', '').Trim()
                if ($item -match '(?i)^[\x27\x22]?ZEROTOHERO\.md[\x27\x22]?$') {
                    $removed = $true
                    continue
                }
            }
            $output.Add($line) | Out-Null
        }
        if (-not $removed) { throw "Safe Aider uninstall could not identify the managed read entry." }
        $next = $output -join "`n"
    } else {
        throw "Safe Aider uninstall could not identify the managed read entry."
    }

    Backup-ProjectFile -Path $path -RelativePath (Join-Path "uninstall" $relativePath)
    $next = $next.TrimEnd()
    if ([string]::IsNullOrWhiteSpace($next) -and $CreatedByInstaller) {
        Remove-Item -LiteralPath $path -Force
    } elseif ([string]::IsNullOrWhiteSpace($next)) {
        Write-Utf8NoBom -Path $path -Content ""
    } else {
        Write-Utf8NoBom -Path $path -Content ($next + "`n")
    }
}

function Remove-EmptyOwnedDirectories {
    param([string[]] $RelativeFiles)

    $directories = @($RelativeFiles | ForEach-Object {
        $parent = Split-Path -Parent (Join-Path $script:targetRoot $_)
        while ($parent -and $parent.StartsWith($script:targetRoot, [System.StringComparison]::OrdinalIgnoreCase) -and $parent -ne $script:targetRoot) {
            $parent
            $parent = Split-Path -Parent $parent
        }
    } | Sort-Object Length -Descending | Select-Object -Unique)
    foreach ($directory in $directories) {
        if ((Test-Path -LiteralPath $directory -PathType Container) -and -not (Get-ChildItem -LiteralPath $directory -Force | Select-Object -First 1)) {
            Remove-Item -LiteralPath $directory -Force
        }
    }
}

if (-not (Test-Path -LiteralPath $payloadRoot -PathType Container)) {
    throw "Invalid ZeroToHero package: missing $payloadRoot"
}

$targetRoot = [System.IO.Path]::GetFullPath($Target)
if (-not (Test-Path -LiteralPath $targetRoot -PathType Container)) {
    throw "ZeroToHero target must already be an existing project directory: $targetRoot"
}
$version = if (Test-Path -LiteralPath $versionFile) { (Read-Utf8 -Path $versionFile).Trim() } else { "unknown" }
$backupRoot = $null
$ownedFiles = New-Object System.Collections.Generic.List[string]
$managedFiles = New-Object System.Collections.Generic.List[string]
$changedFiles = New-Object System.Collections.Generic.List[string]
$createdManagedFiles = New-Object System.Collections.Generic.List[string]
foreach ($managed in @("AGENTS.md", "GEMINI.md", ".aider.conf.yml")) { $managedFiles.Add($managed) | Out-Null }
$expectedManagedPaths = @(".aider.conf.yml", "AGENTS.md", "GEMINI.md")
$expectedOwnedPaths = @(Get-ChildItem -LiteralPath $payloadRoot -Recurse -File -Force | ForEach-Object {
    $_.FullName.Substring($payloadRoot.Length + 1).Replace("\", "/")
}) + "ZEROTOHERO.md"
$reservedOwnedPaths = @($expectedOwnedPaths) + "zerotohero/.install-manifest.json"
$previousManifest = $null
$previousManifestPath = Join-Path $targetRoot "zerotohero/.install-manifest.json"
if (Test-Path -LiteralPath $previousManifestPath -PathType Leaf) {
    try {
        $candidate = (Read-Utf8 -Path $previousManifestPath) | ConvertFrom-Json
        $candidateOwned = @($candidate.owned_files | Sort-Object)
        $candidateManaged = @($candidate.managed_files | Sort-Object)
        $candidateCreated = @($candidate.created_managed_files)
        $invalidCreated = @($candidateCreated | Where-Object { $_ -notin $expectedManagedPaths })
        if ($candidate.product -eq "ZeroToHero" -and
            @(Compare-Object -ReferenceObject @($expectedOwnedPaths | Sort-Object) -DifferenceObject $candidateOwned).Count -eq 0 -and
            @(Compare-Object -ReferenceObject $expectedManagedPaths -DifferenceObject $candidateManaged).Count -eq 0 -and
            $invalidCreated.Count -eq 0 -and
            $candidate.aider_entry_managed -is [bool] -and
            $candidate.aider_read_created -is [bool]) {
            $previousManifest = $candidate
        }
    } catch { }
}
if ($null -ne $previousManifest) {
    foreach ($relative in @($previousManifest.created_managed_files)) {
        if ($relative) { $createdManagedFiles.Add([string] $relative) | Out-Null }
    }
}
$aiderEntryManaged = $null -ne $previousManifest -and $previousManifest.aider_entry_managed -eq $true
$aiderReadCreated = $null -ne $previousManifest -and $previousManifest.aider_read_created -eq $true
$legacyPaths = @(Assert-InstallPreflight)

if (-not $Verify -and -not $Uninstall) {
    if ($legacyPaths.Count -gt 0) { Move-LegacyPathsToBackup -Paths $legacyPaths }
}

if ($Verify -or $Uninstall) {
    $failures = New-Object System.Collections.Generic.List[string]
    $expectedOwned = New-Object System.Collections.Generic.List[string]
    Get-ChildItem -LiteralPath $payloadRoot -Recurse -File -Force | ForEach-Object {
        $relative = $_.FullName.Substring($payloadRoot.Length + 1)
        $expectedOwned.Add($relative.Replace("\", "/")) | Out-Null
        $installed = Join-Path $targetRoot $relative
        if (-not (Test-Path -LiteralPath $installed -PathType Leaf)) {
            $failures.Add("missing $relative") | Out-Null
        } elseif ((Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash -ne (Get-FileHash -Algorithm SHA256 -LiteralPath $installed).Hash) {
            $failures.Add("changed $relative") | Out-Null
        }
    }
    $expectedOwned.Add("ZEROTOHERO.md") | Out-Null
    $aiderRule = Join-Path $targetRoot "ZEROTOHERO.md"
    if (-not (Test-Path -LiteralPath $aiderRule -PathType Leaf)) {
        $failures.Add("missing ZEROTOHERO.md") | Out-Null
    } elseif ((Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $fragmentRoot "CONVENTIONS.md")).Hash -ne (Get-FileHash -Algorithm SHA256 -LiteralPath $aiderRule).Hash) {
        $failures.Add("changed ZEROTOHERO.md") | Out-Null
    }
    foreach ($managed in @("AGENTS.md", "GEMINI.md")) {
        $installed = Join-Path $targetRoot $managed
        if (-not (Test-Path -LiteralPath $installed -PathType Leaf)) {
            $failures.Add("missing managed block in $managed") | Out-Null
        } else {
            $content = Read-Utf8 -Path $installed
            $fragment = (Read-Utf8 -Path (Join-Path $fragmentRoot $managed)).Trim()
            $expectedBlock = "<!-- zerotohero:start -->`n$fragment`n<!-- zerotohero:end -->"
            if (-not ($content -replace "`r`n", "`n").Contains($expectedBlock)) {
                $failures.Add("invalid managed block in $managed") | Out-Null
            }
        }
    }
    $aiderConfig = Join-Path $targetRoot ".aider.conf.yml"
    $installedAiderAnalysis = if (Test-Path -LiteralPath $aiderConfig -PathType Leaf) { Get-AiderAnalysis -Content (Read-Utf8 -Path $aiderConfig) } else { $null }
    if (($Verify -or $aiderEntryManaged) -and ($null -eq $installedAiderAnalysis -or -not $installedAiderAnalysis.HasEntry)) {
        $failures.Add("missing Aider read entry") | Out-Null
    }
    if ($aiderEntryManaged -and $null -ne $installedAiderAnalysis -and $installedAiderAnalysis.EntryCount -ne 1) {
        $failures.Add("managed Aider read entry count is $($installedAiderAnalysis.EntryCount), expected exactly 1") | Out-Null
    }
    $manifestPath = Join-Path $targetRoot "zerotohero/.install-manifest.json"
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
        $failures.Add("missing install manifest") | Out-Null
    } else {
        try {
            $manifest = (Read-Utf8 -Path $manifestPath) | ConvertFrom-Json
            if ($manifest.product -ne "ZeroToHero" -or $manifest.version -ne $version) {
                $failures.Add("install manifest product/version mismatch") | Out-Null
            }
            $expectedManaged = @(".aider.conf.yml", "AGENTS.md", "GEMINI.md")
            $manifestManaged = @($manifest.managed_files | Sort-Object)
            if (@(Compare-Object -ReferenceObject $expectedManaged -DifferenceObject $manifestManaged).Count -gt 0) {
                $failures.Add("install manifest managed_files mismatch") | Out-Null
            }
            $manifestOwned = @($manifest.owned_files | Sort-Object)
            $expectedOwnedSorted = @($expectedOwned | Sort-Object -Unique)
            if (@(Compare-Object -ReferenceObject $expectedOwnedSorted -DifferenceObject $manifestOwned).Count -gt 0) {
                $failures.Add("install manifest owned_files mismatch") | Out-Null
            }
            $invalidCreated = @($manifest.created_managed_files | Where-Object { $_ -notin $expectedManaged })
            if ($invalidCreated.Count -gt 0) {
                $failures.Add("install manifest created_managed_files contains an unmanaged path") | Out-Null
            }
        } catch {
            $failures.Add("invalid install manifest JSON") | Out-Null
        }
    }
    if ($failures.Count -gt 0) { throw "ZeroToHero verification failed: $($failures -join '; ')" }
    if ($Uninstall -and ($manifest.aider_entry_managed -isnot [bool] -or $manifest.aider_read_created -isnot [bool])) {
        $failures.Add("install manifest lacks uninstall ownership metadata; reinstall before uninstalling") | Out-Null
    }
    if ($failures.Count -gt 0) { throw "ZeroToHero verification failed: $($failures -join '; ')" }
    if ($Verify) {
        Write-Host "ZeroToHero $version is installed in $targetRoot"
        exit 0
    }
}

if ($Uninstall) {
    $createdByInstaller = @($manifest.created_managed_files)
    foreach ($managed in @("AGENTS.md", "GEMINI.md")) {
        Remove-ManagedMarkdownBlock -RelativePath $managed -CreatedByInstaller ($managed -in $createdByInstaller)
    }
    Remove-AiderReadEntry -EntryManaged ($manifest.aider_entry_managed -eq $true) -CreatedByInstaller (".aider.conf.yml" -in $createdByInstaller) -ReadCreated ($manifest.aider_read_created -eq $true)

    $ownedToRemove = @($manifest.owned_files | Sort-Object { $_.Length } -Descending)
    foreach ($relative in $ownedToRemove) {
        Assert-SafeTargetPath -RelativePath $relative -ExpectedType File
        $path = Join-Path $targetRoot $relative
        if (Test-Path -LiteralPath $path -PathType Leaf) { Remove-Item -LiteralPath $path -Force }
    }
    $manifestPath = Join-Path $targetRoot "zerotohero/.install-manifest.json"
    if (Test-Path -LiteralPath $manifestPath -PathType Leaf) { Remove-Item -LiteralPath $manifestPath -Force }
    Remove-EmptyOwnedDirectories -RelativeFiles (@($ownedToRemove) + "zerotohero/.install-manifest.json")
    Write-Host "Uninstalled ZeroToHero $version from $targetRoot"
    Write-Host "Project files were preserved and uninstall snapshots remain under .zerotohero-backups."
    exit 0
}

Get-ChildItem -LiteralPath $payloadRoot -Recurse -File -Force | ForEach-Object {
    $relative = $_.FullName.Substring($payloadRoot.Length + 1)
    $destination = Join-Path $targetRoot $relative
    New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
    if (Test-Path -LiteralPath $destination -PathType Leaf) {
        if ((Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash -ne (Get-FileHash -Algorithm SHA256 -LiteralPath $destination).Hash) {
            Backup-ProjectFile -Path $destination -RelativePath $relative
        }
    }
    Copy-Item -LiteralPath $_.FullName -Destination $destination -Force
    $ownedFiles.Add($relative.Replace("\", "/")) | Out-Null
}

$aiderRule = Join-Path $targetRoot "ZEROTOHERO.md"
if (Test-Path -LiteralPath $aiderRule -PathType Leaf) {
    if ((Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $fragmentRoot "CONVENTIONS.md")).Hash -ne (Get-FileHash -Algorithm SHA256 -LiteralPath $aiderRule).Hash) {
        Backup-ProjectFile -Path $aiderRule -RelativePath "ZEROTOHERO.md"
    }
}
Copy-Item -LiteralPath (Join-Path $fragmentRoot "CONVENTIONS.md") -Destination $aiderRule -Force
$ownedFiles.Add("ZEROTOHERO.md") | Out-Null

$aiderPathBefore = Join-Path $targetRoot ".aider.conf.yml"
$aiderAnalysisBefore = if (Test-Path -LiteralPath $aiderPathBefore -PathType Leaf) { Get-AiderAnalysis -Content (Read-Utf8 -Path $aiderPathBefore) } else { Get-AiderAnalysis -Content "" }
$aiderHadEntry = $aiderAnalysisBefore.HasEntry
if (-not $aiderHadEntry -and $aiderAnalysisBefore.Shape -eq "none") { $aiderReadCreated = $true }
foreach ($managed in @("AGENTS.md", "GEMINI.md", ".aider.conf.yml")) {
    if (-not (Test-Path -LiteralPath (Join-Path $targetRoot $managed) -PathType Leaf)) { $createdManagedFiles.Add($managed) | Out-Null }
}
Set-ManagedMarkdownBlock -RelativePath "AGENTS.md" -FragmentPath (Join-Path $fragmentRoot "AGENTS.md")
Set-ManagedMarkdownBlock -RelativePath "GEMINI.md" -FragmentPath (Join-Path $fragmentRoot "GEMINI.md")
Set-AiderReadEntry
if (-not $aiderHadEntry) { $aiderEntryManaged = $true }

$manifest = [ordered]@{
    product = "ZeroToHero"
    version = $version
    installed_at = (Get-Date).ToString("o")
    target = $targetRoot
    owned_files = @($ownedFiles | Sort-Object -Unique)
    managed_files = @($managedFiles | Sort-Object -Unique)
    changed_files = @($changedFiles | Sort-Object -Unique)
    created_managed_files = @($createdManagedFiles | Sort-Object -Unique)
    aider_entry_managed = [bool] $aiderEntryManaged
    aider_read_created = [bool] $aiderReadCreated
    backup = if ($backupRoot -and (Test-Path -LiteralPath $backupRoot)) { $backupRoot } else { $null }
}
$manifestPath = Join-Path $targetRoot "zerotohero/.install-manifest.json"
Write-Utf8NoBom -Path $manifestPath -Content (($manifest | ConvertTo-Json -Depth 4) + "`n")

& $PSCommandPath -Target $targetRoot -Verify
if (-not $?) { throw "ZeroToHero post-install verification failed" }

Write-Host "Installed ZeroToHero $version in $targetRoot"
Write-Host "Installed namespaced project adapters plus AGENTS.md/Agent Skills compatibility entries."
Write-Host "See README-ZEROTOHERO.md and the source INSTALL.md for native, standard, and manual support tiers."
if ($backupRoot -and (Test-Path -LiteralPath $backupRoot)) { Write-Host "Project-owned files changed safely; originals are in $backupRoot" }
Write-Host "After verification, the extracted .zerotohero-package and INSTALL-ZEROTOHERO.* files may be removed or kept for the next update."
Write-Host "Reload the AI tool and work normally. Optional trigger: ZeroToHero: <task>"
