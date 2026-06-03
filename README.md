# Triển khai CICD sử dụng Gitlab CI và K8S

[![Node.js Version](https://img.shields.io/badge/node-22.x-green)](https://nodejs.org/)
[![Express Version](https://img.shields.io/badge/express-4.18.x-blue)](https://expressjs.com/)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/kubernetes-ready-blue)](https://kubernetes.io/)
[![GitLab CI/CD](https://img.shields.io/badge/gitlab-ci%2Fcd-orange)](https://gitlab.com/)
[![Harbor Registry](https://img.shields.io/badge/harbor-private_registry-blue)](https://goharbor.io/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[Hướng dẫn triển khai](https://drive.google.com/drive/folders/1blvWhnquzZck-DLj4vtum05RYtsG1nhK)
---

# Giới thiệu

Dự án mô phỏng một hệ thống CI/CD hoàn chỉnh cho ứng dụng Node.js chạy trên Kubernetes.

Hệ thống sử dụng:

* GitLab làm Source Control & CI/CD
* Harbor làm Private Docker Registry
* Kubernetes làm nền tảng triển khai ứng dụng
* Nginx Load Balancer làm Reverse Proxy
* Trivy để quét lỗ hổng bảo mật
* Jest & Supertest để kiểm thử ứng dụng

---

# Mục tiêu dự án

* Xây dựng ứng dụng Node.js containerized bằng Docker
* Triển khai trên Kubernetes Cluster
* Tự động hóa CI/CD bằng GitLab Pipeline
* Lưu trữ Docker Image trên Harbor Registry
* Thực hiện Security Scan với Trivy
* Hỗ trợ Rollback Deployment
* Áp dụng Kubernetes Best Practices


---

# Quy hoạch Server

| Server          | Hostname            | IP Address   | RAM  | CPU    | Domain                 |
| --------------- | ------------------- | ------------ | ---- | ------ | ---------------------- |
| K8s Master      | k8s-master          | 192.168.1.40 | 2 GB | 2 Core | -                      |
| K8s Worker 01   | k8s-worker-1        | 192.168.1.41 | 2 GB | 2 Core | -                      |
| K8s Worker 02   | k8s-worker-2        | 192.168.1.42 | 2 GB | 2 Core | -                      |
| GitLab Server   | gitlab-server       | 192.168.1.43 | 6 GB | 4 Core | gitlab.hoangkien.com   |
| Harbor Registry | harbor-server       | 192.168.1.44 | 2 GB | 2 Core | registry.hoangkien.com |
| Load Balancer   | loadbalancer-server | 192.168.1.45 | 2 GB | 2 Core | -                      |

---

## Vai trò các Server

### Kubernetes Cluster
* 1 Master Node
* 2 Worker Nodes

Quản lý và chạy workload Node.js Application.

### GitLab Server
* Source Code Repository
* GitLab CI/CD
* GitLab Runner (Shell Executor)

### Harbor Registry

* Private Docker Registry
* Lưu trữ Docker Images

### Load Balancer

* Reverse Proxy bằng Nginx
* Điều hướng traffic vào Kubernetes Cluster

---

# Thành phần Kubernetes

| Thành phần         | Tên                      |
| ------------------ | ------------------------ |
| Namespace          | nodejs-app-namespace     |
| Deployment         | nodejs-app-deployment    |
| Service            | nodejs-app-service       |
| Ingress            | nodejs-app-ingress       |
| HPA                | nodejs-app-hpa           |
| ResourceQuota      | nodejs-app-quota         |
| Secret             | harbor-secret            |
| Ingress Controller | ingress-nginx-controller |

---

# Luồng hoạt động CI/CD

Developer push code lên GitLab (branch develop)  
=> GitLab Runner (shell executor) thực hiện pipeline với các stage: test (chạy unit test với Jest), scan (quét lỗ hổng bảo mật với Trivy), build (build Docker image và push lên Harbor Registry)  
=> Stage deploy (chỉ chạy trên branch develop) sử dụng kubectl để cập nhật image cho deployment trong Kubernetes và theo dõi rollout status.  
=> Nếu cần rollback, có thể kích hoạt manual job rollback trên cả hai branch develop và main để quay lại phiên bản trước đó.</br>[![chrome-ow6n-WWld-PQ.png](https://i.postimg.cc/Hkv2dNTg/chrome-ow6n-WWld-PQ.png)](https://postimg.cc/cvYYcXK9)

---


# Luồng hoạt động của ứng dụng

Người dùng truy cập ứng dụng qua domain nodejs.kienhoang.com.  
=> Request đến Nginx Load Balancer, proxy_pass đến NodePort 30470 của Ingress Controller trên k8s-master.  
=> Ingress Controller dựa vào hostname để routing đến Service nodejs-app-service (ClusterIP).  
=> Service này load balancing đến các Pod đang chạy ứng dụng Node.js trên worker nodes (cổng 3000).  
=> Ứng dụng xử lý request và trả về response JSON kèm theo message, timestamp và hostname của Pod.</br>[![chrome-e-Qu3Py-VQOp.png](https://i.postimg.cc/QtQ19YZF/chrome-e-Qu3Py-VQOp.png)](https://postimg.cc/0MNbhfQv)

---


# Kubernetes Features

## Horizontal Pod Autoscaler

* Min Replicas: 2
* Max Replicas: 10

Scale khi:

* CPU > 70%
* Memory > 200Mi

## Resource Requests

```yaml
requests:
  cpu: 500m
  memory: 700Mi
```

## Resource Limits

```yaml
limits:
  cpu: 1000m
  memory: 1.5Gi
```

## Health Checks

### Liveness Probe

```yaml
path: /health
periodSeconds: 10
```

### Readiness Probe

```yaml
path: /health
periodSeconds: 5
```

---

# Chạy Local

```bash
git clone https://github.com/HoangTrunggKien/nodeapp.git

cd nodeapp

npm install

npm start
```

Kiểm tra:

```bash
curl http://localhost:3000

curl http://localhost:3000/health
```

---

# Unit Testing

```bash
npm test
```

Coverage:

```bash
npm run test:coverage
```

---


# Kubernetes Deployment
Trên master node

Tạo namespace:

```bash
kubectl apply -f k8s/namespace.yml
```

Tạo Harbor Secret:

```bash
kubectl apply -f k8s/harbor-secret.yml
```

Deploy:

```bash
kubectl apply -f k8s/
```

Kiểm tra:

```bash
kubectl get all -n nodejs-app-namespace
```

---

# Monitoring

Logs:

```bash
kubectl logs -f <pod-name> -n nodejs-app-namespace
```

Metrics:

```bash
kubectl top pods -n nodejs-app-namespace
```

Events:

```bash
kubectl get events -n nodejs-app-namespace -w
```

---


# Ghi chú

* Branch `develop` tự động deploy
* Branch `main` chỉ build và test
* Rollback hỗ trợ cả develop và main
* Pipeline FAIL nếu Trivy phát hiện HIGH hoặc CRITICAL vulnerabilities

---

# License

MIT License

---

# Tác giả

**Hoàng Kiên**

Email: [hoangkien0318@gmail.com](mailto:hoangkien0318@gmail.com)