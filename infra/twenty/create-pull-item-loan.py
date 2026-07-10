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


CREATE_OBJECT = """
mutation CreateObject($input: CreateOneObjectInput!) {
  createOneObject(input: $input) { id nameSingular }
}
"""

CREATE_FIELD = """
mutation CreateField($input: CreateOneFieldMetadataInput!) {
  createOneField(input: $input) { id name type }
}
"""


def create_field(object_id, name, label, field_type, description, options=None, settings=None):
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
    if options:
        payload["input"]["field"]["options"] = options
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


def create_relation(source_obj_id, field_name, field_label, field_icon,
                     target_obj_id, target_field_name, target_field_label, target_field_icon,
                     relation_type="ONE_TO_MANY"):
    try:
        result = gql("metadata", CREATE_FIELD, {
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
            raise


# ── Fetch existing objects ──────────────────────────────────────────────────
existing_raw = gql("metadata", "{ objects(paging: { first: 200 }) { edges { node { id nameSingular } } } }")
existing = {e["node"]["nameSingular"]: e["node"]["id"] for e in existing_raw["objects"]["edges"]}
log(f"Existing objects: {list(existing.keys())}")

pull_id = existing["pull"]
inventory_item_id = existing["inventoryItem"]

# ════════════════════════════════════════════════════════════════════════════
# 1. CREATE PULL ITEM LOAN OBJECT
# ════════════════════════════════════════════════════════════════════════════
log("\n[1/3] Pull Item Loan object...")
if "pullItemLoan" in existing:
    loan_id = existing["pullItemLoan"]
    log(f"  SKIP object (already exists id: {loan_id})")
else:
    result = gql("metadata", CREATE_OBJECT, {
        "input": {
            "object": {
                "nameSingular": "pullItemLoan",
                "namePlural": "pullItemLoans",
                "labelSingular": "Pull Item Loan",
                "labelPlural": "Pull Item Loans",
                "description": "One record per occurrence of a specific InventoryItem being included in a specific Pull -- carries that occurrence's condition notes, photos, and return outcome.",
                "icon": "IconHistory",
                "isLabelSyncedWithName": False,
            }
        }
    })
    loan_id = result["createOneObject"]["id"]
    log(f"  Created: Pull Item Loan (id: {loan_id})")

# ════════════════════════════════════════════════════════════════════════════
# 2. RELATIONS: Pull Item Loan -> Pull, Pull Item Loan -> InventoryItem
#    (MANY_TO_ONE from Pull Item Loan's side == ONE_TO_MANY from Pull/Item's side)
# ════════════════════════════════════════════════════════════════════════════
log("\n[2/3] Relations...")
create_relation(
    source_obj_id=pull_id,
    field_name="pullItemLoans",
    field_label="Pull Item Loans",
    field_icon="IconHistory",
    target_obj_id=loan_id,
    target_field_name="pull",
    target_field_label="Pull",
    target_field_icon="IconPackageExport",
    relation_type="ONE_TO_MANY",
)
create_relation(
    source_obj_id=inventory_item_id,
    field_name="pullItemLoans",
    field_label="Pull Item Loans",
    field_icon="IconHistory",
    target_obj_id=loan_id,
    target_field_name="inventoryItem",
    target_field_label="Inventory Item",
    target_field_icon="IconHanger",
    relation_type="ONE_TO_MANY",
)

# ════════════════════════════════════════════════════════════════════════════
# 3. FIELDS: photos, conditionNotes, outcome
# ════════════════════════════════════════════════════════════════════════════
log("\n[3/3] Fields...")
create_field(loan_id, "photos", "Photos", "FILES",
             "Condition photos for this specific rental occurrence",
             settings={"maxNumberOfValues": 20})
create_field(loan_id, "conditionNotes", "Condition Notes", "TEXT",
             "Staff notes on this item's condition for this specific rental occurrence")
create_field(loan_id, "outcome", "Outcome", "SELECT",
             "Return outcome recorded for this occurrence",
             options=[
                 {"label": "Available", "value": "AVAILABLE", "color": "green", "position": 0},
                 {"label": "Damaged", "value": "DAMAGED", "color": "yellow", "position": 1},
                 {"label": "Lost", "value": "LOST", "color": "gray", "position": 2},
             ])

log("\n== Pull Item Loan setup complete ==")
log(f"  Pull Item Loan object id: {loan_id}")
log("Open the Twenty data-model settings to verify")
