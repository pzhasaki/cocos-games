Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$characterDir = Join-Path $root "assets\textures\characters"
$enemyDir = Join-Path $root "assets\textures\enemies"
$vfxDir = Join-Path $root "assets\textures\vfx"
New-Item -ItemType Directory -Force -Path $characterDir, $enemyDir, $vfxDir | Out-Null

function New-Canvas([int]$size = 256) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.Clear([System.Drawing.Color]::FromArgb(0,0,0,0))
    return @{ Bitmap = $bmp; Graphics = $g }
}

function Brush($a, $r, $g, $b) {
    return New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($a, $r, $g, $b))
}

function Pen($a, $r, $g, $b, $w = 1) {
    $p = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb($a, $r, $g, $b)), $w
    $p.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $p.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $p.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    return $p
}

function Pts([array]$coords) {
    $pts = New-Object System.Drawing.PointF[] ($coords.Count / 2)
    for ($i = 0; $i -lt $coords.Count; $i += 2) {
        $pts[$i / 2] = New-Object System.Drawing.PointF ([float]$coords[$i]), ([float]$coords[$i + 1])
    }
    return $pts
}

function Draw-Ellipse($g, $brush, $x, $y, $w, $h) { $g.FillEllipse($brush, [float]$x, [float]$y, [float]$w, [float]$h) }
function Draw-Line($g, $pen, $x1, $y1, $x2, $y2) { $g.DrawLine($pen, [float]$x1, [float]$y1, [float]$x2, [float]$y2) }
function Draw-Poly($g, $brush, [array]$coords) { $g.FillPolygon($brush, (Pts $coords)) }
function Stroke-Poly($g, $pen, [array]$coords) { $g.DrawPolygon($pen, (Pts $coords)) }
function Draw-RoundRect($g, $brush, $x, $y, $w, $h, $r) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    $g.FillPath($brush, $path)
    $path.Dispose()
}

function Save-Art($canvas, $path) {
    $canvas.Graphics.Dispose()
    $canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $canvas.Bitmap.Dispose()
}

