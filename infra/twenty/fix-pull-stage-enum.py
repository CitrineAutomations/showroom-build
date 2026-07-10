# STATUS (2026-07-08): This script already ran successfully -- the live pull.stage
# enum now contains the full intended set (APPOINTMENT_REQUESTED, APPOINTMENT_CONFIRMED,
# VISITED, OUT, DUE_SOON, OVERDUE, RETURN, RETURNED, LOAN, CLOSED). Its guard now
# correctly refuses to run again since the live state has moved past what it expects --
# this is intentional and safe, not a bug. Left in place for historical record; no
# further action needed. `RETURNED` (not `RETURN`) is the value actual code paths use.

import urllib.request
import json
import os

API_KEY = os.environ["Twenty_API_Key"]
BASE_URL = os.environ.get("Twenty_API_URL", "http://localhost:3000")
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    # Twenty's hosted API sits behind Cloudflare, which blocks requests with no
    # (or a non-browser) User-Agent header with an HTTP 403 / Cloudflare error 1010.
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
}

PULL_OBJECT_ID = "8636180c-e8cc-4722-a9b6-4f9b2e423db0"
STAGE_FIELD_ID = "3bc5ed01-88aa-49b6-b127-35a53124cb8a"

# Live enum found on 2026-07-04: OUT, RETURN, LOAN, VISITED (never matched the
# intended set in setup-objects.py). Existing options are kept as-is (including
# their ids, so nothing already stored on a Pull record breaks) and the missing
# ones from setup-objects.py are appended as new options.
EXISTING_OPTIONS = [
    {"id": "1cdbf203-21c0-49da-a9a2-d5b6dea1ca41", "color": "green", "label": "OUT",     "value": "OUT",     "position": 0},
    {"id": "da5b2a9a-9d1a-4b41-8397-0fab5836de82", "color": "jade",  "label": "RETURN",  "value": "RETURN",  "position": 1},
    {"id": "4350a7c7-eeef-4498-9972-0c4cefe97c21", "color": "mint",  "label": "LOAN",    "value": "LOAN",    "position": 2},
    {"id": "8742e033-5861-48de-b100-93470649faf7", "color": "blue",  "label": "Visited", "value": "VISITED", "position": 3},
]

NEW_OPTIONS = [
    {"label": "Appointment Requested", "value": "APPOINTMENT_REQUESTED", "color": "gray"},
    {"label": "Appointment Confirmed", "value": "APPOINTMENT_CONFIRMED", "color": "sky"},
    {"label": "Due Soon",              "value": "DUE_SOON",              "color": "orange"},
    {"label": "Overdue",               "value": "OVERDUE",               "color": "red"},
    {"label": "Returned",              "value": "RETURNED",              "color": "turquoise"},
    {"label": "Closed",                "value": "CLOSED",                "color": "gray"},
]


def gql(query, variables=None):
    payload = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(f"{BASE_URL}/metadata", data=payload, headers=HEADERS, method="POST")
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
    if "errors" in data:
        raise Exception(json.dumps(data["errors"], indent=2))
    return data["data"]


def log(msg):
    print(msg, flush=True)


# ── Re-fetch current state to guard against a stale hardcoded snapshot ──────
current = gql(
    """
    query GetField($id: UUID!) {
      object(id: $id) {
        fields(paging: { first: 50 }) {
          edges { node { id name options } }
        }
      }
    }
    """,
    {"id": PULL_OBJECT_ID},
)
stage_field = next(
    e["node"] for e in current["object"]["fields"]["edges"] if e["node"]["name"] == "stage"
)
if stage_field["id"] != STAGE_FIELD_ID:
    raise Exception(f"stage field id changed since this script was written: {stage_field['id']}")

live_values = {opt["value"] for opt in (stage_field["options"] or [])}
expected_existing_values = {opt["value"] for opt in EXISTING_OPTIONS}
if live_values != expected_existing_values:
    raise Exception(
        f"Live options {sorted(live_values)} no longer match this script's assumption "
        f"{sorted(expected_existing_values)} — re-run introspection before proceeding."
    )

new_to_add = [opt for opt in NEW_OPTIONS if opt["value"] not in live_values]
if not new_to_add:
    log("No missing options — enum is already up to date. Nothing to do.")
else:
    final_options = EXISTING_OPTIONS + [
        {**opt, "position": len(EXISTING_OPTIONS) + i} for i, opt in enumerate(new_to_add)
    ]
    log(f"Adding: {[o['value'] for o in new_to_add]}")

    result = gql(
        """
        mutation UpdateField($input: UpdateOneFieldMetadataInput!) {
          updateOneField(input: $input) {
            id
            name
            options
          }
        }
        """,
        {
            "input": {
                "id": STAGE_FIELD_ID,
                "update": {"options": final_options},
            }
        },
    )
    log(f"Updated pull.stage options: {json.dumps(result['updateOneField']['options'], indent=2)}")
