# Create clean shop data with only existing images
Write-Host "Creating clean shop data..."

$fullData = Get-Content "data-full.json" | ConvertFrom-Json
$cleanData = @()

foreach ($item in $fullData) {
    $imagePath = $item.image -replace "^/images/", "images/"
    if (Test-Path $imagePath) {
        $item.type = "print"
        $cleanData += $item
    }
}

Write-Host "Clean items found: $($cleanData.Count)"
$cleanData | ConvertTo-Json -Depth 10 | Set-Content "data.json"
Write-Host "Clean data.json created with $($cleanData.Count) items"

# Verify
$verifyData = Get-Content "data.json" | ConvertFrom-Json
Write-Host "Verification: data.json now has $($verifyData.Count) items"
