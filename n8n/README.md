# Division PR — n8n Automations

Automation layer connecting **Twenty CRM**, **Google Calendar**, **Gmail**, **Google Drive**, and the **client portal** (Clerk).

Source spec: [`index.html`](../index.html) section 06 (Automations) and object model section 03.

## Workflow inventory

| ID | File | Trigger | Actions |
|---|---|---|---|
| AUTO-01 | `workflows/AUTO-01-appointment-confirmed.json` | Twenty webhook: appointment status → Confirmed | Confirmation email, Google Calendar event, schedule day-before reminder |
| AUTO-02 | `workflows/AUTO-02-rep-morning-brief.json` | Cron 7:00 AM PT daily | Email rep: client name, pull history, preferences |
| AUTO-03 | `workflows/AUTO-03-pull-out.json` | Twenty webhook: pull stage → Out | Calendar return event, store event ID, set inventory → Out |
| AUTO-04 | `workflows/AUTO-04-return-date-updated.json` | Twenty webhook: pull returnDate changed | Patch existing Google Calendar event |
| AUTO-05 | `workflows/AUTO-05-due-soon-daily.json` | Cron 8:00 AM PT daily | Stage → Due Soon, client reminder, notify rep |
| AUTO-06 | `workflows/AUTO-06-overdue-daily.json` | Cron 8:30 AM PT daily | Stage → Overdue, escalation to rep + owner |
| AUTO-07 | `workflows/AUTO-07-pull-returned.json` | Twenty webhook: pull stage → Returned | Inventory → Available, delete Calendar event |
| AUTO-08 | `workflows/AUTO-08-reliability-score.json` | Twenty webhook: pull stage → Closed | Recalculate contact reliability score (1–10) |
| AUTO-09 | `workflows/AUTO-09-drive-inventory-watcher.json` | Google Drive: file created/updated | Parse filename → Google Sheet row → Twenty inventory record |
| AUTO-11 | `workflows/AUTO-11-portal-account.json` | Webhook from onboarding app | Create Clerk user, link `twentyContactId` in metadata |
| AUTO-12 | `workflows/AUTO-12-docusign-contract-signed.json` | DocuSign Connect: envelope completed | Download signed PDF, match signer email to an open Pull, attach to `Pull.signedContract` + `Person.contracts`, set `contractSigned`. Ambiguous match → email owner |

## Prerequisites

1. **Twenty CRM** with custom objects deployed: Contact (Person), Appointment, Pull, Inventory Item
2. **n8n Cloud Starter** ($25/mo) or self-hosted n8n
3. **Google OAuth** credential in n8n (Calendar, Gmail, Drive, Sheets)
4. **Clerk** secret key (AUTO-11 only)

### Recommended n8n community node (optional)

Install `@linkedpromo/n8n-nodes-twenty` for native Twenty trigger + CRUD. Workflows in this repo use **HTTP Request + Webhook** so they work without community nodes.

Settings → Community Nodes → Install → `@linkedpromo/n8n-nodes-twenty`

## Setup

### 1. Environment variables

Copy [`.env.example`](./.env.example) values into n8n **Settings → Variables** (Cloud) or your instance `.env`.

| Variable | Used by |
|---|---|
| `TWENTY_API_URL` | All Twenty GraphQL calls |
| `TWENTY_API_KEY` | All Twenty GraphQL calls |
| `GOOGLE_CALENDAR_ID` | AUTO-01, 03, 04, 07 |
| `GOOGLE_DRIVE_INVENTORY_FOLDER_ID` | AUTO-09 |
| `GOOGLE_SHEETS_INVENTORY_ID` | AUTO-09 |
| `OWNER_EMAIL` | AUTO-06 escalation, AUTO-12 fallback notification |
| `CLERK_SECRET_KEY` | AUTO-11 |

> AUTO-12's DocuSign credentials (Client ID, User ID, Account ID, base URL, RSA private key, webhook secret, Twenty field metadata ID) are **not** set here — this n8n plan has no Settings → Variables access. They're hardcoded directly in the AUTO-12 workflow's "DocuSign Config" Set node and "Compute Expected Signature" code node instead. See that workflow's sticky note for the full list. Treat a filled-in export of that workflow as a secret.

### 2. Import workflows

1. n8n → **Workflows** → **Import from File**
2. Import each JSON from `workflows/` (start with AUTO-03, AUTO-05, AUTO-06)
3. Open each workflow → assign **Google OAuth** credentials where nodes show a warning
4. Activate workflows one at a time after testing

### 3. Register Twenty webhooks

After activating event-driven workflows, register webhook URLs in Twenty.

**Option A — Twenty UI:** Settings → Developers → Webhooks → Add webhook

**Option B — GraphQL:** use mutations in [`scripts/register-webhooks.graphql`](./scripts/register-webhooks.graphql)

Copy each workflow's **Production Webhook URL** from the Webhook trigger node.

| Workflow | Twenty operation filter |
|---|---|
| AUTO-01 | `appointment.updated` |
| AUTO-03 | `pull.updated` |
| AUTO-04 | `pull.updated` |
| AUTO-07 | `pull.updated` |
| AUTO-08 | `pull.updated` |

