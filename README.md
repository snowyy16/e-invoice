# 🧾 E-Invoice Enterprise — Hệ thống Hóa đơn Điện tử & Quy trình DevSecOps GitOps

[![DevSecOps CI/CD Pipeline](https://github.com/snowyy16/e-invoice/actions/workflows/devsecops.yml/badge.svg)](https://github.com/snowyy16/e-invoice/actions/workflows/devsecops.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=snowyy16_e-invoice&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=snowyy16_e-invoice)
![Kubernetes](https://img.shields.io/badge/Kubernetes-v1.30-326CE5?logo=kubernetes&logoColor=white)
![Argo CD](https://img.shields.io/badge/Argo%20CD-GitOps-EF7B4D?logo=argo&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-BFF-E0234E?logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=black)

Hệ thống quản lý, ký số và tra cứu **Hóa đơn Điện tử (E-Invoice)** được xây dựng trên kiến trúc **Nx Monorepo**, tích hợp chu trình **DevSecOps CI/CD khép kín** trên GitHub Actions, triển khai tự động theo mô hình **GitOps với Argo CD trên Kubernetes** và giám sát thời gian thực bằng **Prometheus & Grafana**.

---

## 🏗️ Sơ đồ Kiến trúc DevSecOps & GitOps Pipeline

```mermaid
%%{init: {"flowchart": {"curve": "linear", "nodeSpacing": 40, "rankSpacing": 50}} }%%
flowchart TB
    subgraph DEV["👨‍💻 1. Code & GitFlow"]
        direction LR
        A["Developer Push / PR<br/>(dev ➔ main)"] --> B["GitHub Branch Ruleset<br/>(4 Required Status Checks)"]
    end

    subgraph CI_SEC["🛡️ 2. CI & Continuous Security (Shift-Left)"]
        direction LR
        C["Job 1: CI Automation<br/>(ESLint, Prisma Migrate,<br/>Build & Health Check)"]
        D["Job 2: Security Scanning<br/>(Gitleaks, pnpm audit,<br/>Trivy FS & SonarQube Cloud)"]
    end

    subgraph ARTIFACT["📦 3. Artifact Management"]
        direction LR
        E["Job 3: Docker Multi-Stage Build<br/>Push GHCR (:latest & :sha)<br/>+ Trivy Image Scan"]
    end

    subgraph CD_GITOPS["🚀 4. Continuous Deployment & GitOps (Kubernetes)"]
        direction LR
        F["Job 4: Production Approval Gate<br/>Cập nhật k8s/deployment.yaml<br/>➔ nhánh gitops"]
        G["Argo CD Controller<br/>Tự động Sync từ nhánh gitops<br/>vào K8s Cluster"]
        H["Kubernetes Namespace: default<br/>• einvoice-bff (2 Pods HA)<br/>• einvoice-postgres (1 Pod + 1Gi PVC)<br/>• einvoice-secrets (Opaque Secret)"]
        F --> G --> H
    end

    subgraph OBS["📊 5. Observability & ChatOps"]
        direction LR
        I["Prometheus (/api/metrics)<br/>& Grafana Dashboard"]
        J["Job 5: Telegram Bot Notification<br/>(Báo cáo trạng thái Pipeline tức thì)"]
    end

    %% Luồng chính
    B --> C
    B --> D
    C --> E
    D --> E
    E --> F
    H --> I
    F --> J
```

## 📂 Cấu trúc Kho lưu trữ (Nx Monorepo)

```text
e-invoice/
├── .github/workflows/
│   └── devsecops.yml           # Pipeline DevSecOps 5 giai đoạn trên GitHub Actions
├── apps/
│   ├── bff/                    # Backend-for-Frontend (NestJS, Prisma, JWT, XML/Digital Signature, Prometheus Metrics)
│   └── web/                    # Giao diện người dùng & cổng tra cứu hóa đơn (React + Vite + TailwindCSS)
├── libs/
│   ├── database/               # Prisma Schema, Migrations & Database Client dùng chung
│   ├── shared/                 # DTOs, Interfaces & Hằng số dùng chung
│   └── utils/                  # Tiện ích xử lý nghiệp vụ & mã hóa
├── k8s/                        # Hạ tầng Kubernetes (GitOps Manifests)
│   ├── secret.yaml             # Kubernetes Secret lưu trữ biến môi trường nhạy cảm
│   ├── postgres.yaml           # PostgreSQL 16 Deployment, Service & PersistentVolumeClaim (1Gi)
│   ├── deployment.yaml         # BFF Deployment (2 Replicas, Liveness/Readiness Probes) & Service
│   └── monitoring.yaml         # Prometheus & Grafana Deployment, ConfigMap & Service
├── Dockerfile                  # Multi-stage Dockerfile tối ưu hóa dung lượng & chạy non-root user
└── .sonarcloud.properties      # Cấu hình phân tích mã nguồn tĩnh SonarQube Cloud
```

---

## 🛠️ Công nghệ Sử dụng (Tech Stack)

| Tầng (Layer)            | Công nghệ / Công cụ                                 | Vai trò trong hệ thống                                                                           |
| :---------------------- | :-------------------------------------------------- | :----------------------------------------------------------------------------------------------- |
| **Ứng dụng & CSDL**     | NestJS, React, TypeScript, Prisma, PostgreSQL 16    | Xử lý nghiệp vụ hóa đơn điện tử, ký số XML và lưu trữ dữ liệu                                    |
| **CI & Build**          | Nx Workspace, pnpm, GitHub Actions                  | Tự động hóa kiểm tra cú pháp, biên dịch và kiểm thử                                              |
| **Bảo mật (DevSecOps)** | Gitleaks, `pnpm audit`, SonarQube Cloud, Aqua Trivy | Quét Secret, lỗ hổng thư viện (SCA), mã nguồn tĩnh (SAST) và quét lỗ hổng Container Image        |
| **Đóng gói & Registry** | Docker Buildx, GitHub Container Registry (GHCR)     | Đóng gói Multi-stage Image (`ghcr.io/snowyy16/e-invoice/bff`)                                    |
| **Hạ tầng & GitOps**    | Kubernetes (`v1.30`), Argo CD                       | Điều phối Container có tính sẵn sàng cao (2 Replicas) và đồng bộ tự động từ nhánh `gitops`       |
| **Giám sát & Cảnh báo** | Prometheus, Grafana, Telegram Bot API               | Thu thập chỉ số thời gian thực (`/api/metrics`), trực quan hóa Dashboard và gửi cảnh báo ChatOps |

---

## 🚀 Hướng dẫn Vận hành & Truy cập trên Kubernetes

### 1. Kiểm tra trạng thái các Pod trên Kubernetes

```bash
kubectl get pods,svc,pvc,secret -n default
```

### 2. Mở kết nối (Port-Forward) tới các dịch vụ

| Dịch vụ               | Lệnh Port-Forward                                                  | Địa chỉ truy cập                   |
| :-------------------- | :----------------------------------------------------------------- | :--------------------------------- |
| **Backend BFF API**   | `kubectl port-forward svc/einvoice-bff-service -n default 3000:80` | `http://localhost:3000/api/health` |
| **Argo CD UI**        | `kubectl port-forward svc/argocd-server -n argocd 8080:443`        | `https://localhost:8080`           |
| **Prometheus UI**     | `kubectl port-forward svc/prometheus-service -n default 9090:9090` | `http://localhost:9090/targets`    |
| **Grafana Dashboard** | `kubectl port-forward svc/grafana-service -n default 3001:3000`    | `http://localhost:3001`            |
