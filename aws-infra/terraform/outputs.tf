output "vpc_id" {
  description = "The ID of the created VPC"
  value       = aws_vpc.main.id
}

output "public_subnets" {
  description = "Tier 1 Public subnets"
  value       = [aws_subnet.public_1a.id, aws_subnet.public_1b.id]
}

output "private_app_subnets" {
  description = "Tier 2 Private App subnets"
  value       = [aws_subnet.private_app_1a.id, aws_subnet.private_app_1b.id]
}

output "isolated_db_subnets" {
  description = "Tier 3 Isolated DB subnets (No Internet)"
  value       = [aws_subnet.isolated_db_1a.id, aws_subnet.isolated_db_1b.id]
}

output "rds_isolated_endpoint" {
  description = "PostgreSQL RDS connection endpoint (Accessible only within VPC from Tier 2 SG)"
  value       = aws_db_instance.postgres.endpoint
}

output "alb_security_group_id" {
  value = aws_security_group.alb_sg.id
}

output "app_security_group_id" {
  value = aws_security_group.app_sg.id
}

output "db_security_group_id" {
  value = aws_security_group.db_sg.id
}
