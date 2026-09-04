$root = Split-Path -Parent $PSScriptRoot
$port = 5173
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$port/"

$mime = @{
  ".html"="text/html"; ".css"="text/css"; ".js"="application/javascript";
  ".json"="application/json"; ".svg"="image/svg+xml"; ".png"="image/png";
  ".jpg"="image/jpeg"; ".jpeg"="image/jpeg"; ".ico"="image/x-icon";
  ".mov"="video/quicktime"; ".mp4"="video/mp4"; ".webm"="video/webm";
  ".pdf"="application/pdf"; ".woff2"="font/woff2"; ".woff"="font/woff"
}

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $req = $context.Request
  $res = $context.Response
  $path = $req.Url.LocalPath
  if ($path -eq "/") { $path = "/index.html" }
  $filePath = Join-Path $root ($path.TrimStart("/"))

  if (Test-Path $filePath -PathType Leaf) {
    $ext = [System.IO.Path]::GetExtension($filePath)
    $ct = $mime[$ext]
    if (-not $ct) { $ct = "application/octet-stream" }
    $res.ContentType = $ct
    $res.Headers.Add("Accept-Ranges", "bytes")

    $fileLength = (Get-Item $filePath).Length
    $rangeHeader = $req.Headers["Range"]

    if ($rangeHeader -and $rangeHeader -match "bytes=(\d*)-(\d*)") {
      $start = if ($matches[1]) { [int64]$matches[1] } else { 0 }
      $end = if ($matches[2]) { [int64]$matches[2] } else { $fileLength - 1 }
      if ($end -ge $fileLength) { $end = $fileLength - 1 }
      $length = $end - $start + 1

      $res.StatusCode = 206
      $res.Headers.Add("Content-Range", "bytes $start-$end/$fileLength")
      $res.ContentLength64 = $length

      $stream = [System.IO.File]::OpenRead($filePath)
      $stream.Seek($start, [System.IO.SeekOrigin]::Begin) | Out-Null
      $buffer = New-Object byte[] 65536
      $remaining = $length
      while ($remaining -gt 0) {
        $toRead = [Math]::Min($buffer.Length, $remaining)
        $read = $stream.Read($buffer, 0, $toRead)
        if ($read -le 0) { break }
        $res.OutputStream.Write($buffer, 0, $read)
        $remaining -= $read
      }
      $stream.Close()
    } else {
      $bytes = [System.IO.File]::ReadAllBytes($filePath)
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    }
  } else {
    $res.StatusCode = 404
    $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $path")
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  }
  $res.OutputStream.Close()
}
