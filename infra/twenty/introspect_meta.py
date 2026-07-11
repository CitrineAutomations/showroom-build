import urllib.request, json, os

key = os.environ["Twenty_API_Key"]
headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}

def meta(query):
    payload = json.dumps({"query": query}).encode()
    req = urllib.request.Request("http://localhost:3000/metadata", data=payload, headers=headers, method="POST")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

# Check actual CreateObjectInput shape
d = meta('{ __type(name: "CreateObjectInput") { inputFields { name type { name kind ofType { name } } } } }')
print("CreateObjectInput fields:")
for f in (d.get("data", {}).get("__type") or {}).get("inputFields", []):
    print(f"  {f['name']}: {f['type']}")

print()

# Check CreateOneFieldMetadataInput
d2 = meta('{ __type(name: "CreateOneFieldMetadataInput") { inputFields { name type { name kind ofType { name } } } } }')
print("CreateOneFieldMetadataInput fields:")
for f in (d2.get("data", {}).get("__type") or {}).get("inputFields", []):
    print(f"  {f['name']}: {f['type']}")

print()

# Check CreateFieldInput
d3 = meta('{ __type(name: "CreateFieldInput") { inputFields { name type { name kind ofType { name } } } } }')
print("CreateFieldInput fields:")
for f in (d3.get("data", {}).get("__type") or {}).get("inputFields", []):
    print(f"  {f['name']}: {f['type']}")
