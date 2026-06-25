# n8n-nodes-rdsc

Community node for RD Station Conversas.

## Current operations

- Analytics: Get Attendance Retention, Get Attendance Reviews Average, Get Attendance Summary, Get Contacts Origin
- Contact: Create Many, Create WhatsApp Business Contact, Delete From Wallet, Delete Many, Get by CPF, Get by Phone, Get Many, Update by Phone, Update WhatsApp Business Contact
- Message: Forward to Contact, Get History, Send
- Report: Get Many

## Credentials

The node supports a token sent as `Authorization: Bearer <token>`.

The credential also includes a custom header option for accounts that require a different API token header.

## API base URL

The default base URL is:

```text
https://api.tallos.com.br/v2
```

The field is editable because some RD Station Conversas accounts may still use a legacy API host.

## Safety

`Contact: Delete Many` is destructive and is available only for RD Station Conversas Advanced plan accounts. It deletes contacts matching the selected filter (`tag_name`, `integration`, or `$all`), and deletions are irreversible.

## Validation

Build and lint before publishing:

```bash
npm run build
npm run lint
npm pack --dry-run
```

## Publishing

Use the GitHub Actions workflow in `.github/workflows/publish.yml` for npm publication with provenance.

From a clean main branch, run:

```bash
npm run release
```

This bumps the version, creates the tag, and pushes it. The `Publish` workflow runs on version tags matching `*.*.*` and publishes the package to npm.
