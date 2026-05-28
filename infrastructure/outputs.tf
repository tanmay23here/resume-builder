output "ec2_public_ip" {
  description = "EC2 public IP address"
  value       = aws_instance.resume_builder.public_ip
}

output "ec2_public_dns" {
  description = "EC2 public DNS"
  value       = aws_instance.resume_builder.public_dns
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.resume_pdfs.bucket
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.resume_pdfs.arn
}

output "n8n_url" {
  description = "n8n URL"
  value       = "http://${aws_instance.resume_builder.public_ip}:5678"
}