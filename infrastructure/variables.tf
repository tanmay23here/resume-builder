variable "aws_region" {
  description = "AWS region for EC2"
  default     = "ap-northeast-2"
}

variable "ami_id" {
  description = "Ubuntu 22.04 AMI ID for ap-northeast-2 (Seoul)"
  default     = "ami-042e76978adeb8c48"
}

variable "instance_type" {
  description = "EC2 instance type"
  default     = "t2.micro"
}

variable "key_pair_name" {
  description = "EC2 key pair name"
  default     = "resume-builder-key"
}

variable "s3_bucket_name" {
  description = "S3 bucket name for resume PDFs"
  default     = "resume-builder-pdfs-t23"
}