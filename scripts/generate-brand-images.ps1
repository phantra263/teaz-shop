Add-Type -AssemblyName System.Drawing

function Save-TeaZImage {
  param(
    [string]$Path,
    [int]$Width,
    [int]$Height,
    [ValidateSet("card", "mark")]
    [string]$Kind
  )

  $bitmap = New-Object System.Drawing.Bitmap $Width, $Height
  $bitmap.SetResolution(96, 96)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $rect = New-Object System.Drawing.Rectangle 0, 0, $Width, $Height
  $start = [System.Drawing.Color]::FromArgb(255, 20, 83, 45)
  $end = [System.Drawing.Color]::FromArgb(255, 22, 163, 74)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $start, $end, 28
  $graphics.FillRectangle($brush, $rect)

  $glow = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(36, 255, 255, 255))
  $graphics.FillEllipse($glow, [int]($Width * 0.58), [int]($Height * -0.35), [int]($Width * 0.62), [int]($Width * 0.62))

  $white = [System.Drawing.Brushes]::White
  $family = "Segoe UI"

  if ($Kind -eq "card") {
    $brand = New-Object System.Drawing.Font $family, 86, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
    $sub = New-Object System.Drawing.Font $family, 34, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
    $handle = New-Object System.Drawing.Font $family, 28, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
    $graphics.DrawString("TeaZ", $brand, $white, 78, 175)
    $graphics.DrawString("Săn deal chuẩn  ·  Review có tâm", $sub, $white, 82, 290)
    $graphics.DrawString("@teaz_shop", $handle, $white, 82, 360)
    $brand.Dispose()
    $sub.Dispose()
    $handle.Dispose()
  } else {
    $sizePx = [Math]::Max(28, [int]($Width * 0.2))
    $brand = New-Object System.Drawing.Font $family, $sizePx, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
    $measured = $graphics.MeasureString("TeaZ", $brand)
    $x = ($Width - $measured.Width) / 2
    $y = ($Height - $measured.Height) / 2 - ($Height * 0.02)
    $graphics.DrawString("TeaZ", $brand, $white, $x, $y)
    $brand.Dispose()
  }

  $directory = Split-Path $Path
  if (-not (Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory | Out-Null
  }

  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
  $brush.Dispose()
  $glow.Dispose()
}

$root = Split-Path $PSScriptRoot -Parent
Save-TeaZImage -Path (Join-Path $root "public\og-image.png") -Width 1200 -Height 630 -Kind card
Save-TeaZImage -Path (Join-Path $root "public\apple-touch-icon.png") -Width 180 -Height 180 -Kind mark
Save-TeaZImage -Path (Join-Path $root "public\icon-512.png") -Width 512 -Height 512 -Kind mark