function Draw-Humanoid($path, $body, $trim, $accent, $kind) {
    $c = New-Canvas
    $g = $c.Graphics
    Draw-Ellipse $g (Brush 72 0 0 0) 62 204 132 24
    Draw-Poly $g (Brush 210 12 18 30) @(74,88, 102,68, 128,214, 72,196)
    Draw-Poly $g (Brush 180 18 24 38) @(182,88, 154,68, 128,214, 184,196)
    Draw-Ellipse $g (Brush 120 20 26 38) 74 65 108 140
    Draw-Line $g (Pen 210 14 18 28 18) 102 180 88 226
    Draw-Line $g (Pen 210 14 18 28 18) 154 180 168 226
    Draw-Line $g (Pen 255 $trim[0] $trim[1] $trim[2] 7) 96 220 74 230
    Draw-Line $g (Pen 255 $trim[0] $trim[1] $trim[2] 7) 160 220 182 230
    Draw-Line $g (Pen 180 18 24 36 15) 83 142 49 184
    Draw-Line $g (Pen 180 18 24 36 15) 173 142 207 184
    Draw-Line $g (Pen 210 $trim[0] $trim[1] $trim[2] 10) 86 138 55 176
    Draw-Line $g (Pen 210 $trim[0] $trim[1] $trim[2] 10) 170 138 201 176
    Draw-RoundRect $g (Brush 255 $body[0] $body[1] $body[2]) 84 82 88 106 22
    Draw-RoundRect $g (Brush 255 $trim[0] $trim[1] $trim[2]) 74 88 34 28 10
    Draw-RoundRect $g (Brush 255 $trim[0] $trim[1] $trim[2]) 148 88 34 28 10
    Draw-RoundRect $g (Brush 255 16 22 34) 95 92 66 78 12
    Draw-RoundRect $g (Brush 255 $body[0] $body[1] $body[2]) 101 74 54 42 18
    Draw-Ellipse $g (Brush 255 236 246 255) 108 77 40 32
    Draw-Line $g (Pen 190 20 28 42 5) 108 81 95 72
    Draw-Line $g (Pen 190 20 28 42 5) 148 81 161 72
    Draw-Ellipse $g (Brush 255 $accent[0] $accent[1] $accent[2]) 119 86 18 12
    Draw-RoundRect $g (Brush 230 $trim[0] $trim[1] $trim[2]) 76 126 104 18 8
    Draw-Line $g (Pen 190 238 246 255 4) 105 117 151 117
    Draw-Line $g (Pen 180 $accent[0] $accent[1] $accent[2] 5) 102 151 154 151
    if ($kind -eq "blade") {
        Draw-Ellipse $g (Brush 100 255 218 110) 42 36 172 172
        Draw-Line $g (Pen 255 255 225 112 10) 154 107 218 47
        Draw-Line $g (Pen 240 255 250 210 4) 158 102 212 52
        Draw-Line $g (Pen 255 255 225 112 8) 101 112 38 55
        Draw-Line $g (Pen 230 255 250 210 3) 96 108 43 59
    } elseif ($kind -eq "spear") {
        Draw-Ellipse $g (Brush 80 116 214 255) 49 48 158 158
        Draw-Line $g (Pen 255 116 220 255 9) 52 198 205 49
        Draw-Poly $g (Brush 255 232 250 255) @(205,49, 187,54, 201,70)
    } elseif ($kind -eq "gun") {
        Draw-Poly $g (Brush 210 24 36 42) @(84,82, 124,61, 162,84, 145,103, 110,103)
        Draw-RoundRect $g (Brush 255 34 44 52) 150 102 74 20 6
        Draw-RoundRect $g (Brush 255 156 238 140) 178 94 46 12 4
        Draw-Line $g (Pen 210 156 238 140 4) 220 100 238 96
    } else {
        Draw-Ellipse $g (Brush 70 204 154 255) 67 48 122 122
        Draw-Ellipse $g (Brush 150 204 154 255) 174 58 44 44
        Draw-Ellipse $g (Brush 255 238 232 255) 187 71 18 18
        Draw-Line $g (Pen 160 204 154 255 4) 153 93 185 75
    }
    Draw-RoundRect $g (Brush 88 255 255 255) 95 86 20 70 10
    Draw-Line $g (Pen 110 255 255 255 2) 104 99 104 151
    Draw-Line $g (Pen 120 $accent[0] $accent[1] $accent[2] 3) 88 184 168 184
    Save-Art $c $path
}

