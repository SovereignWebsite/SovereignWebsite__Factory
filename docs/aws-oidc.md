# The AWS role for DNS (dns-apply)

Status: for Dinis to create, 19 November 2026. Written by conductor.b@SovereignWebsite.dinis on the pattern of AgentiCCells__Site__Factory's docs/aws-oidc.md.

The `DNS apply` workflow writes the records in `org/dns.json` to the three Route 53 zones. It assumes this role through GitHub's OpenID Connect, so no AWS key is stored anywhere. The role can only UPSERT records of four types in those three zones. It cannot delete a record, create or delete a zone, or touch the domains themselves.

## 1. The OIDC provider
Already in account 745506449035 (the AgentiCCells role uses it): `token.actions.githubusercontent.com`, audience `sts.amazonaws.com`. Nothing to do.

## 2. The role
Name: `sovereignwebsite-factory-dns`. Maximum session: 1 hour. Then set its ARN as `SW_AWS_ROLE_ARN` in this repository's `apply` environment.

**Trust policy** (only this repository's `apply` environment). Both subject forms are listed: the one with numeric IDs (organisation 358722364, repository 1464324035) is the form GitHub sent for AgentiCCells, and it stops a deleted and recreated repository of the same name from matching. The `DNS apply` workflow prints the subject it actually sends. Run 44559783507 (19 Nov 15:53 UTC) printed the form with numeric IDs, so the name-only line can be removed from the trust policy.

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::745506449035:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
      "ForAnyValue:StringEquals": {
        "token.actions.githubusercontent.com:sub": [
          "repo:SovereignWebsite@358722364/SovereignWebsite__Factory@1464324035:environment:apply",
          "repo:SovereignWebsite/SovereignWebsite__Factory:environment:apply"
        ]
      }
    }
  }]
}
```

**Permission policy** (the three zones from the `apply` environment: .ai `Z07740852319PPKCVLCZT`, .org `Z08378433BFL0H35BQSC0`, .site `Z084319825QMTD64L177F`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "UpsertOurRecords",
      "Effect": "Allow",
      "Action": "route53:ChangeResourceRecordSets",
      "Resource": [
        "arn:aws:route53:::hostedzone/Z07740852319PPKCVLCZT",
        "arn:aws:route53:::hostedzone/Z08378433BFL0H35BQSC0",
        "arn:aws:route53:::hostedzone/Z084319825QMTD64L177F"
      ],
      "Condition": {
        "ForAllValues:StringEquals": {
          "route53:ChangeResourceRecordSetsActions": ["UPSERT"],
          "route53:ChangeResourceRecordSetsRecordTypes": ["A", "AAAA", "CNAME", "TXT"]
        }
      }
    },
    {
      "Sid": "ReadOurZones",
      "Effect": "Allow",
      "Action": ["route53:ListResourceRecordSets", "route53:GetHostedZone"],
      "Resource": [
        "arn:aws:route53:::hostedzone/Z07740852319PPKCVLCZT",
        "arn:aws:route53:::hostedzone/Z08378433BFL0H35BQSC0",
        "arn:aws:route53:::hostedzone/Z084319825QMTD64L177F"
      ]
    },
    {
      "Sid": "ChangeStatus",
      "Effect": "Allow",
      "Action": "route53:GetChange",
      "Resource": "arn:aws:route53:::change/*"
    }
  ]
}
```

When hosted sites need teardown, a DELETE on `*.sovereignwebsite.site` CNAMEs will be proposed as its own change to this file and to `policy/abp.json`, for Dinis to approve.

## 3. Nameservers
Each zone has four Route 53 nameservers. The domain's registrar must list those four, or the records are written but never served. If the domains are registered in Route 53 Domains this is already true for zones created there; otherwise set them at the registrar.
