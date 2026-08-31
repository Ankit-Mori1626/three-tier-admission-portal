# 🚀 Complete AWS VPC 3-Tier Architecture Deployment Guide
*(Hindi + English Step-by-Step Practical Manual)*

Yeh guide aapko AWS par ek real-world **3-Tier Architecture with Isolated Database** banakar deploy karne ka pura step-by-step process sikhayegi.

---

## 🏛️ Architecture Blueprint & CIDR Planning

Hum ek **VPC (10.0.0.0/16)** banayenge jisme **6 Subnets** honge across **2 Availability Zones** (`ap-south-1a` and `ap-south-1b` for Mumbai):

| Tier | Subnet Name | AZ | CIDR Block | Route Table Target | Purpose |
|---|---|---|---|---|---|
| **Tier 1 (Presentation)** | `Public-Subnet-1A` | ap-south-1a | `10.0.1.0/24` | **Internet Gateway (IGW)** | ALB / Bastion / Nginx |
| **Tier 1 (Presentation)** | `Public-Subnet-1B` | ap-south-1b | `10.0.2.0/24` | **Internet Gateway (IGW)** | ALB High Availability |
| **Tier 2 (Application)** | `Private-App-Subnet-1A` | ap-south-1a | `10.0.10.0/24` | **NAT Gateway** | Node.js Backend EC2 |
| **Tier 2 (Application)** | `Private-App-Subnet-1B` | ap-south-1b | `10.0.11.0/24` | **NAT Gateway** | EC2 Auto Scaling |
| **Tier 3 (Database)** | `Isolated-DB-Subnet-1A` | ap-south-1a | `10.0.20.0/24` | **Local Only (No IGW/NAT)** | AWS RDS PostgreSQL |
| **Tier 3 (Database)** | `Isolated-DB-Subnet-1B` | ap-south-1b | `10.0.21.0/24` | **Local Only (No IGW/NAT)** | RDS Standby Multi-AZ |

---

## 📝 Step-by-Step AWS Setup Instructions

### 🔹 STEP 1: Custom VPC Create Karna
1. AWS Console me **VPC** search karein -> Click **Create VPC**.
2. **Resources to create**: Select `VPC only`.
3. **Name tag**: `three-tier-vpc`
4. **IPv4 CIDR block**: `10.0.0.0/16`
5. Click **Create VPC**.
6. VPC select karke **Actions** -> **Edit VPC settings** -> Enable **DNS hostnames** and **DNS resolution** -> Save.

---

### 🔹 STEP 2: 6 Subnets Create Karna
VPC Dashboard -> **Subnets** -> Click **Create subnet**:

1. **Subnet 1 (Public 1A)**:
   - VPC: `three-tier-vpc`
   - Subnet name: `public-subnet-1a`
   - Availability Zone: `ap-south-1a`
   - CIDR: `10.0.1.0/24`
   - *Auto-assign public IP*: Enable kar dein.

2. **Subnet 2 (Public 1B)**:
   - Subnet name: `public-subnet-1b`
   - AZ: `ap-south-1b`
   - CIDR: `10.0.2.0/24`
   - *Auto-assign public IP*: Enable kar dein.

3. **Subnet 3 (Private App 1A)**:
   - Subnet name: `private-app-subnet-1a`
   - AZ: `ap-south-1a`
   - CIDR: `10.0.10.0/24`

4. **Subnet 4 (Private App 1B)**:
   - Subnet name: `private-app-subnet-1b`
   - AZ: `ap-south-1b`
   - CIDR: `10.0.11.0/24`

5. **Subnet 5 (Isolated DB 1A)**:
   - Subnet name: `isolated-db-subnet-1a`
   - AZ: `ap-south-1a`
   - CIDR: `10.0.20.0/24`

6. **Subnet 6 (Isolated DB 1B)**:
   - Subnet name: `isolated-db-subnet-1b`
   - AZ: `ap-south-1b`
   - CIDR: `10.0.21.0/24`

---

### 🔹 STEP 3: Internet Gateway & NAT Gateway Setup
1. **Internet Gateway (IGW)**:
   - Go to **Internet gateways** -> Click **Create internet gateway**.
   - Name: `three-tier-igw` -> Create.
   - Click **Actions** -> **Attach to VPC** -> Select `three-tier-vpc`.

2. **NAT Gateway** (Private App EC2 ko npm install/updates ke liye internet access dene ke liye):
   - Go to **NAT gateways** -> Click **Create NAT gateway**.
   - Name: `three-tier-nat-gw`
   - Subnet: `public-subnet-1a` *(Hamesha Public Subnet me banta hai)*
   - Elastic IP: Click **Allocate Elastic IP**.
   - Click **Create NAT gateway**.

---

### 🔹 STEP 4: Route Tables Configure Karna (Isolation Logic)
Hume **3 alag Route Tables** banani hain:

1. **`public-route-table`**:
   - Routes: `0.0.0.0/0` -> Target: `three-tier-igw`
   - Subnet Associations: `public-subnet-1a`, `public-subnet-1b`

