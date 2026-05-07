output "frontend_bucket_name" {
  value = aws_s3_bucket.frontend.bucket
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.app.id
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.app.domain_name
}

output "cloudfront_url" {
  value = "https://${aws_cloudfront_distribution.app.domain_name}"
}

output "leaderboard_table_name" {
  value = aws_dynamodb_table.leaderboard.name
}
