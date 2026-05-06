variable "aws_region" {
  type        = string
  description = "Primary AWS region."
  default     = "eu-central-1"
}

variable "project_slug" {
  type        = string
  description = "Resource name prefix."
  default     = "vibecoding-colective-macpaw"
}

variable "railway_api_domain" {
  type        = string
  description = "Railway public domain for the Express API, without https://."
}
