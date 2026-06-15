# n8n-nodes-rdsc

Community node to integrate n8n with **RD Station Conversas**.

This package adds two nodes to n8n:

- **RD Station Conversas**: read/write operations for Conversas resources (contacts, messages, employees, wallets, templates, campaigns, metadata).
- **RD Station Conversas Trigger**: starts workflows when RD Station Conversas sends webhook events to n8n.

## Implemented resources

| Resource | Operations |
| --- | --- |
| Messages | Send, Send Template, Get History |
| Contacts | Get Many, Get by Phone, Create, Update |
| Employees | Get Many, Get |
| Wallets | Get Many, Add Contact, Delete Contact |
| Templates | Get Many |
| Campaigns | Get Many, Get |
| Metadata (Config) | List Flows, List Workflows, List WhatsApp Integrations, Get Job |

### `RD Station Conversas Trigger` events

Configure the webhook URL from n8n in RD Station Conversas and select the matching event:

- `message_received`
- `contact_created`
- `contact_updated`
- `attendance_started`
- `attendance_finished`

## Authentication

Credential: **RD Station Conversas API** (JWT).

1. Access RD Station Conversas.
2. Go to **Apps e Integrações** > **API**.
3. Copy the JWT token generated for your account.

API base URLs:

- Production: `https://api.tallos.com.br`
- Legacy: `https://api.megasac.tallos.com.br`

Official API documentation:

- https://developers.rdstation.com/reference/conversas-v2-introduction

## Installation

In n8n (Community Nodes):

1. Go to **Settings** > **Community Nodes**.
2. Click **Install**.
3. Enter the package name: `n8n-nodes-rdsc`.
4. Complete installation and reload the editor if needed.

## Quick start

### 1) List contacts

- Node: `RD Station Conversas`
- Resource: `Contact`
- Operation: `Get Many`

### 2) Send a message

- Node: `RD Station Conversas`
- Resource: `Message`
- Operation: `Send`
- Required: `Contact ID`, `Message`, `Sent By`

### 3) Send a template message

- Node: `RD Station Conversas`
- Resource: `Message`
- Operation: `Send Template`
- Required: `Recipient Number`, `Template Message ID`

### 4) Trigger workflow on incoming webhook

- Node: `RD Station Conversas Trigger`
- Event: `Message Received`
- Copy the webhook URL from n8n and register it in RD Station Conversas
- Optional: configure `Authentication Header` + `Authentication Key`

## Pagination and validations

- List operations support `Return All`, `Limit`, and `Page` / `Page Size` where applicable.
- Contact phone numbers for WhatsApp should use E.164 format (e.g. `5511999998888`).
- Template messages use API v3 (`/v3/messages/template/send`) and do not create an attendance session.
- Message history requires Advanced plan and may require encryption on Professional accounts.

## Local development

```bash
npm install
npm run build
npm run dev
npm run lint
```

## Quality and publishing (Verified Community Node checklist)

Based on the community node publishing reference and n8n ecosystem guidelines, this package should maintain:

1. **Code transparency**
   - Public GitHub repository.
   - Clear, auditable node source code and README.
2. **Package identity**
   - Package name following the community node pattern (`n8n-nodes-*`).
   - Consistent metadata in `package.json` (keywords, license, nodes, credentials).
3. **Documentation**
   - README with credentials, operations, examples, and limitations.
4. **Quality**
   - Run local linting and review before publishing.
   - (Optional) community package scanner:

     ```bash
     npx @n8n/scan-community-package n8n-nodes-rdsc
     ```

5. **Submission**
   - Publish to npm and submit via the n8n Creator Portal with the correct links.

## License

MIT — see [LICENSE](./LICENSE) when available.
