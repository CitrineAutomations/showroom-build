import urllib.request
import json
import os

API_KEY = os.environ.get("Twenty_API_Key")
BASE_URL = "http://localhost:3000"

def meta(query, variables=None):
    payload = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(
        f"{BASE_URL}/metadata",
        data=payload,
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read())
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

# ── Get all object IDs ──────────────────────────────────────────────────────
d = meta("{ objects { edges { node { id nameSingular } } } }")
obj = {e["node"]["nameSingular"]: e["node"]["id"] for e in d["objects"]["edges"]}
log(f"Found objects: {[k for k in obj if k in ['person','appointment','pull','inventoryItem']]}")

def create_relation(source_obj_id, field_name, field_label, field_icon,
                    target_obj_id, target_field_name, target_field_label, target_field_icon,
                    relation_type="ONE_TO_MANY"):
    try:
        result = meta(CREATE_FIELD, {
            "input": {
                "field": {
                    "objectMetadataId": source_obj_id,
                    "name": field_name,
                    "label": field_label,
                    "type": "RELATION",
                    "isActive": True,
                    "isNullable": True,
                    "isLabelSyncedWithName": False,
                    "relationCreationPayload": {
                        "targetObjectMetadataId": target_obj_id,
                        "type": relation_type,
                        "targetFieldName": target_field_name,
                        "targetFieldLabel": target_field_label,
                        "targetFieldIcon": target_field_icon,
                    }
                }
            }
        })
        log(f"  Created: {field_label} -> {target_field_label} [{relation_type}]")
        return result["createOneField"]["id"]
    except Exception as e:
        err_str = str(e)
        if "already exists" in err_str.lower() or "duplicate" in err_str.lower() or "CONFLICT" in err_str:
            log(f"  SKIP: {field_label} (already exists)")
        else:
            log(f"  FAILED: {field_label} -- {err_str[:300]}")

# ── 1. Person -> Appointments (one contact, many appointments) ──────────────
log("\n[1/3] Person -> Appointments")
create_relation(
    source_obj_id=obj["person"],
    field_name="appointments",
    field_label="Appointments",
    field_icon="IconCalendar",
    target_obj_id=obj["appointment"],
    target_field_name="contact",
    target_field_label="Contact",
    target_field_icon="IconUser",
    relation_type="ONE_TO_MANY",
)

# ── 2. Appointment -> Pulls (one appointment, one pull) ────────────────────
log("\n[2/3] Appointment -> Pulls")
create_relation(
    source_obj_id=obj["appointment"],
    field_name="pulls",
    field_label="Pulls",
    field_icon="IconPackageExport",
    target_obj_id=obj["pull"],
    target_field_name="appointment",
    target_field_label="Appointment",
    target_field_icon="IconCalendar",
    relation_type="ONE_TO_MANY",
)

# ── 3. Pull -> Inventory Items (one pull, many items) ──────────────────────
log("\n[3/3] Pull -> Inventory Items")
create_relation(
    source_obj_id=obj["pull"],
    field_name="inventoryItems",
    field_label="Inventory Items",
    field_icon="IconHanger",
    target_obj_id=obj["inventoryItem"],
    target_field_name="pull",
    target_field_label="Pull",
    target_field_icon="IconPackageExport",
    relation_type="ONE_TO_MANY",
)

# ── 4. Person -> Pulls (direct link — contact has many pulls) ──────────────
log("\n[4/4] Person -> Pulls (direct)")
create_relation(
    source_obj_id=obj["person"],
    field_name="pulls",
    field_label="Pulls",
    field_icon="IconPackageExport",
    target_obj_id=obj["pull"],
    target_field_name="client",
    target_field_label="Client",
    target_field_icon="IconUser",
    relation_type="ONE_TO_MANY",
)

log("\n== Relations complete ==")
log("Open http://localhost:3000/settings/data-model to verify")
