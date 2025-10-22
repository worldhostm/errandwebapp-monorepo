# npm run dev를 실행하면서 메모리 사용량을 모니터링하는 PowerShell 스크립트

Write-Host "🚀 Development 서버 시작 및 메모리 모니터링..." -ForegroundColor Green
Write-Host ""

# npm run dev 프로세스 시작
$process = Start-Process -FilePath "cmd" -ArgumentList "/c npm run dev" -PassThru -NoNewWindow

$startTime = Get-Date
$maxMemory = 0
$measurements = @()

# 메모리 모니터링 (프로세스가 실행 중일 때)
while (-not $process.HasExited) {
  $processWithChildren = @($process.Id)

  # 자식 프로세스 찾기 (node 프로세스들)
  $childProcesses = Get-Process | Where-Object { $_.Parent -eq $process }
  foreach ($child in $childProcesses) {
    $processWithChildren += $child.Id
  }

  # 모든 프로세스의 메모리 합산
  $totalMemory = 0
  foreach ($pid in $processWithChildren) {
    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if ($proc) {
      $totalMemory += $proc.WorkingSet
    }
  }

  $memoryMB = [Math]::Round($totalMemory / 1MB, 2)
  if ($memoryMB -gt $maxMemory) {
    $maxMemory = $memoryMB
  }

  $elapsed = [Math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)
  $measurements += @{
    time = $elapsed
    memory = $memoryMB
  }

  Write-Host -NoNewline "`r⏱️  ${elapsed}s | 메모리 사용: ${memoryMB} MB | 최대: ${maxMemory} MB"

  Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host ""
Write-Host "📊 메모리 사용 통계:" -ForegroundColor Cyan
Write-Host "최대 메모리 사용량: $maxMemory MB" -ForegroundColor Yellow
Write-Host ""

# 평균, 최소, 최대 계산
if ($measurements.Count -gt 0) {
  $avgMemory = [Math]::Round(($measurements.memory | Measure-Object -Average).Average, 2)
  $minMemory = [Math]::Round(($measurements.memory | Measure-Object -Minimum).Minimum, 2)

  Write-Host "평균 메모리: $avgMemory MB"
  Write-Host "최소 메모리: $minMemory MB"
  Write-Host "최대 메모리: $maxMemory MB"
  Write-Host "측정 횟수: $($measurements.Count)"
}

exit $process.ExitCode
