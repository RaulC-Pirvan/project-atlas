# Legal Publish Checklist

Use this checklist before moving legal policy pages from draft to production.

## Blocking fields (must be finalized)

- Legal entity name
- Registered address
- Court venue city
- VAT/company registration number

Any unresolved field above is a production publish blocker.

## Update procedure

1. Draft
2. Review
3. Legal sign-off
4. Publish

Do not publish legal changes without legal sign-off.

## Release-note template fields

- `approver`: legal approver name/role
- `date`: release date (`YYYY-MM-DD`)
- `policy version`: published policy version string

## Release checks

- Replace all `TBD` legal placeholders in `/legal/privacy`, `/legal/terms`, and `/legal/changes`.
- Confirm `Version`, `Effective date`, and `Last updated` are set for each legal page.
- Add a dated entry in `/legal/changes` summarizing the release.
- Ensure release-note fields (`approver`, `date`, `policy version`) are recorded.
- Confirm public access for `/legal/privacy`, `/legal/terms`, `/legal/refunds`, and `/legal/changes`.
