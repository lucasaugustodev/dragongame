$ErrorActionPreference = "Stop"

$token = Read-Host "Cole o HF_TOKEN" -AsSecureString
$plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
)

if ([string]::IsNullOrWhiteSpace($plain) -or -not $plain.StartsWith("hf_")) {
  throw "Token invalido. Ele deve comecar com hf_."
}

$cacheDir = Join-Path $env:USERPROFILE ".cache\huggingface"
New-Item -ItemType Directory -Force -Path $cacheDir | Out-Null
Set-Content -LiteralPath (Join-Path $cacheDir "token") -Value $plain -NoNewline

[Environment]::SetEnvironmentVariable("HF_TOKEN", $plain, "User")
$env:HF_TOKEN = $plain

Write-Host "HF_TOKEN configurado no usuario e cache local do Hugging Face."
Write-Host "Reabra o terminal depois deste comando para outras sessoes herdarem a variavel."
