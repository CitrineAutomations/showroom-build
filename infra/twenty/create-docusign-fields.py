import urllib.request
import json
import os

API_KEY = os.environ.get("Twenty_API_Key")
BASE_URL = os.environ.get("Twenty_API_URL", "http://localhost:3000")


def gql(endpoint, query, variables=None):
    path = "metadata" if endpoint == "metadata" else "graphql"
    payload = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(
        f"{BASE_URL}/{path}",
        data=payload,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
    if "errors" in data:
        raise Exception(json.dumps(data["errors"], indent=2))
    return data["data"]


def log(msg):
    print(msg, flush=True)


CREATE_FIELD = """
mutation CreateField($input: CreateOneFieldMetadataInput!) {
  createOneField(input: $input) { id name type }
}
"""


def create_field(object_id, name, label, field_type, description, settings=None):
    payload = {
        "input": {
            "field": {
                "objectMetadataId": object_id,
                "name": name,
                "label": label,
                "type": field_type,
                "description": description,
                "isActive": True,
                "isNullable": True,
                "isLabelSyncedWithName": False,
            }
        }
    }
    if settings:
        payload["input"]["field"]["settings"] = settings
    try:
        result = gql("metadata", CREATE_FIELD, payload)
        log(f"    + {label} [{field_type}] (id: {result['createOneField']['id']})")
        return result["createOneField"]["id"]
    except Exception as e:
        err_str = str(e)
        if any(marker in err_str.lower() for marker in ("already exists", "duplicate", "not_available", "is not available")):
            log(f"    ~ {label} (already exists, skipping)")
        else:
            log(f"    ! {label} FAILED: {err_str[:300]}")
            raise


# ── Fetch existing objects ──────────────────────────────────────────────────
existing_raw = gql("metadata", "{ objects(paging: { first: 200 }) { edges { node { id nameSingular } } } }")
existing = {e["node"]["nameSingular"]: e["node"]["id"] for e in existing_raw["objects"]["edges"]}
log(f"Existing objects: {list(existing.keys())}")

for required in ("pull", "person"):
    if required not in existing:
        raise Exception(f"Required Twenty object '{required}' not found in this workspace. Existing objects: {list(existing.keys())}")

pull_id = existing["pull"]
person_id = existing["person"]

# ════════════════════════════════════════════════════════════════════════════
# Signed contract PDF storage for the DocuSign completion automation (AUTO-12)
# ════════════════════════════════════════════════════════════════════════════
log("\n[1/2] Pull.signedContract...")
create_field(pull_id, "signedContract", "Signed Contract", "FILES",
             "Signed DocuSign contract PDF for this specific pull, attached by AUTO-12 on envelope completion",
             settings={"maxNumberOfValues": 1})

log("\n[2/2] Person.contracts...")
create_field(person_id, "contracts", "Contracts", "FILES",
             "Running archive of every signed DocuSign contract for this contact, appended by AUTO-12 on envelope completion",
             settings={"maxNumberOfValues": 50})

log("\n== DocuSign field setup complete ==")
log("Open the Twenty data-model settings to verify")
