$ErrorActionPreference = "Stop"

$width = 1542
$height = 800
$cell = 20

if ($args.Count -ge 2) {
  $width = [int]$args[0]
  $height = [int]$args[1]
}
if ($args.Count -ge 3) {
  $cell = [int]$args[2]
}

function Find-JavaBin {
  $candidates = @(
    "$env:JAVA_HOME\bin",
    "C:\Program Files\Java",
    "C:\Program Files\Eclipse Adoptium",
    "$env:APPDATA\.minecraft\runtime"
  ) | Where-Object { $_ -and (Test-Path $_) }

  foreach ($p in $candidates) {
    try {
      $hit = Get-ChildItem -Path $p -Recurse -Filter javac.exe -ErrorAction SilentlyContinue | Select-Object -First 1
      if ($hit) { return $hit.Directory.FullName }
    } catch {}
  }
  return $null
}

$javaBin = Find-JavaBin
if (-not $javaBin) {
  throw "Cannot find javac.exe. Install a JDK or set JAVA_HOME to a JDK folder."
}

$javac = Join-Path $javaBin "javac.exe"
$java = Join-Path $javaBin "java.exe"

& $javac .\DoHoa.java
& $java DoHoa $width $height $cell
