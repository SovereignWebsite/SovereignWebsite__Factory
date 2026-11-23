# The AWS role for DNS (dns-apply)

Status: for Dinis to create, 19 November 2026. Written by conductor.b@SovereignWebsite.dinis on the pattern of AgentiCCells__Site__Factory's docs/aws-oidc.md.

The `DNS apply` workflow writes the records in `org/dns.json` to the three Route 53 zones. It assumes this role through GitHub's OpenID Connect, so no AWS key is stored anywhere. The role can only UPSERT records of four types in those three zones. It cannot delete a record, create or delete a zone, or touch the domains themselves.

## 1. The OIDC provider
Already in account 745506449035 (the AgentiCCells role uses it): `token.actions.githubusercontent.com`, audience `sts.amazonaws.com`. Nothing to do.

## 2. The role
Name: `sovereignwebsite-factory-dns`. Maximum session: 1 hour. Then set its ARN as `SW_AWS_ROLE_ARN` in this repository's `apply` environment.

**Trust policy** (only this repository's `apply` environment). Both subject forms are listed: the one with numeric IDs (organisation 358722364, repository 1464324035) is the form GitHub sent for AgentiCCells, and it stops a deleted and recreated repository of the same name from matching. The `DNS apply` workflow prints the subject it actually sends. Run 44559783507 (19 Nov 15:53 UTC) printed the form with numeric IDs, so the name-only line can be removed from the trust policy. The repository becomes SovereignWebsite__IaC (Dinis, 22 Nov 2026; policy/proposals/2026-11-22__iac-rename-plan.md). The policy below is the live one as aws.c@SovereignWebsite.dinis read it back on 23 Nov 2026 ~00:25 UTC, after Dinis approved the change in aws.platform.sovereignweb.site (browser role sws-aws-platform-change, CloudFormation stack sws-aws-platform; not by hand): a plain StringEquals with the IaC subject added and the numeric-ID Factory subject kept (the name-only line was already gone). The Factory line is removed, the same way, once DNS apply has run once under the new name.

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::745506449035:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": [
          "repo:SovereignWebsite@358722364/SovereignWebsite__IaC@1464324035:environment:apply",
          "repo:SovereignWebsite@358722364/SovereignWebsite__Factory@1464324035:environment:apply"
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

## 4. Adding sovereignweb.site (20 November 2026)

Dinis, about 11:38 UTC in the sites.b session: "we are going to be using sovereignweb.site since that is a better domain (which I just wired up to AWS Hosted Zone)". For DNS apply to write its records:

1. **Nameservers:** at the registrar, set sovereignweb.site's nameservers to the four the new zone lists (ns-707.awsdns-24, ns-1855.awsdns-39, ns-326.awsdns-40, ns-1375.awsdns-43, as shown in Dinis's screenshot; check the zone). At 11:40 UTC public DNS still answered ns55 and ns56.worldnic.com.
2. **The role:** add `arn:aws:route53:::hostedzone/<the sovereignweb.site zone ID>` to the `Resource` list of both the `UpsertOurRecords` and `ReadOurZones` statements above. Nothing else changes: still UPSERT only, still A, AAAA, CNAME and TXT.
3. **The variable:** set `SW_ZONE_ID_WEB_SITE` to that zone ID in this repository's `apply` environment.

Until steps 2 and 3 are done, DNS apply plans the sovereignweb.site records and skips them ("SW_ZONE_ID_WEB_SITE not set"); the other zones are unaffected. Until step 1 propagates, the records are written but not served.