function Draw-Enemy($path, $kind, $main, $accent) {
    $c = New-Canvas
    $g = $c.Graphics
    Draw-Ellipse $g (Brush 64 0 0 0) 56 210 144 24
    if ($kind -eq "chaser") {
        Draw-Poly $g (Brush 255 $main[0] $main[1] $main[2]) @(128,42, 182,88, 174,172, 128,210, 82,172, 74,88)
        Stroke-Poly $g (Pen 230 22 26 38 6) @(128,42, 182,88, 174,172, 128,210, 82,172, 74,88)
        Draw-Ellipse $g (Brush 255 $accent[0] $accent[1] $accent[2]) 103 91 17 21
        Draw-Ellipse $g (Brush 255 $accent[0] $accent[1] $accent[2]) 136 91 17 21
        Draw-Line $g (Pen 190 255 220 220 4) 99 137 157 137
    } elseif ($kind -eq "tank") {
        Draw-RoundRect $g (Brush 255 $main[0] $main[1] $main[2]) 58 58 140 140 26
        Draw-RoundRect $g (Brush 255 88 54 42) 75 78 106 90 14
        Draw-RoundRect $g (Brush 255 $accent[0] $accent[1] $accent[2]) 80 118 96 20 8
        Draw-Line $g (Pen 170 255 235 180 6) 64 91 192 91
    } elseif ($kind -eq "dasher") {
        Draw-Poly $g (Brush 255 $main[0] $main[1] $main[2]) @(128,36, 216,192, 128,162, 40,192)
        Stroke-Poly $g (Pen 230 28 22 38 6) @(128,36, 216,192, 128,162, 40,192)
        Draw-Poly $g (Brush 255 $accent[0] $accent[1] $accent[2]) @(128,69, 161,145, 128,132, 95,145)
    } elseif ($kind -eq "spitter") {
        Draw-Ellipse $g (Brush 255 $main[0] $main[1] $main[2]) 58 58 140 140
        Draw-Ellipse $g (Brush 255 20 38 32) 87 87 82 82
        Draw-Ellipse $g (Brush 255 $accent[0] $accent[1] $accent[2]) 105 105 46 46
        Draw-Line $g (Pen 180 $accent[0] $accent[1] $accent[2] 7) 128 30 128 76
    } elseif ($kind -eq "swarm") {
        Draw-Ellipse $g (Brush 255 $main[0] $main[1] $main[2]) 58 78 76 94
        Draw-Ellipse $g (Brush 255 $main[0] $main[1] $main[2]) 122 78 76 94
        Draw-Ellipse $g (Brush 255 $accent[0] $accent[1] $accent[2]) 88 105 22 22
        Draw-Ellipse $g (Brush 255 $accent[0] $accent[1] $accent[2]) 146 105 22 22
        Draw-Line $g (Pen 180 255 210 190 4) 73 67 42 40
        Draw-Line $g (Pen 180 255 210 190 4) 183 67 214 40
    } elseif ($kind -eq "binder") {
        Draw-RoundRect $g (Brush 255 $main[0] $main[1] $main[2]) 64 58 128 132 24
        Draw-Ellipse $g (Brush 255 38 24 58) 84 78 88 88
        Draw-Ellipse $g (Brush 255 $accent[0] $accent[1] $accent[2]) 106 100 44 44
        Draw-Ellipse $g (Brush 80 $accent[0] $accent[1] $accent[2]) 56 50 144 144
        Draw-Line $g (Pen 210 235 214 255 5) 128 36 128 78
        Draw-Line $g (Pen 210 235 214 255 5) 92 196 164 196
    } else {
        Draw-Ellipse $g (Brush 70 255 92 144) 22 28 212 212
        Draw-Poly $g (Brush 245 64 24 92) @(45,84, 80,16, 116,80, 93,104)
        Draw-Poly $g (Brush 245 64 24 92) @(211,84, 176,16, 140,80, 163,104)
        Draw-Poly $g (Brush 255 44 26 58) @(49,189, 75,224, 101,193)
        Draw-Poly $g (Brush 255 44 26 58) @(207,189, 181,224, 155,193)
        Draw-RoundRect $g (Brush 255 $main[0] $main[1] $main[2]) 38 58 180 148 28
        Draw-RoundRect $g (Brush 255 205 60 136) 49 71 158 122 24
        Draw-RoundRect $g (Brush 220 80 35 112) 65 91 126 76 16
        Draw-Ellipse $g (Brush 255 $accent[0] $accent[1] $accent[2]) 80 94 32 32
        Draw-Ellipse $g (Brush 255 $accent[0] $accent[1] $accent[2]) 144 94 32 32
        Draw-Ellipse $g (Brush 255 255 224 120) 106 132 44 44
        Draw-Ellipse $g (Brush 190 255 128 62) 116 142 24 24
        Draw-Line $g (Pen 245 255 224 120 7) 70 176 186 176
        Draw-Line $g (Pen 220 48 20 64 4) 81 156 102 169
        Draw-Line $g (Pen 220 48 20 64 4) 175 156 154 169
        Draw-Line $g (Pen 180 255 226 150 3) 92 184 164 184
        Draw-Ellipse $g (Brush 50 255 255 255) 62 72 48 86
    }
    Draw-RoundRect $g (Brush 60 255 255 255) 76 64 28 90 12
    Save-Art $c $path
}

