import urllib.request
import json
import os

API_KEY = os.environ.get("Twenty_API_Key")
BASE_URL = "http://localhost:3000"

def gql(endpoint, query, variables=None):
    path = "metadata" if endpoint == "metadata" else "graphql"
    payload = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(
        f"{BASE_URL}/{path}",
        data=payload,
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
    if "errors" in data:
        raise Exception(json.dumps(data["errors"], indent=2))
    return data["data"]

def log(msg):
    print(msg, flush=True)

# ── Fetch existing objects ──────────────────────────────────────────────────
existing_raw = gql("metadata", "{ objects { edges { node { id nameSingular } } } }")
existing = {e["node"]["nameSingular"]: e["node"]["id"] for e in existing_raw["objects"]["edges"]}
log(f"Existing objects: {list(existing.keys())}")

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

def create_object(name_singular, name_plural, label_singular, label_plural, description, icon):
    if name_singular in existing:
        log(f"  SKIP '{name_singular}' (already exists id: {existing[name_singular]})")
        return existing[name_singular]
    result = gql("metadata", CREATE_OBJECT, {
        "input": {
            "object": {
                "nameSingular": name_singular,
                "namePlural": name_plural,
                "labelSingular": label_singular,
                "labelPlural": label_plural,
                "description": description,
                "icon": icon,
                "isLabelSyncedWithName": False,
            }
        }
    })
    obj_id = result["createOneObject"]["id"]
    log(f"  Created: {label_singular} (id: {obj_id})")
    return obj_id

def create_field(object_id, name, label, field_type, description, options=None):
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
    try:
        result = gql("metadata", CREATE_FIELD, payload)
        log(f"    + {label} [{field_type}]")
        return result["createOneField"]["id"]
    except Exception as e:
        err_str = str(e)
        if "already exists" in err_str.lower() or "duplicate" in err_str.lower():
            log(f"    ~ {label} (already exists, skipping)")
        else:
            log(f"    ! {label} FAILED: {err_str[:200]}")

# ════════════════════════════════════════════════════════════════════════════
# 1. INVENTORY ITEM
# ════════════════════════════════════════════════════════════════════════════
log("\n[1/3] Inventory Item...")
inv_id = create_object(
    name_singular="inventoryItem",
    name_plural="inventoryItems",
    label_singular="Inventory Item",
    label_plural="Inventory Items",
    description="A garment or accessory in the Division PR showroom",
    icon="IconHanger",
)

create_field(inv_id, "designer", "Designer", "TEXT", "Brand or designer name")
create_field(inv_id, "itemType", "Item Type", "SELECT", "Category of the item", options=[
    {"label": "Top",       "value": "TOP",       "color": "blue"},
    {"label": "Bottom",    "value": "BOTTOM",    "color": "purple"},
    {"label": "Dress",     "value": "DRESS",     "color": "pink"},
    {"label": "Outerwear", "value": "OUTERWEAR", "color": "green"},
    {"label": "Accessory", "value": "ACCESSORY", "color": "yellow"},
    {"label": "Shoes",     "value": "SHOES",     "color": "orange"},
    {"label": "Bag",       "value": "BAG",       "color": "red"},
])
create_field(inv_id, "color",  "Color",  "TEXT", "Color description")
create_field(inv_id, "season", "Season", "SELECT", "Collection season", options=[
    {"label": "SS25",   "value": "SS25",   "color": "blue"},
    {"label": "FW25",   "value": "FW25",   "color": "purple"},
    {"label": "SS26",   "value": "SS26",   "color": "green"},
    {"label": "FW26",   "value": "FW26",   "color": "orange"},
    {"label": "Resort", "value": "RESORT", "color": "yellow"},
])
create_field(inv_id, "itemId", "Item ID", "TEXT", "Internal SKU or item identifier")
create_field(inv_id, "status", "Status", "SELECT", "Current availability", options=[
    {"label": "Available", "value": "AVAILABLE", "color": "green"},
    {"label": "Out",       "value": "OUT",       "color": "red"},
    {"label": "Damaged",   "value": "DAMAGED",   "color": "orange"},
    {"label": "Missing",   "value": "MISSING",   "color": "gray"},
])

# ════════════════════════════════════════════════════════════════════════════
# 2. PULL
# ════════════════════════════════════════════════════════════════════════════
log("\n[2/3] Pull...")
pull_id = create_object(
    name_singular="pull",
    name_plural="pulls",
    label_singular="Pull",
    label_plural="Pulls",
    description="A garment pull request from a stylist client",
    icon="IconPackageExport",
)

create_field(pull_id, "stage", "Stage", "SELECT", "Current stage of the pull", options=[
    {"label": "Appointment Requested", "value": "APPOINTMENT_REQUESTED", "color": "gray"},
    {"label": "Appointment Confirmed", "value": "APPOINTMENT_CONFIRMED", "color": "blue"},
    {"label": "Visited",               "value": "VISITED",               "color": "purple"},
    {"label": "Out",                   "value": "OUT",                   "color": "yellow"},
    {"label": "Due Soon",              "value": "DUE_SOON",              "color": "orange"},
    {"label": "Overdue",               "value": "OVERDUE",               "color": "red"},
    {"label": "Returned",              "value": "RETURNED",              "color": "green"},
    {"label": "Closed",                "value": "CLOSED",                "color": "turquoise"},
])
create_field(pull_id, "returnDate",       "Return Date",       "DATE",    "Expected return date for all items")
create_field(pull_id, "calendarEventId",  "Calendar Event ID", "TEXT",    "Google Calendar event ID for return date")
create_field(pull_id, "coverageEvent",    "Coverage Event",    "TEXT",    "Event or shoot the pull is for")
create_field(pull_id, "coveragePlatform", "Coverage Platform", "TEXT",    "Publication or platform")
create_field(pull_id, "creditGiven",      "Credit Given",      "BOOLEAN", "Whether Division PR received credit")
create_field(pull_id, "notes",            "Notes",             "TEXT",    "Internal notes about the pull")

# ════════════════════════════════════════════════════════════════════════════
# 3. APPOINTMENT
# ════════════════════════════════════════════════════════════════════════════
log("\n[3/3] Appointment...")
appt_id = create_object(
    name_singular="appointment",
    name_plural="appointments",
    label_singular="Appointment",
    label_plural="Appointments",
    description="A showroom visit booked by a stylist client",
    icon="IconCalendar",
)

create_field(appt_id, "dateTime",        "Date & Time",       "DATE_TIME", "Scheduled date and time")
create_field(appt_id, "status",          "Status",            "SELECT",    "Appointment status", options=[
    {"label": "Requested",  "value": "REQUESTED",  "color": "gray"},
    {"label": "Confirmed",  "value": "CONFIRMED",  "color": "blue"},
    {"label": "Completed",  "value": "COMPLETED",  "color": "green"},
    {"label": "Cancelled",  "value": "CANCELLED",  "color": "red"},
])
create_field(appt_id, "lookingFor",      "Looking For",       "TEXT",      "What the client is shopping for")
create_field(appt_id, "calendarEventId", "Calendar Event ID", "TEXT",      "Google Calendar event ID")
create_field(appt_id, "notes",           "Notes",             "TEXT",      "Rep notes from the appointment")

log("\n== Setup complete ==")
log(f"  Inventory Item : {inv_id}")
log(f"  Pull           : {pull_id}")
log(f"  Appointment    : {appt_id}")
log("")
log("Open http://localhost:3000/settings/data-model to verify")
