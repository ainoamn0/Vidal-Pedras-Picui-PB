Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('logooriginal.jpeg')
$bmp = New-Object System.Drawing.Bitmap 32, 32
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($img, 0, 0, 32, 32)
$bmp.Save('favicon.png', [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
$img.Dispose()