Draw-Humanoid (Join-Path $characterDir "blade_adept.png") @(72,148,230) @(255,218,110) @(255,218,110) "blade"
Draw-Humanoid (Join-Path $characterDir "rift_spearman.png") @(48,152,184) @(116,214,255) @(116,214,255) "spear"
Draw-Humanoid (Join-Path $characterDir "hex_gambler.png") @(58,190,132) @(156,238,140) @(156,238,140) "gun"
Draw-Humanoid (Join-Path $characterDir "storm_mage.png") @(142,112,238) @(204,154,255) @(204,154,255) "orb"

Draw-Enemy (Join-Path $enemyDir "void_chaser.png") "chaser" @(255,96,96) @(255,218,218)
Draw-Enemy (Join-Path $enemyDir "core_tank.png") "tank" @(255,166,82) @(255,228,158)
Draw-Enemy (Join-Path $enemyDir "rift_dasher.png") "dasher" @(255,86,126) @(255,210,120)
Draw-Enemy (Join-Path $enemyDir "star_spitter.png") "spitter" @(120,220,150) @(172,255,190)
Draw-Enemy (Join-Path $enemyDir "hex_swarm.png") "swarm" @(255,118,92) @(255,224,160)
Draw-Enemy (Join-Path $enemyDir "gravity_binder.png") "binder" @(168,122,255) @(235,214,255)
Draw-Enemy (Join-Path $enemyDir "core_brute_boss.png") "boss" @(184,82,255) @(255,214,246)

$sheet = New-Object System.Drawing.Bitmap 1024, 768, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$sg = [System.Drawing.Graphics]::FromImage($sheet)
$sg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$sg.Clear([System.Drawing.Color]::FromArgb(255, 12, 16, 24))
$font = New-Object System.Drawing.Font "Arial", 18, ([System.Drawing.FontStyle]::Bold)
$smallFont = New-Object System.Drawing.Font "Arial", 12, ([System.Drawing.FontStyle]::Regular)
$white = Brush 255 238 244 255
$muted = Brush 255 150 168 194
$sg.DrawString("Rollvive Runtime Art Direction - Bound Heroes and Monsters", $font, $white, 30, 24)
$items = @(
    @("characters\blade_adept.png", "Blade Adept"),
    @("characters\rift_spearman.png", "Rift Spearman"),
    @("characters\hex_gambler.png", "Hex Gambler"),
    @("characters\storm_mage.png", "Storm Mage"),
    @("enemies\void_chaser.png", "Void Chaser"),
    @("enemies\core_tank.png", "Core Tank"),
    @("enemies\rift_dasher.png", "Rift Dasher"),
    @("enemies\star_spitter.png", "Star Spitter"),
    @("enemies\hex_swarm.png", "Hex Swarm"),
    @("enemies\gravity_binder.png", "Gravity Binder"),
    @("enemies\core_brute_boss.png", "Core Brute Boss")
)
for ($i = 0; $i -lt $items.Count; $i += 1) {
    $col = $i % 4
    $row = [math]::Floor($i / 4)
    $x = 44 + $col * 240
    $y = 82 + $row * 210
    $imgPath = Join-Path (Join-Path $root "assets\textures") $items[$i][0]
    $img = [System.Drawing.Image]::FromFile($imgPath)
    $sg.FillRectangle((Brush 255 20 26 38), $x, $y, 184, 184)
    $sg.DrawImage($img, $x + 16, $y + 8, 152, 152)
    $sg.DrawString($items[$i][1], $smallFont, $white, $x + 10, $y + 164)
    $img.Dispose()
}
$sg.DrawString("PNG assets are transparent, generated for Cocos Sprite import. Replace with AI/artist finals when available.", $smallFont, $muted, 30, 720)
$sg.Dispose()
$sheet.Save((Join-Path (Join-Path $root "assets\textures") "runtime_art_contact_sheet.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$sheet.Dispose()

Write-Host "Generated runtime art assets under assets/textures."
