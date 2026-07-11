import urllib.request, json, os

key = os.environ["Twenty_API_Key"]
base_url = os.environ.get("Twenty_API_URL", "http://localhost:3000")
headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}


def meta(query):
    payload = json.dumps({"query": query}).encode()
    req = urllib.request.Request(f"{base_url}/metadata", data=payload, headers=headers, method="POST")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def print_input_fields(type_name):
    d = meta(f'{{ __type(name: "{type_name}") {{ inputFields {{ name type {{ name kind ofType {{ name kind ofType {{ name }} }} }} }} }} }}')
    t = d.get("data", {}).get("__type")
    print(f"{type_name}:")
    if not t:
        print("  (not found)")
        return
    for f in t["inputFields"]:
        print(f"  {f['name']}: {f['type']}")
    print()


print_input_fields("UpdateOneFieldMetadataInput")
print_input_fields("UpdateFieldInput")
