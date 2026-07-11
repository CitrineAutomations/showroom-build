import urllib.request
import json
import os

API_KEY = os.environ["Twenty_API_Key"]
BASE_URL = os.environ.get("Twenty_API_URL", "http://localhost:3000")
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
}

# Person.client (ONE_TO_MANY -> pull) is the inverse side of Pull.clientId
# (MANY_TO_ONE -> person). It's misnamed: from Person's side this is a list
# of that person's pulls, not "their client". Rename to pulls/Pulls.
PERSON_OBJECT_ID = "b8ea21f3-d961-47a9-bfbd-b650b3e403a6"
CLIENT_FIELD_ID = "514d4305-0459-4340-9915-7841dfd0c80b"


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


current = gql(
    """
    query GetField($id: UUID!) {
      object(id: $id) {
        fields(paging: { first: 60 }) {
          edges { node { id name label } }
        }
      }
    }
    """,
    {"id": PERSON_OBJECT_ID},
)
field = next(e["node"] for e in current["object"]["fields"]["edges"] if e["node"]["id"] == CLIENT_FIELD_ID)

if field["name"] == "pulls":
    log("Already renamed to 'pulls' — nothing to do.")
else:
    if field["name"] != "client":
        raise Exception(f"Field name changed since this script was written: {field['name']!r} (expected 'client')")

    log(f"Renaming Person.{field['name']} ({field['label']!r}) -> pulls ('Pulls')")
    result = gql(
        """
        mutation UpdateField($input: UpdateOneFieldMetadataInput!) {
          updateOneField(input: $input) {
            id
            name
            label
          }
        }
        """,
        {
            "input": {
                "id": CLIENT_FIELD_ID,
                "update": {"name": "pulls", "label": "Pulls"},
            }
        },
    )
    log(f"Done: {json.dumps(result['updateOneField'], indent=2)}")
