railway_api_domain = "vibecoding-colective-macpaw-production.up.railway.app"

# To attach a custom domain whose hosted zone stays in another Route53 account:
# 1. Keep enable_custom_domain_alias=false and apply Terraform.
# 2. Add the custom_domain_certificate_validation_records CNAME in the parent zone.
# 3. After the ACM certificate is issued, set enable_custom_domain_alias=true and apply again.
# 4. Add A/AAAA alias records in the parent zone to cloudfront_alias_target.
custom_domain_name         = "exit-macpaw-space.mykyyta.link"
enable_custom_domain_alias = true
