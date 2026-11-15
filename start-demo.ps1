Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "   E-INVOICE DEVSECOPS & KUBERNETES DEMO LAUNCHER    " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

Write-Host "`n[1/3] Kiem tra trang thai cac Pod tren Kubernetes..." -ForegroundColor Yellow
kubectl get pods -n default

Write-Host "`n[2/3] Khoi dong 4 cong ket noi (Port-Forward)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoProfile -Command kubectl port-forward svc/einvoice-bff-service -n default 3000:80" -WindowStyle Minimized
Start-Process powershell -ArgumentList "-NoProfile -Command kubectl port-forward svc/argocd-server -n argocd 8080:443" -WindowStyle Minimized
Start-Process powershell -ArgumentList "-NoProfile -Command kubectl port-forward svc/prometheus-service -n default 9090:9090" -WindowStyle Minimized
Start-Process powershell -ArgumentList "-NoProfile -Command kubectl port-forward svc/grafana-service -n default 3001:3000" -WindowStyle Minimized

Start-Sleep -Seconds 2

Write-Host "`n[3/3] He thong da san sang! Danh sach dia chi Demo:" -ForegroundColor Green
Write-Host "-----------------------------------------------------"
Write-Host "1. Backend Health Check : http://localhost:3000/api/health"
Write-Host "2. Argo CD GitOps UI    : https://localhost:8080          (User: admin)"
Write-Host "3. Prometheus Targets   : http://localhost:9090/targets"
Write-Host "4. Grafana Dashboard    : http://localhost:3001           (User: admin / Pass: admin123)"
Write-Host "-----------------------------------------------------"
