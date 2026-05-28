terraform {
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

# Security Group
resource "aws_security_group" "resume_builder_sg" {
  name        = "resume-builder-sg"
  description = "Security group for Resume Builder EC2"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "n8n"
    from_port   = 5678
    to_port     = 5678
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Gotenberg"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Frontend"
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Grafana"
    from_port   = 3002
    to_port     = 3002
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "resume-builder-sg"
    Project = "resume-builder"
  }
}

# EC2 Instance
resource "aws_instance" "resume_builder" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.resume_builder_sg.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = <<-EOF
    #!/bin/bash
    apt update -y
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker ubuntu
    apt install -y docker-compose-plugin
    # Add swap
    fallocate -l 1G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
  EOF

  tags = {
    Name    = "resume-builder"
    Project = "resume-builder"
    Env     = "production"
  }
}

# S3 Bucket
resource "aws_s3_bucket" "resume_pdfs" {
  bucket = var.s3_bucket_name

  tags = {
    Name    = "resume-builder-pdfs"
    Project = "resume-builder"
  }
}

# S3 Public Access
resource "aws_s3_bucket_public_access_block" "resume_pdfs" {
  bucket = aws_s3_bucket.resume_pdfs.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# S3 Bucket Policy
resource "aws_s3_bucket_policy" "resume_pdfs_policy" {
  bucket = aws_s3_bucket.resume_pdfs.id
  depends_on = [aws_s3_bucket_public_access_block.resume_pdfs]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.resume_pdfs.arn}/*"
      }
    ]
  })
}

# IAM User for n8n S3 access
resource "aws_iam_user" "n8n_s3_user" {
  name = "resume-builder-n8n"

  tags = {
    Project = "resume-builder"
  }
}

resource "aws_iam_user_policy" "n8n_s3_policy" {
  name = "resume-builder-s3-policy"
  user = aws_iam_user.n8n_s3_user.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.resume_pdfs.arn,
          "${aws_s3_bucket.resume_pdfs.arn}/*"
        ]
      }
    ]
  })
}