> Custom object webhook names depend on your Twenty workspace API names. Check **Settings → Data Model** for exact singular names (e.g. `pull` vs `pulls`).

### 4. Register DocuSign Connect webhook (AUTO-12)

DocuSign Connect webhooks are configured in DocuSign, not Twenty. In DocuSign Admin → Connect → Add Configuration:

- Event: **Envelope Completed**
- URL: AUTO-12's Production Webhook URL
- Enable HMAC signing with a secret — paste the same value into AUTO-12's "Compute Expected Signature" code node (`DOCUSIGN_WEBHOOK_SECRET` constant) and "DocuSign Config" Set node

Auth uses JWT Grant, not a static API key:

1. In DocuSign → Settings → Apps and Keys, create an Integration Key (Client ID), generate an RSA keypair, and register a redirect URI (any value works, e.g. `https://developers.docusign.com/platform/auth/consent`) — required before consent will work.
2. Grant one-time consent: visit `https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=<Client ID>&redirect_uri=<your redirect URI>` logged in as the account to impersonate, and click Allow. (Swap `account-d` for `account` in production.)
3. Find your User ID (My Account Information) and Account ID (same page or Apps and Keys).
4. Fill in AUTO-12's "DocuSign Config" Set node with the Client ID, User ID, Account ID, base URL (`https://demo.docusign.net` for sandbox, `https://na1.docusign.net`-style for production), and the RSA private key (PEM block, `BEGIN`/`END` lines included).

Run `infra/twenty/create-docusign-fields.py` first to create `Pull.signedContract` and `Person.contracts`, then look up `Pull.signedContract`'s field metadata ID via Twenty's `/metadata` API and paste it into "DocuSign Config"'s `twentyPullSignedContractFieldId` value.

### 5. Wire onboarding → AUTO-11

When the onboarding app finishes, POST to the AUTO-11 webhook:

```http
POST https://your-n8n.app.n8n.cloud/webhook/onboarding-complete
Content-Type: application/json
X-Webhook-Secret: {{ONBOARDING_WEBHOOK_SECRET}}

{
  "contactId": "uuid-from-twenty",
  "email": "stylist@agency.com",
  "firstName": "Jane",
  "lastName": "Stylist"
}
```

## Twenty field reference

Aligned with [`onboarding/lib/twenty.ts`](../onboarding/lib/twenty.ts) and [`portal/lib/queries.ts`](../portal/lib/queries.ts):

| Object | Key fields | Stage / status values |
|---|---|---|
| Pull | `stage`, `returnDate`, `calendarEventId`, `client`, `items` | `OUT`, `DUE_SOON`, `OVERDUE`, `RETURNED`, `CLOSED` |
| Appointment | `status`, `dateTime`, `calendarEventId`, `client`, `repAssigned` | `CONFIRMED`, `VISITED`, etc. |
| Inventory Item | `status`, `designer`, `itemType`, `color`, `season`, `itemId` | `AVAILABLE`, `OUT` |
| Contact | `reliabilityScore`, `emails`, `clientType` | — |

GraphQL queries: [`shared/twenty-queries.graphql`](./shared/twenty-queries.graphql)

## Testing checklist

- [ ] AUTO-03: Set a test pull to **Out** → Calendar event created, `calendarEventId` written, items → Out
- [ ] AUTO-04: Change return date → Calendar event updated (not duplicated)
- [ ] AUTO-05: Pull with return in 2 days → stage Due Soon, emails sent
- [ ] AUTO-06: Pull past return date → stage Overdue, escalation email
- [ ] AUTO-07: Set pull to Returned → items Available, Calendar event deleted
- [ ] AUTO-01: Confirm appointment → client email + Calendar + reminder scheduled
- [ ] AUTO-09: Upload `Designer_Type_Color_SS_2024_001.jpg` to Drive → Sheet row + CRM record
- [ ] AUTO-12: Complete a DocuSign envelope for a signer email matching exactly one open Pull → PDF attached to `Pull.signedContract` and `Person.contracts`, `contractSigned` set
- [ ] AUTO-12: Complete an envelope for an email matching zero/multiple open Pulls → no Twenty writes, `OWNER_EMAIL` notified
- [ ] AUTO-12: POST to the webhook with a missing/invalid signature → 401, no processing

## Execution budget

n8n Cloud Starter: **2,500 executions/mo**. Estimated usage for a 3-person showroom:

| Workflow | Runs/mo (est.) |
|---|---|
| AUTO-05 + AUTO-06 (daily) | ~60 |
| AUTO-02 (daily) | ~30 |
| Event-driven (pulls, appointments) | ~100–200 |
| AUTO-09 (Drive watcher) | ~50 |
| **Total** | **~250–350** |

Comfortably within Starter limits.

## Next steps

1. Confirm Twenty custom object API names match webhook filters
2. Import and test AUTO-03, AUTO-05, AUTO-06 (highest operational value)
3. Add onboarding webhook call for AUTO-11 when portal goes live
4. Build AUTO-09 once inventory photo naming convention is live in Drive
