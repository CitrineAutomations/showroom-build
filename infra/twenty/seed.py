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
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
    if "errors" in data:
        raise Exception(json.dumps(data["errors"], indent=2))
    return data["data"]


# ── 1. Fetch or create stylist contact ─────────────────────────────────────
FIND_PERSON = """
query {
  people(filter: { emails: { primaryEmail: { eq: "jordan.ellery@stylehaus.com" } } }) {
    edges { node { id name { firstName lastName } } }
  }
}
"""

CREATE_PERSON = """
mutation CreatePerson($input: PersonCreateInput!) {
  createPerson(data: $input) {
    id
    name { firstName lastName }
  }
}
"""

existing = gql("api", FIND_PERSON)["people"]["edges"]
if existing:
    person = existing[0]["node"]
    print(f"Found existing person: {person['name']['firstName']} {person['name']['lastName']} (id: {person['id']})")
else:
    person = gql("api", CREATE_PERSON, {
        "input": {
            "name": {"firstName": "Jordan", "lastName": "Ellery"},
            "emails": {"primaryEmail": "jordan.ellery@stylehaus.com"},
            "phones": {"primaryPhoneNumber": "+13105550192"},
            "jobTitle": "Celebrity Stylist",
        }
    })["createPerson"]
    print(f"Created person: {person['name']['firstName']} {person['name']['lastName']} (id: {person['id']})")


# ── 2. Fetch or create agency company ──────────────────────────────────────
FIND_COMPANY = """
query {
  companies(filter: { name: { eq: "StyleHaus Agency" } }) {
    edges { node { id name } }
  }
}
"""

CREATE_COMPANY = """
mutation CreateCompany($input: CompanyCreateInput!) {
  createCompany(data: $input) { id name }
}
"""

existing_co = gql("api", FIND_COMPANY)["companies"]["edges"]
if existing_co:
    company = existing_co[0]["node"]
    print(f"Found existing company: {company['name']} (id: {company['id']})")
else:
    company = gql("api", CREATE_COMPANY, {"input": {"name": "StyleHaus Agency"}})["createCompany"]
    print(f"Created company: {company['name']} (id: {company['id']})")


# ── 3. Link person to company ──────────────────────────────────────────────
LINK_COMPANY = """
mutation UpdatePerson($id: ID!, $companyId: ID!) {
  updatePerson(id: $id, data: { companyId: $companyId }) { id }
}
"""
gql("api", LINK_COMPANY, {"id": person["id"], "companyId": company["id"]})

print(f"Linked {person['name']['firstName']} to {company['name']}")


# ── 4. Create Pull record (Opportunity) ────────────────────────────────────
CREATE_PULL = """
mutation CreateOpportunity($input: OpportunityCreateInput!) {
  createOpportunity(data: $input) {
    id name stage closeDate
  }
}
"""

pull = gql("api", CREATE_PULL, {
    "input": {
        "name": "Pull — Jordan Ellery / Vogue Cover Shoot",
        "stage": "NEW",
        "closeDate": "2026-07-05",
        "pointOfContactId": person["id"],
        "companyId": company["id"],
    }
})["createOpportunity"]

print(f"Created pull record: {pull['name']} | stage: {pull['stage']} | return date: {pull['closeDate']} (id: {pull['id']})")
print()
print("── Seed complete ──────────────────────────────────────")
print(f"   Person ID  : {person['id']}")
print(f"   Company ID : {company['id']}")
print(f"   Pull ID    : {pull['id']}")
print()
print("Open http://localhost:3000 to see the data")
