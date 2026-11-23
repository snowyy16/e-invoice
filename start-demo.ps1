Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "   E-INVOICE DEVSECOPS & KUBERNETES DEMO LAUNCHER    " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

Write-Host "`n[1/4] Co lap du an E-Invoice (Tat cac du an khac tren cluster)..." -ForegroundColor Yellow

function Set-ArgoSyncPolicy([string]$AppName, [string]$PatchJson) {
  $tmp = [System.IO.Path]::GetTempFileName()
  try {
    [System.IO.File]::WriteAllText($tmp, $PatchJson, [System.Text.UTF8Encoding]::new($false))
    kubectl patch application $AppName -n argocd --type merge --patch-file $tmp | Out-Null
  } finally {
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  }
}

# 1. Tat Auto-Sync / Self-Heal moi Argo CD app khac einvoice-bff
$appsJson = kubectl get applications -n argocd -o json 2>$null
if ($LASTEXITCODE -eq 0 -and $appsJson) {
  $otherApps = ($appsJson | ConvertFrom-Json).items | Where-Object { $_.metadata.name -ne "einvoice-bff" }
  foreach ($app in $otherApps) {
    Write-Host " -> Tat Auto-Sync cho Argo CD app: $($app.metadata.name)" -ForegroundColor DarkYellow
    Set-ArgoSyncPolicy $app.metadata.name '{"spec":{"syncPolicy":{"automated":{"enabled":false,"selfHeal":false}}}}'
  }
}

# 2. Scale ve 0 cac Deployment khong thuoc E-Invoice trong namespace default
$keepDeploys = @("einvoice-bff", "einvoice-postgres", "prometheus", "grafana", "alertmanager")
$deploysJson = kubectl get deploy -n default -o json 2>$null
if ($LASTEXITCODE -eq 0 -and $deploysJson) {
  $otherDeploys = ($deploysJson | ConvertFrom-Json).items |
    Where-Object { $keepDeploys -notcontains $_.metadata.name -and $_.spec.replicas -gt 0 }
  foreach ($d in $otherDeploys) {
    Write-Host " -> Scale ve 0 Deployment: $($d.metadata.name)" -ForegroundColor DarkYellow
    kubectl scale deploy $d.metadata.name -n default --replicas=0 | Out-Null
  }
}

# 3. Dung cac Docker container roi khong thuoc Kubernetes hoac E-Invoice
$extraContainers = docker ps --format "{{.Names}}" 2>$null | Where-Object { $_ -and $_ -notmatch "^(k8s_|einvoice-)" }
foreach ($c in $extraContainers) {
  Write-Host " -> Dung container roi: $c" -ForegroundColor DarkYellow
  docker stop $c | Out-Null
}

# 4. Bat Auto-Sync & lam moi einvoice-bff tren Argo CD
Set-ArgoSyncPolicy "einvoice-bff" '{"spec":{"syncPolicy":{"automated":{"enabled":true,"prune":true,"selfHeal":true}}}}'
kubectl annotate application einvoice-bff -n argocd argocd.argoproj.io/refresh=hard --overwrite 2>$null | Out-Null

Write-Host "`n[2/4] Kiem tra trang thai cac Pod E-Invoice tren Kubernetes..." -ForegroundColor Yellow
kubectl get pods -n default

Write-Host "`n[3/4] Don dep tien trinh cu va khoi dong 5 cong ket noi (Tu dong ket noi lai)..." -ForegroundColor Yellow
Get-CimInstance Win32_Process -Filter "Name='powershell.exe' OR Name='pwsh.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.ProcessId -ne $PID -and $_.CommandLine -like "*kubectl port-forward*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Get-Process kubectl -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

Start-Process powershell -ArgumentList "-NoProfile -Command while (`$true) { kubectl port-forward svc/einvoice-bff-service -n default 3000:80 --address 0.0.0.0; Start-Sleep 1 }" -WindowStyle Minimized
Start-Process powershell -ArgumentList "-NoProfile -Command while (`$true) { kubectl port-forward svc/argocd-server -n argocd 8080:443 --address 0.0.0.0; Start-Sleep 1 }" -WindowStyle Minimized
Start-Process powershell -ArgumentList "-NoProfile -Command while (`$true) { kubectl port-forward svc/prometheus-service -n default 9090:9090 --address 0.0.0.0; Start-Sleep 1 }" -WindowStyle Minimized
Start-Process powershell -ArgumentList "-NoProfile -Command while (`$true) { kubectl port-forward svc/grafana-service -n default 3001:3000 --address 0.0.0.0; Start-Sleep 1 }" -WindowStyle Minimized
Start-Process powershell -ArgumentList "-NoProfile -Command while (`$true) { kubectl port-forward svc/alertmanager-service -n default 9093:9093 --address 0.0.0.0; Start-Sleep 1 }" -WindowStyle Minimized

Start-Sleep -Seconds 3

Write-Host "`n[4/4] He thong da san sang! Danh sach dia chi Demo:" -ForegroundColor Green
Write-Host "-----------------------------------------------------"
Write-Host "1. Backend Health Check : http://localhost:3000/api/health"
Write-Host "2. Argo CD GitOps UI    : https://localhost:8080          (User: admin)"
Write-Host "3. Prometheus Targets   : http://localhost:9090/targets"
Write-Host "4. Prometheus Alerts    : http://localhost:9090/alerts"
Write-Host "5. Grafana Dashboard    : http://localhost:3001           (User: admin / Pass: admin123)"
Write-Host "6. Alertmanager UI      : http://localhost:9093"
Write-Host "-----------------------------------------------------"
