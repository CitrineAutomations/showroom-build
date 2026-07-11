import urllib.request, json, os

key = os.environ["Twenty_API_Key"]
headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}

def meta(query):
    payload = json.dumps({"query": query}).encode()
    req = urllib.request.Request("http://localhost:3000/metadata", data=payload, headers=headers, method="POST")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

# Get all object ids we need
d = meta("{ objects { edges { node { id nameSingular } } } }")
objects = {e["node"]["nameSingular"]: e["node"]["id"] for e in d["data"]["objects"]["edges"]}
print("Objects:", json.dumps(objects, indent=2))

# Try creating a RELATION field — test with person -> appointment
# Twenty docs show relationCreationPayload with direction ONE_TO_MANY
test_payload = {
    "input": {
        "field": {
            "objectMetadataId": objects["person"],
            "name": "testRelation",
            "label": "Test Relation",
            "type": "RELATION",
            "description": "test",
            "isActive": True,
            "isNullable": True,
            "isLabelSyncedWithName": False,
            "relationCreationPayload": {
                "targetObjectMetadataId": objects["appointment"],
                "type": "ONE_TO_MANY",
                "targetFieldLabel": "contact",
                "targetFieldName": "contact",
            }
        }
    }
}

CREATE_FIELD = """
mutation CreateField($input: CreateOneFieldMetadataInput!) {
  createOneField(input: $input) { id name type }
}
"""

q = json.dumps({"query": CREATE_FIELD, "variables": test_payload}).encode()
req = urllib.request.Request("http://localhost:3000/metadata", data=q, headers=headers, method="POST")
with urllib.request.urlopen(req) as r:
    result = json.loads(r.read())
print("\nRelation creation result:")
print(json.dumps(result, indent=2))
