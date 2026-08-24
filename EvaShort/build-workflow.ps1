param(
  [ValidateSet("ios", "android", "all")][string]$Platform = "ios",
  [string]$ProjectDir = "mytool",
  [string]$Account = "",
  [switch]$SkipQuota,
  [switch]$SkipEnvCheck,
  [switch]$SkipBuild,
  [switch]$SkipSubmit,
  [switch]$AutoTestFlight,
  [string]$BetaGroupId = "12a65f74-9141-4b96-b57a-c2182f69405d"
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Root = $PSScriptRoot
$Project = Join-Path $Root $ProjectDir
$Script:HasError = $false

function Write-Step([string]$title) { Write-Host "`n==== $title ====" -ForegroundColor Cyan }
function Write-OK([string]$msg) { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "  [WARN] $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg) { $Script:HasError = $true; Write-Host "  [FAIL] $msg" -ForegroundColor Red }

function Get-SessionSecret {
  $state = Join-Path $env:USERPROFILE ".expo\state.json"
  if (-not (Test-Path $state)) { throw "未找到 $state，请先运行 eas login" }
  return (Get-Content $state -Raw | ConvertFrom-Json).auth.sessionSecret
}

function Invoke-EasGraphql([string]$secret, [string]$query, $variables) {
  $body = @{ query = $query; variables = $variables } | ConvertTo-Json -Depth 8
  $r = Invoke-RestMethod -Uri "https://api.expo.dev/graphql" -Method Post -ContentType "application/json" -Headers @{ "expo-session" = $secret } -Body $body -TimeoutSec 30
  if ($r.errors) { throw ($r.errors | ConvertTo-Json -Depth 5) }
  return $r.data
}

function Test-Quota([string]$secret) {
  Write-Step "第一步：EAS 账号构建额度审查"
  $me = Invoke-EasGraphql $secret "query { me { id username accounts { id name } } }" $null
  $owner = ""
  $appPath = Join-Path $Project "app.json"
  if (Test-Path $appPath) { $owner = (Get-Content $appPath -Raw | ConvertFrom-Json).expo.owner }
  $acc = $me.me.accounts | Where-Object { $_.name -eq $Account }
  if (-not $acc) { $acc = $me.me.accounts | Where-Object { $_.name -eq $owner } }
  if (-not $acc) { $acc = $me.me.accounts[0] }
  Write-Host "  检查账号: $($acc.name) (owner=$owner, 参数=$Account)"

  $now = (Get-Date).ToUniversalTime().ToString("o")
  $q = "query Usage(`$accountId: String!, `$currentDate: DateTime!) { account { byId(accountId: `$accountId) { id name subscription { id name } usageMetrics { EAS_BUILD: byBillingPeriod(date: `$currentDate, service: BUILDS) { id planMetrics { id serviceMetric value limit } overageMetrics { id value metadata { ... on AccountUsageEASBuildMetadata { billingResourceClass platform } } } } } } } }"
  $data = Invoke-EasGraphql $secret $q @{ accountId = $acc.id; currentDate = $now }
  $usage = $data.account.byId.usageMetrics.EAS_BUILD
  $plan = $data.account.byId.subscription.name
  $metric = $usage.planMetrics | Where-Object { $_.serviceMetric -eq "BUILDS" } | Select-Object -First 1
  $local = $usage.planMetrics | Where-Object { $_.serviceMetric -eq "LOCAL_BUILDS" } | Select-Object -First 1
  $remaining = $metric.limit - $metric.value
  Write-Host "  套餐: $plan"
  Write-Host "  云端构建: 已用 $($metric.value) / 限额 $($metric.limit) (剩余 $remaining)"
  Write-Host "  本地构建: 已用 $($local.value) / 限额 $($local.limit)"
  if ($usage.overageMetrics) {
    foreach ($o in $usage.overageMetrics) { Write-Host "  超量: $($o.value) ($($o.metadata.platform) / $($o.metadata.billingResourceClass))" }
  }
  if ($remaining -le 0) {
    Write-Fail "构建额度已用尽，无法打包（考虑升级套餐或改用 LOCAL_BUILDS）"
    return $false
  }
  Write-OK "额度充足，可继续打包"
  return $true
}

function Test-Env {
  Write-Step "第二步：打包环境配置审查"
  if (-not (Test-Path $Project)) { Write-Fail "项目目录不存在: $Project"; return $false }

  Write-Host "  --- eas 登录 ---"
  try { $w = (& eas whoami 2>&1) -join "`n" } catch { $w = "" }
  if ($w -match "not logged in|notLoggedIn") { Write-Fail "未登录 eas，请运行 eas login" } else { Write-OK "eas 已登录" }

  Write-Host "  --- app.json ---"
  $appPath = Join-Path $Project "app.json"
  try {
    $app = Get-Content $appPath -Raw | ConvertFrom-Json
    if ($app.expo.extra.eas.projectId) { Write-OK "已关联 EAS 项目 ($($app.expo.extra.eas.projectId))" } else { Write-Fail "缺少 extra.eas.projectId，请运行 eas init" }
    if ($app.expo.ios.bundleIdentifier) { Write-OK "iOS bundleId: $($app.expo.ios.bundleIdentifier)" } else { Write-Fail "缺少 ios.bundleIdentifier" }
    if ($app.expo.android.package) { Write-OK "Android package: $($app.expo.android.package)" } else { Write-Fail "缺少 android.package" }
  } catch { Write-Fail "app.json 解析失败: $($_.Exception.Message)" }

  Write-Host "  --- 资源文件 ---"
  $assets = @("icon.png", "android-icon-foreground.png", "android-icon-background.png", "android-icon-monochrome.png", "splash-icon.png")
  $assetDir = Join-Path $Project "assets"
  foreach ($a in $assets) {
    if (Test-Path (Join-Path $assetDir $a)) { Write-OK "assets/$a" } else { Write-Fail "缺少 assets/$a" }
  }

  Write-Host "  --- eas.json ---"
  $easPath = Join-Path $Project "eas.json"
  try {
    $eas = Get-Content $easPath -Raw | ConvertFrom-Json
    $sub = $eas.submit.production.ios
    if ($sub -and $sub.ascAppId -and $sub.ascAppId -notmatch "^YOUR_") { Write-OK "submit 配置: ascAppId=$($sub.ascAppId) key=$($sub.ascApiKeyId)" } else { Write-Fail "eas.json submit.production.ios 未配置或仍是占位符" }
  } catch { Write-Fail "eas.json 解析失败: $($_.Exception.Message)" }

  Write-Host "  --- ASC API 密钥 ---"
  $keysDir = Join-Path $Root "keys"
  $keyId = ""
  try { $keyId = (Get-Content (Join-Path $keysDir "keyID.txt") -Raw).Trim() } catch { }
  $p8 = Join-Path $keysDir "AuthKey_$keyId.p8"
  if ($keyId -and (Test-Path $p8) -and (Test-Path (Join-Path $keysDir "Issuer.txt"))) {
    Write-OK "密钥文件存在 (AuthKey_$keyId.p8)"
    try {
      Push-Location $Project
      $out = (& node (Join-Path $Root "mytool\scripts\check_asc_key.js") $keyId 2>&1) -join "`n"
      Pop-Location
    } catch { Pop-Location; $out = "" }
    if ($out -match "visible: YES") { Write-OK "ASC 密钥有效，bundle 可见" }
    else { Write-Fail "ASC 密钥无效或 bundle 不可见" }
  } else { Write-Fail "密钥文件缺失 (AuthKey_$keyId.p8 / keyID.txt / Issuer.txt)" }

  Write-Host "  --- 依赖 ---"
  if (Test-Path (Join-Path $Project "node_modules")) { Write-OK "node_modules 存在" } else { Write-Fail "缺少 node_modules，请先 npm install" }

  if ($Script:HasError) { Write-Fail "环境配置不完整"; return $false }
  Write-OK "环境配置完整，可开始打包"
  return $true
}

function Invoke-Build {
  Write-Step "第三步：EAS 云端打包 ($Platform / production)"
  Push-Location $Project
  try {
    & eas build --platform $Platform --profile production --non-interactive
    if ($LASTEXITCODE -ne 0) { throw "eas build 失败 (exit=$LASTEXITCODE)" }
  } finally { Pop-Location }
  Write-OK "打包完成"
}

function Invoke-Submit {
  Write-Step "第四步：上传平台"
  if ($Platform -eq "android") {
    $sub = (Get-Content (Join-Path $Project "eas.json") -Raw | ConvertFrom-Json).submit.production.android
    if ($sub -and $sub.serviceAccountKeyPath) {
      Push-Location $Project
      try { & eas submit --platform android --profile production --non-interactive } finally { Pop-Location }
    } else {
      Write-Warn "eas.json 未配置 android 提交信息 (serviceAccountKeyPath)，跳过 Android 上传（仅出包）"
    }
    return
  }
  Push-Location $Project
  try {
    & eas submit --platform ios --profile production --non-interactive
    if ($LASTEXITCODE -ne 0) { throw "eas submit 失败 (exit=$LASTEXITCODE)" }
  } finally { Pop-Location }
  Write-OK "iOS 构建已上传 App Store Connect"

  if ($AutoTestFlight) {
    Write-Host "  --- 等待 TestFlight 处理并加入组 ---"
    & node (Join-Path $Root "mytool\scripts\tf_wait_add.js") $BetaGroupId
    if ($LASTEXITCODE -ne 0) { Write-Fail "TestFlight 等待/加组失败" } else { Write-OK "已加入 TestFlight 组 $BetaGroupId" }
  }
}

Write-Host "=== EAS 打包工作流 (项目: $ProjectDir, 平台: $Platform) ===" -ForegroundColor Magenta
$secret = Get-SessionSecret

if (-not $SkipQuota) { if (-not (Test-Quota $secret)) { exit 1 } }
if (-not $SkipEnvCheck) { if (-not (Test-Env)) { exit 1 } }
if (-not $SkipBuild) { Invoke-Build } else { Write-Warn "跳过打包" }
if (-not $SkipSubmit) { Invoke-Submit } else { Write-Warn "跳过上传" }

Write-Host "`n=== 工作流完成 ===" -ForegroundColor Magenta