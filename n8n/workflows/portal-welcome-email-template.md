# Portal Welcome Email Template

Sent to a client after `AUTO-11-portal-account.json` provisions their Clerk
account (i.e. after onboarding completes). Clerk is created with
`skip_password_requirement: true`, so there is no password to hand out here —
the client sets their own on first login.

## Trigger point

Fire this from the same flow that calls `AUTO-11-portal-account`, after the
`Success Response` node returns `clerkUserId`. Merge fields come from the
onboarding payload (`firstName`, `email`) plus your rep/account context.

## Merge fields

| Field | Source |
|---|---|
| `{{firstName}}` | onboarding payload |
| `{{portalUrl}}` | e.g. `https://portal.divisionshowroom.com/login` (prod URL not yet set — placeholder) |
| `{{email}}` | onboarding payload — used as their login |
| `{{repName}}` / `{{repEmail}}` | assigned sales rep |

---

**Subject:** Your Division Showroom portal is ready

```
Hi {{firstName}},

Your account for the Division Showroom client portal is set up. From here you can track pulls, view return windows, and see your order history in one place.

To get started:

1. Go to {{portalUrl}}
2. Enter your email: {{email}}
3. Choose "Forgot password? / Set password" on first login — you'll get a verification code by email to confirm it's you, then you can create your password.

Once you're in, you'll be able to:
- See everything currently checked out to you and when it's due back
- Review past pulls and returns
- Reach your rep directly if you have questions

If you run into any trouble signing in, just reply to this email or contact your rep directly.

{{repName}}
{{repEmail}}
Division Showroom
```
