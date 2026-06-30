# n8n-nodes-rdsc

Community node for RD Station Conversas.

## Installation

Install this package from the n8n Community Nodes screen:

1. Open n8n.
2. Go to **Settings** > **Community Nodes**.
3. Select **Install**.
4. Enter `n8n-nodes-rdsc`.
5. Confirm the installation.

## Current operations

- Analytics: Get Attendance Retention, Get Attendance Reviews Average, Get Attendance Summary, Get Contacts Origin
- Contact: Create Many, Create WhatsApp Business Contact, Delete From Wallet, Delete Many, Get by CPF, Get by Phone, Get Many, Update by Phone, Update WhatsApp Business Contact
- Message: Forward to Contact, Get History, Send
- Report: Get Many

## Credentials

The node supports a token sent as `Authorization: Bearer <token>`.

The credential also includes a custom header option for accounts that require a different API token header.

## Usage example

Send a WhatsApp message to an existing RD Station Conversas contact:

1. Add an **RD Station Conversas** node.
2. Select **Contact** as the resource and **Get by Phone** as the operation.
3. Enter the contact phone number and set **Channel** to `WhatsApp`.
4. Execute the node and copy the returned contact/customer ID.
5. Add another **RD Station Conversas** node.
6. Select **Message** as the resource and **Send** as the operation.
7. Set **Contact ID** to the ID returned by the previous node. In an n8n expression, this can be mapped from the previous output.
8. Enter the message text and execute the node.

The message operation sends the request to RD Station Conversas using the configured API credential.

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
