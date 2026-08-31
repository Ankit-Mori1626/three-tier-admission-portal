terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ========================================================
# 1. VPC CREATION
# ========================================================
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-vpc"
    Environment = var.environment
  }
}

# ========================================================
# 2. INTERNET GATEWAY & EIP FOR NAT GATEWAY
# ========================================================
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags = { Name = "${var.project_name}-igw" }
}

resource "aws_eip" "nat" {
  domain     = "vpc"
  depends_on = [aws_internet_gateway.igw]
  tags       = { Name = "${var.project_name}-nat-eip" }
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_1a.id
  tags          = { Name = "${var.project_name}-nat-gw" }
}

# ========================================================
# 3. SUBNETS (6 Subnets across 2 Availability Zones)
# ========================================================

# Tier 1: Public Subnets (ALB / Frontend)
resource "aws_subnet" "public_1a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
  tags = { Name = "${var.project_name}-public-1a", Tier = "Tier 1 - Presentation" }
}

resource "aws_subnet" "public_1b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true
  tags = { Name = "${var.project_name}-public-1b", Tier = "Tier 1 - Presentation" }
}

# Tier 2: Private App Subnets (Backend API EC2/ECS)
resource "aws_subnet" "private_app_1a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "${var.aws_region}a"
  tags = { Name = "${var.project_name}-private-app-1a", Tier = "Tier 2 - Application" }
}

resource "aws_subnet" "private_app_1b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "${var.aws_region}b"
  tags = { Name = "${var.project_name}-private-app-1b", Tier = "Tier 2 - Application" }
}

# Tier 3: Isolated Database Subnets (RDS PostgreSQL - ZERO Internet)
resource "aws_subnet" "isolated_db_1a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.20.0/24"
  availability_zone = "${var.aws_region}a"
  tags = { Name = "${var.project_name}-isolated-db-1a", Tier = "Tier 3 - Isolated Data Layer" }
}

resource "aws_subnet" "isolated_db_1b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.21.0/24"
  availability_zone = "${var.aws_region}b"
  tags = { Name = "${var.project_name}-isolated-db-1b", Tier = "Tier 3 - Isolated Data Layer" }
}

# ========================================================
# 4. ROUTE TABLES & ASSOCIATIONS
# ========================================================

# Public Route Table -> Internet Gateway
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = { Name = "${var.project_name}-public-rt" }
}

resource "aws_route_table_association" "public_1a" {
  subnet_id      = aws_subnet.public_1a.id
  route_table_id = aws_route_table.public.id
}
resource "aws_route_table_association" "public_1b" {
  subnet_id      = aws_subnet.public_1b.id
  route_table_id = aws_route_table.public.id
}

# Private App Route Table -> NAT Gateway
resource "aws_route_table" "private_app" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }
  tags = { Name = "${var.project_name}-private-app-rt" }
}

resource "aws_route_table_association" "private_app_1a" {
  subnet_id      = aws_subnet.private_app_1a.id
  route_table_id = aws_route_table.private_app.id
}
resource "aws_route_table_association" "private_app_1b" {
  subnet_id      = aws_subnet.private_app_1b.id
  route_table_id = aws_route_table.private_app.id
}

# Isolated DB Route Table -> Local Only (NO 0.0.0.0/0 ROUTE!)
resource "aws_route_table" "isolated_db" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project_name}-isolated-db-rt" }
}

resource "aws_route_table_association" "isolated_db_1a" {
  subnet_id      = aws_subnet.isolated_db_1a.id
  route_table_id = aws_route_table.isolated_db.id
}
resource "aws_route_table_association" "isolated_db_1b" {
  subnet_id      = aws_subnet.isolated_db_1b.id
  route_table_id = aws_route_table.isolated_db.id
}

# ========================================================
# 5. SECURITY GROUPS (Chained Least Privilege)
# ========================================================

# Tier 1 SG: Public Load Balancer
resource "aws_security_group" "alb_sg" {
  name        = "${var.project_name}-alb-sg"
  description = "Tier 1: Allow HTTP/HTTPS traffic from internet"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-alb-sg" }
}

# Tier 2 SG: Private App Layer (Receives traffic ONLY from Tier 1 ALB)
resource "aws_security_group" "app_sg" {
  name        = "${var.project_name}-app-sg"
  description = "Tier 2: Allow inbound traffic only from Tier 1 ALB SG"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Node API from ALB"
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-app-sg" }
}

# Tier 3 SG: Isolated Database (Receives traffic ONLY from Tier 2 App)
resource "aws_security_group" "db_sg" {
  name        = "${var.project_name}-db-sg"
  description = "Tier 3: Strictly allow PostgreSQL only from Tier 2 App SG"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from App Tier only"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-db-sg" }
}

# ========================================================
# 6. AWS RDS POSTGRESQL (TIER 3 ISOLATED INSTANCE)
# ========================================================
resource "aws_db_subnet_group" "db_subnet_group" {
  name        = "${var.project_name}-db-subnet-group"
  subnet_ids  = [aws_subnet.isolated_db_1a.id, aws_subnet.isolated_db_1b.id]
  description = "Subnet group for isolated Tier 3 database layer"
  tags        = { Name = "${var.project_name}-db-subnet-group" }
}

resource "aws_db_instance" "postgres" {
  identifier             = "${var.project_name}-postgres"
  allocated_storage      = 20
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = "db.t3.micro"
  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.db_subnet_group.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  publicly_accessible    = false
  skip_final_snapshot    = true

  tags = {
    Name = "${var.project_name}-postgres-db"
    Tier = "Tier 3 - Data Layer"
  }
}
