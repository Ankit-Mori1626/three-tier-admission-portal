variable "aws_region" {
  description = "AWS deployment region"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Name prefix for all resources"
  type        = string
  default     = "three-tier-app"
}

variable "environment" {
  description = "Environment identifier"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for the custom VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "threetierdb"
}

variable "db_username" {
  description = "Master username for PostgreSQL RDS"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Master password for PostgreSQL RDS (must be strong)"
  type        = string
  sensitive   = true
  default     = "SecureAwsVpcPass2026!"
}
