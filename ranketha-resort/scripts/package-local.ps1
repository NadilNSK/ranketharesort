Add-Type -AssemblyName System.IO.Compression -ErrorAction Stop
Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction Stop
$websiteRoot = (Resolve-Path -LiteralPath 'D:\My Projects\ranketharesort\ranketha-resort').Path
$websiteArchivePath = 'D:\My Projects\ranketharesort\Ranketha-Resort-Website-Enhanced.zip'
$websiteArchive = [System.IO.Compression.ZipFile]::Open($websiteArchivePath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  $websiteFiles = Get-ChildItem -LiteralPath $websiteRoot -Recurse -File -Force | Where-Object {
    $relativePhotoPath = $_.FullName.Substring($websiteRoot.Length + 1).Replace('\', '/')
    $relativePhotoPath -notmatch '^(node_modules|\.qa|\.git|\.openai)/' -and
    $relativePhotoPath -notmatch '^dist/assets/photos/' -and
    $relativePhotoPath -notmatch '\.(zip|tar\.gz)$'
  }
  foreach ($websiteFile in $websiteFiles) {
    $websiteEntryName = $websiteFile.FullName.Substring($websiteRoot.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($websiteArchive, $websiteFile.FullName, $websiteEntryName, [System.IO.Compression.CompressionLevel]::Fastest) | Out-Null
  }
} finally { $websiteArchive.Dispose() }
$websiteReviewArchive = [System.IO.Compression.ZipFile]::OpenRead($websiteArchivePath)
try {
  $siteEntryNames = @($websiteReviewArchive.Entries.FullName)
  if ($siteEntryNames -notcontains 'dist/index.html' -or $siteEntryNames -notcontains 'photos_restored/manifest.json') { throw 'Archive missing required source files.' }
  if (@($siteEntryNames | Where-Object { $_ -match '^dist/assets/photos-original/.+\.jpg$' }).Count -ne 28) { throw 'Archive missing original photos.' }
  if (@($siteEntryNames | Where-Object { $_ -match '^photos_restored/.+\.png$' }).Count -ne 28) { throw 'Archive missing restored masters.' }
  [pscustomobject]@{ Archive = $websiteArchivePath; Entries = $siteEntryNames.Count; Bytes = (Get-Item -LiteralPath $websiteArchivePath).Length; OriginalPhotos = 28; RestoredMasters = 28 }
} finally { $websiteReviewArchive.Dispose() }
