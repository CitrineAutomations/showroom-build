import urllib.request, json, os

key = os.environ["Twenty_API_Key"]
headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}

def gql(query):
    payload = json.dumps({"query": query}).encode()
    req = urllib.request.Request("http://localhost:3000/graphql", data=payload, headers=headers, method="POST")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

# Get PersonCreateInput fields
d = gql('{ __type(name: "PersonCreateInput") { inputFields { name } } }')
print("PersonCreateInput fields:")
for f in sorted(d["data"]["__type"]["inputFields"], key=lambda x: x["name"]):
    print(f"  {f['name']}")

print()

# Get OpportunityCreateInput fields
d2 = gql('{ __type(name: "OpportunityCreateInput") { inputFields { name } } }')
print("OpportunityCreateInput fields:")
for f in sorted(d2["data"]["__type"]["inputFields"], key=lambda x: x["name"]):
    print(f"  {f['name']}")