2. **`private-app-route-table`**:
   - Routes: `0.0.0.0/0` -> Target: `three-tier-nat-gw`
   - Subnet Associations: `private-app-subnet-1a`, `private-app-subnet-1b`

3. **`isolated-db-route-table`** ⭐ *(Key Step for Database Isolation)*:
   - Routes: Sirf default local route rahega (`10.0.0.0/16` -> `local`).
   - 🛑 **DO NOT ADD `0.0.0.0/0`** (Koi Internet Gateway ya NAT Gateway route nahi jodna hai).
   - Subnet Associations: `isolated-db-subnet-1a`, `isolated-db-subnet-1b`

---

### 🔹 STEP 5: Security Groups Chaining (Least Privilege)
Chained Security Groups se data security guarantee hoti hai:

1. **`sg-alb-public`** (Tier 1):
   - Inbound Rules:
     - HTTP (80) from `0.0.0.0/0`
     - HTTPS (443) from `0.0.0.0/0`

2. **`sg-backend-app`** (Tier 2):
   - Inbound Rules:
     - Custom TCP (5000) from Source: `sg-alb-public` (ALB Security Group ID)
     - SSH (22) from your Bastion Host or Your IP only.

3. **`sg-rds-isolated`** (Tier 3):
   - Inbound Rules:
     - PostgreSQL (5432) from Source: `sg-backend-app` (Backend SG ID Only!)
     - 🛑 **Koi bhi public IP ya 0.0.0.0/0 allow nahi karna hai!**

---

### 🔹 STEP 6: AWS RDS Database Launch Karna (Tier 3)

1. **DB Subnet Group Banayein**:
   - AWS RDS Console -> **Subnet groups** -> **Create DB Subnet Group**.
   - Name: `three-tier-db-subnet-group`
   - VPC: `three-tier-vpc`
   - Add Subnets: Select AZ `ap-south-1a` and `ap-south-1b`, select `isolated-db-subnet-1a` (`10.0.20.0/24`) and `isolated-db-subnet-1b` (`10.0.21.0/24`).
   - Click **Create**.

2. **RDS Instance Launch Karein**:
   - Click **Create database** -> Choose **Standard create**.
   - Engine: **PostgreSQL** (version 15 or 16).
   - Template: **Free tier** (practice ke liye).
   - DB instance identifier: `threetier-postgres-db`
   - Master username: `postgres`
   - Master password: `YourSecurePassword123!`
   - Connectivity:
     - Virtual private cloud (VPC): `three-tier-vpc`
     - DB subnet group: `three-tier-db-subnet-group`
     - Public access: **NO** (Strictly Isolated)
     - Existing VPC security groups: Select `sg-rds-isolated` (remove default).
   - Initial database name (under Additional configuration): `threetierdb`
   - Click **Create database**.

*(Database ready hone ke baad uska **Endpoint URL** copy karein, e.g. `threetier-postgres-db.cxxxx.ap-south-1.rds.amazonaws.com`)*

---

### 🔹 STEP 7: Backend EC2 Instance Deploy Karna (Tier 2)

1. EC2 Console -> **Launch Instance**.
2. Name: `backend-app-server`
3. OS: Amazon Linux 2023 or Ubuntu 22.04 LTS.
4. Instance type: `t2.micro` / `t3.micro` (Free tier).
5. Network Settings (Click Edit):
   - VPC: `three-tier-vpc`
   - Subnet: `private-app-subnet-1a`
   - Auto-assign Public IP: **Disable**
   - Security Group: Select `sg-backend-app`.
6. User Data Script (Advance details me dalein):
   ```bash
   #!/bin/bash
   # Update and install Node.js & Git
   dnf update -y
   dnf install -y nodejs git

   # Clone or upload project code
   mkdir -p /opt/app
   cd /opt/app
   # Configure environment
   cat << 'EOF' > .env
   PORT=5000
   NODE_ENV=production
   DB_HOST=threetier-postgres-db.cxxxx.ap-south-1.rds.amazonaws.com
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=YourSecurePassword123!
   DB_NAME=threetierdb
   DB_SSL=false
   EOF

   # Copy backend code, install, start with PM2
   npm install -g pm2
   pm2 start src/server.js --name "three-tier-api"
   pm2 startup
   ```

---

### 🔹 STEP 8: Testing & Verification

1. **Verify DB Isolation**:
   - Apne local computer se terminal me run karein:
     ```bash
     psql -h <RDS_ENDPOINT> -U postgres -d threetierdb
     ```
   - 👉 **Result: Connection Time Out / Refused** hona chahiye (Kyunki DB isolated subnet me hai aur internet se accessible nahi hai).

2. **Verify Backend to DB Connection**:
   - Backend ke `/api/system/tier-status` endpoint par hit karein.
   - Response me `tier3_database.status` **Connected & Healthy** aana chahiye.

3. **Verify Full Application**:
   - Frontend Dashboard open karein aur naye records add/delete karke dekhein. Saara data Tier 2 ke zariye Tier 3 Isolated Database me persist hoga!
