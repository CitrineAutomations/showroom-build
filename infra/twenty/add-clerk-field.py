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

CREATE_FIELD = """
mutation CreateField($input: CreateOneFieldMetadataInput!) {
  createOneField(input: $input) { id name type }
}
"""

existing_raw = gql("metadata", "{ objects { edges { node { id nameSingular } } } }")
existing = {e["node"]["nameSingular"]: e["node"]["id"] for e in existing_raw["objects"]["edges"]}
person_id = existing["person"]
log(f"person object id: {person_id}")

try:
    result = gql("metadata", CREATE_FIELD, {
        "input": {
            "field": {
                "objectMetadataId": person_id,
                "name": "clerkUserId",
                "label": "Clerk User ID",
                "type": "TEXT",
                "description": "Clerk user ID for this contact's client portal login, set by the onboarding automation",
                "isActive": True,
                "isNullable": True,
                "isLabelSyncedWithName": False,
            }
        }
    })
    log(f"Created: Clerk User ID [{result['createOneField']['type']}] (id: {result['createOneField']['id']})")
except Exception as e:
    err_str = str(e)
    if "already exists" in err_str.lower() or "duplicate" in err_str.lower():
        log("Clerk User ID field already exists, skipping")
    else:
        raise
