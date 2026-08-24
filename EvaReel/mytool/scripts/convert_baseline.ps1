# ── Convert all assets/covers/*.jpg back to Baseline JPEG ──
# iOS/React-Native fails to decode the progressive (SOF 0xC2) JPEGs that were
# produced by the previous compression pass -> black covers on device.
# GDI+ re-encode produces standard Baseline (SOF 0xC0) JPEGs.
# Run:  powershell -ExecutionPolicy Bypass -File scripts\convert_baseline.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$dir = Join-Path $PSScriptRoot '..\assets\covers'
$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
if (-not $enc) { throw 'JPEG encoder not found' }

$params = New-Object System.Drawing.Imaging.EncoderParameters(1)
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]88)

function Get-SofMarker([byte[]]$b) {
  $i = 2
  while ($i -lt ($b.Length - 4)) {
    if ($b[$i] -eq 0xFF) {
      $m = $b[$i + 1]
      if ($m -eq 0xFF) { $i++; continue }
      if ($m -eq 0xD8 -or ($m -ge 0xD0 -and $m -le 0xD9)) { $i += 2; continue }
      $l = ($b[$i + 2] -shl 8) -bor $b[$i + 3]
      if ($m -eq 0xC0 -or $m -eq 0xC2) { return $m }
      $i += 2 + $l
    } else { $i++ }
  }
  return -1
}

foreach ($f in Get-ChildItem $dir -Filter *.jpg | Sort-Object Name) {
  $tmp = "$($f.FullName).baseline"
  $img = [System.Drawing.Image]::FromFile($f.FullName)
  try {
    $img.Save($tmp, $enc, $params)
  } finally {
    $img.Dispose()
  }
  $b = [System.IO.File]::ReadAllBytes($tmp)
  $sof = Get-SofMarker $b
  if ($sof -ne 0xC0) {
    Remove-Item -Force $tmp
    throw "$($f.Name): converted file is NOT baseline (SOF=0x$($sof.ToString('X2')))"
  }
  Move-Item -Force $tmp $f.FullName
  Write-Host "$($f.Name): OK baseline $($b.Length)B"
}
Write-Host 'All covers converted to Baseline JPEG.'
