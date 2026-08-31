# 🌟 3-Tier Architecture AWS VPC Project

A complete full-stack **3-Tier Web Application** designed specifically for practicing and mastering **AWS VPC Networking**, **Security Group Chaining**, and **Isolated Database Deployments**.

---

## 🏛️ Architecture Highlights

- **Tier 1 (Presentation)**: Modern responsive dashboard with live Tier status visualizer and CRUD control panel.
- **Tier 2 (Application / Logic)**: Node.js Express REST API with MVC pattern, health diagnostics, and dynamic DB connection manager.
- **Tier 3 (Data / Isolated Subnet)**: PostgreSQL / MySQL schema compatible with **AWS RDS** hosted in an isolated subnet with zero internet access.

---

## 🚀 Quick Start (Local Practice)

### Option 1: Standalone Local Mode (Zero setup required)
The app features an intelligent fallback store that allows immediate local testing without installing or running a database server:

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Start the backend (Port 5000)
npm start
```
Then open `http://localhost:5000` in your web browser!

---

### Option 2: Docker Compose (Simulates 3 Isolated VPC Networks)
```bash
docker-compose up --build
```
- Open `http://localhost:8080` to access Tier 1 Frontend.
- Docker creates 3 bridge networks: `public-tier1-net`, `app-tier2-net`, and `data-tier3-net` where the database has no direct public bridge.

---

## ☁️ AWS VPC Deployment

Read the complete guide in [`aws-infra/AWS_VPC_STEP_BY_STEP_GUIDE.md`](./aws-infra/AWS_VPC_STEP_BY_STEP_GUIDE.md) to deploy on AWS Console.

### Or 1-Click Terraform Deployment:
```bash
cd aws-infra/terraform
terraform init
terraform plan
terraform apply
```

---

## 📂 Project Structure
```
three-tier-aws-project/
├── backend/                  # Tier 2 Application (Node.js & Express)
│   ├── src/
│   │   ├── config/db.js      # DB connection pool & isolation fallback
│   │   ├── controllers/      # CRUD & system diagnostics
│   │   ├── routes/api.js     # REST API routes
│   │   └── server.js
│   ├── Dockerfile
│   └── package.json
├── frontend/                 # Tier 1 Presentation (Modern Web UI)
│   ├── css/styles.css        # Glassmorphic dark theme
│   ├── js/app.js             # Real-time tier topology monitor & CRUD
│   ├── index.html
│   ├── Dockerfile
│   └── nginx.conf
├── database/                 # Tier 3 Data Layer
│   ├── init.sql              # PostgreSQL RDS schema & seed records
│   └── mysql_init.sql
├── aws-infra/
│   ├── AWS_VPC_STEP_BY_STEP_GUIDE.md # Hindi + English guide
│   └── terraform/            # 1-click IaC infrastructure
├── docker-compose.yml
└── README.md
```
