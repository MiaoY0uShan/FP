# FP GCM Helper — retrieve API keys from Windows Credential Manager
# Usage: .\gcm-get.ps1 "target-name"
# Example: .\gcm-get.ps1 "akile-api-key"
param([string]$Target)

if (-not $Target) {
    Write-Error "Usage: gcm-get.ps1 <target-name>"
    exit 1
}

# Try Windows Credential Manager via cmdkey
$output = cmdkey /list:$Target 2>$null
if ($LASTEXITCODE -ne 0 -or -not $output) {
    # Fallback: try git credential manager
    $input = "protocol=https`nhost=$Target`n`n" | git credential-manager get 2>$null
    if ($input -match "password=(.+)") {
        Write-Output $matches[1].Trim()
        exit 0
    }
    # Fallback: environment variable
    $envName = $Target.ToUpper() -replace '-', '_'
    $envVal = [Environment]::GetEnvironmentVariable($envName, 'User')
    if ($envVal) {
        Write-Output $envVal
        exit 0
    }
    Write-Error "No credential found for: $Target"
    exit 1
}

# Parse cmdkey output for password
# cmdkey /list:target outputs "User: <user>" but password requires manual retrieval
# For stored credentials, use PowerShell's CredentialManager module if available
if (Get-Module -ListAvailable -Name CredentialManager) {
    Import-Module CredentialManager -Force -ErrorAction SilentlyContinue
    $cred = Get-StoredCredential -Target $Target -ErrorAction SilentlyContinue
    if ($cred) {
        Write-Output $cred.GetNetworkCredential().Password
        exit 0
    }
}

# Last fallback: read from a secure file in ~/.fp/credentials/
$credFile = "$env:USERPROFILE\.fp\credentials\$Target"
if (Test-Path $credFile) {
    $secure = Get-Content $credFile -Raw | ConvertTo-SecureString -ErrorAction SilentlyContinue
    if ($secure) {
        $ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
        try { Write-Output [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
        finally { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
        exit 0
    }
}

Write-Error "No credential found for: $Target (tried cmdkey, git-credential-manager, env var, ~/.fp/credentials)"
exit 1
