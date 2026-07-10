#!/usr/bin/env node

/**
 * Twenty CRM Full Migration
 * Source workspace: Twenty_API_Key_showroom (has real data)
 * Target workspace: Twenty_API_Key_divisionpr (destination)
 * Both live on https://divisionshowroom.twenty.com as separate workspaces.
 *
 * Phase 1: create InventoryItem object + fields in target
 * Phase 2: add missing fields to Pull object in target
 * Phase 3: best-effort create the 2 relation fields (clientId, pullId)
 * Phase 4: copy real data (skips Twenty's demo seed records)
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
  const [k, ...v] = line.split('=');
  if (k && k.trim()) process.env[k.trim()] = v.join('=').trim();
});

const HOST = 'https://divisionshowroom.twenty.com';
const SOURCE_KEY = process.env.Twenty_API_Key_showroom;
const TARGET_KEY = process.env.Twenty_API_Key_divisionpr;

if (!SOURCE_KEY || !TARGET_KEY) {
  console.error('Missing Twenty_API_Key_showroom or Twenty_API_Key_divisionpr in .env');
  process.exit(1);
}

// Demo/seed companies that ship with every fresh Twenty workspace - never migrate these.
const SEED_COMPANY_NAMES = new Set(['Notion', 'Stripe', 'Figma', 'Airbnb', 'Anthropic']);

async function gql(endpoint, key, query, variables) {
  const res = await fetch(`${HOST}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }
  return json.data;
}

const dataQuery = (q, v) => gql('/graphql', SOURCE_KEY, q, v);
const targetDataQuery = (q, v) => gql('/graphql', TARGET_KEY, q, v);
const targetMeta = (q, v) => gql('/metadata', TARGET_KEY, q, v);

// ---------- Phase 1 & 2: schema ----------

async function getObjectId(nameSingular) {
  const data = await targetMeta(
    `{ objects(paging:{first:200}) { edges { node { id nameSingular } } } }`
  );
  const found = data.objects.edges.find((e) => e.node.nameSingular === nameSingular);
  return found ? found.node.id : null;
}

async function ensureInventoryItemObject() {
  let objectId = await getObjectId('inventoryItem');
  if (objectId) {
    console.log('   InventoryItem object already exists, skipping creation.');
    return objectId;
  }
  console.log('   Creating InventoryItem object...');
  const data = await targetMeta(
    `mutation CreateObj($input: CreateOneObjectInput!) {
      createOneObject(input: $input) { id nameSingular }
    }`,
    {
      input: {
        object: {
          nameSingular: 'inventoryItem',
          namePlural: 'inventoryItems',
          labelSingular: 'Inventory Item',
          labelPlural: 'Inventory Items',
          icon: 'IconHanger',
        },
      },
    }
  );
  console.log(`      created (${data.createOneObject.id})`);
  return data.createOneObject.id;
}

async function fieldExists(objectId, fieldName) {
  const data = await targetMeta(
    `query($objectId: UUID!) {
      objects(paging:{first:1}, filter:{id:{eq:$objectId}}) {
        edges { node { fields(paging:{first:100}) { edges { node { name } } } } }
      }
    }`,
    { objectId }
  );
  const fields = data.objects.edges[0]?.node.fields.edges.map((e) => e.node.name) || [];
  return fields.includes(fieldName);
}

async function createField(objectId, input) {
  const exists = await fieldExists(objectId, input.name);
  if (exists) {
    console.log(`      ${input.name} already exists, skipping.`);
    return;
  }
  try {
    await targetMeta(
      `mutation CreateField($input: CreateOneFieldMetadataInput!) {
        createOneField(input: $input) { id name }
      }`,
      { input: { field: { ...input, objectMetadataId: objectId } } }
    );
    console.log(`      created field: ${input.name}`);
  } catch (e) {
    console.warn(`      FAILED field ${input.name}: ${e.message}`);
  }
}

const INVENTORY_ITEM_FIELDS = [
  { type: 'TEXT', name: 'designer', label: 'Designer' },
  { type: 'TEXT', name: 'itemId', label: 'Item ID' },
  { type: 'TEXT', name: 'color', label: 'Color' },
  {
    type: 'SELECT',
    name: 'itemType',
    label: 'Item Type',
    options: [
      { label: 'Dress', value: 'DRESS', color: 'pink', position: 0 },
      { label: 'Mini Dress', value: 'MINI_DRESS', color: 'pink', position: 1 },
      { label: 'Maxi Dress', value: 'MAXI_DRESS', color: 'pink', position: 2 },
      { label: 'Top', value: 'TOP', color: 'purple', position: 3 },
      { label: 'Pants', value: 'PANTS', color: 'blue', position: 4 },
      { label: 'Jacket', value: 'JACKET', color: 'gray', position: 5 },
      { label: 'Coat', value: 'COAT', color: 'gray', position: 6 },
      { label: 'Skirt', value: 'SKIRT', color: 'orange', position: 7 },
      { label: 'Bag', value: 'BAG', color: 'yellow', position: 8 },
      { label: 'Shoes', value: 'SHOES', color: 'brown', position: 9 },
      { label: 'Accessory', value: 'ACCESSORY', color: 'green', position: 10 },
      { label: 'Cape', value: 'CAPE', color: 'red', position: 11 },
    ],
  },
  {
    type: 'SELECT',
    name: 'season',
    label: 'Season',
    options: [
      { label: 'SS 2023', value: 'SS_2023', color: 'green', position: 0 },
      { label: 'FW 2023', value: 'FW_2023', color: 'blue', position: 1 },
      { label: 'SS 2024', value: 'SS_2024', color: 'green', position: 2 },
      { label: 'FW 2024', value: 'FW_2024', color: 'blue', position: 3 },
      { label: 'Resort 2025', value: 'RESORT_2025', color: 'yellow', position: 4 },
      { label: 'SS 2025', value: 'SS_2025', color: 'green', position: 5 },
      { label: 'FW 2025', value: 'FW_2025', color: 'blue', position: 6 },
      { label: 'Resort 2026', value: 'RESORT_2026', color: 'yellow', position: 7 },
      { label: 'SS 2026', value: 'SS_2026', color: 'green', position: 8 },
    ],
  },
  {
    type: 'SELECT',
    name: 'status',
    label: 'Status',
    options: [
      { label: 'Available', value: 'AVAILABLE', color: 'green', position: 0 },
      { label: 'Out', value: 'OUT', color: 'orange', position: 1 },
      { label: 'Overdue', value: 'OVERDUE', color: 'red', position: 2 },
      { label: 'Damaged', value: 'DAMAGED', color: 'yellow', position: 3 },
      { label: 'Lost', value: 'LOST', color: 'gray', position: 4 },
    ],
  },
  { type: 'CURRENCY', name: 'retailPrice', label: 'Retail Price' },
  { type: 'CURRENCY', name: 'wholesalePrice', label: 'Wholesale Price' },
  { type: 'CURRENCY', name: 'loanFee', label: 'Loan Fee' },
];

const PULL_FIELDS = [
  {
    type: 'SELECT',
    name: 'stage',
    label: 'Stage',
    options: [
      { label: 'Appointment Requested', value: 'APPOINTMENT_REQUESTED', color: 'gray', position: 0 },
      { label: 'Appointment Confirmed', value: 'APPOINTMENT_CONFIRMED', color: 'blue', position: 1 },
      { label: 'Visited', value: 'VISITED', color: 'purple', position: 2 },
      { label: 'Out', value: 'OUT', color: 'orange', position: 3 },
      { label: 'Due Soon', value: 'DUE_SOON', color: 'yellow', position: 4 },
      { label: 'Overdue', value: 'OVERDUE', color: 'red', position: 5 },
      { label: 'Returned', value: 'RETURNED', color: 'green', position: 6 },
      { label: 'Closed', value: 'CLOSED', color: 'gray', position: 7 },
    ],
  },
  { type: 'TEXT', name: 'deliveryNote', label: 'Delivery Note' },
  { type: 'DATE', name: 'returnDate', label: 'Return Date' },
  { type: 'BOOLEAN', name: 'creditGiven', label: 'Credit Given' },
  { type: 'TEXT', name: 'coverageEvent', label: 'Coverage Event' },
  { type: 'TEXT', name: 'coveragePlatform', label: 'Coverage Platform' },
  { type: 'TEXT', name: 'calendarEventId', label: 'Calendar Event Id' },
  { type: 'BOOLEAN', name: 'contractSent', label: 'Contract Sent' },
  { type: 'BOOLEAN', name: 'contractSigned', label: 'Contract Signed' },
];

async function createRelationField({ objectId, targetObjectId, name, label, relationType }) {
  const exists = await fieldExists(objectId, name);
  if (exists) {
    console.log(`      ${name} already exists, skipping.`);
    return true;
  }
  try {
    await targetMeta(
      `mutation CreateField($input: CreateOneFieldMetadataInput!) {
        createOneField(input: $input) { id name }
      }`,
      {
        input: {
          field: {
            type: 'RELATION',
            name,
            label,
            objectMetadataId: objectId,
            relationCreationPayload: {
              targetObjectMetadataId: targetObjectId,
              type: relationType,
              targetFieldLabel: label,
              targetFieldIcon: 'IconRelationOneToMany',
            },
          },
        },
      }
    );
    console.log(`      created relation field: ${name}`);
    return true;
  } catch (e) {
    console.warn(`      FAILED relation field ${name}: ${e.message}`);
    console.warn(`      -> create this manually in Settings > Objects if needed.`);
    return false;
  }
}

// ---------- Phase 4: data ----------

async function migrateCompanies() {
  console.log('\n Migrating companies...');
  const data = await dataQuery(`{ companies(first:100){ edges { node { id name } } } }`);
  const companies = data.companies.edges
    .map((e) => e.node)
    .filter((c) => !SEED_COMPANY_NAMES.has(c.name));

  const idMap = {};
  for (const c of companies) {
    try {
      const res = await targetDataQuery(
        `mutation($input: CompanyCreateInput!) { createCompany(data: $input) { id } }`,
        { input: { name: c.name } }
      );
      idMap[c.id] = res.createCompany.id;
      console.log(`   + ${c.name}`);
    } catch (e) {
      console.warn(`   FAILED company ${c.name}: ${e.message}`);
    }
  }
  return idMap;
}

async function migratePeople(companyIdMap) {
  console.log('\n Migrating people...');
  const data = await dataQuery(
    `{ people(first:100){ edges { node { id name { firstName lastName } emails { primaryEmail } company { id } } } } }`
  );
  const people = data.people.edges
    .map((e) => e.node)
    .filter((p) => !companyIdMapSkip(p, companyIdMap));

  const idMap = {};
  for (const p of people) {
    try {
      const input = {
        name: { firstName: p.name.firstName || '', lastName: p.name.lastName || '' },
      };
      if (p.emails?.primaryEmail) {
        input.emails = { primaryEmail: p.emails.primaryEmail };
      }
      if (p.company?.id && companyIdMap[p.company.id]) {
        input.companyId = companyIdMap[p.company.id];
      }
      const res = await targetDataQuery(
        `mutation($input: PersonCreateInput!) { createPerson(data: $input) { id } }`,
        { input }
      );
      idMap[p.id] = res.createPerson.id;
      console.log(`   + ${p.name.firstName} ${p.name.lastName}`);
    } catch (e) {
      console.warn(`   FAILED person ${p.name.firstName} ${p.name.lastName}: ${e.message}`);
    }
  }
  return idMap;
}

function companyIdMapSkip(person, companyIdMap) {
  // Skip people who belong only to a seed company that we filtered out
  // (i.e. their source companyId isn't in our migrated map AND they had a company).
  if (person.company?.id && !companyIdMap[person.company.id]) return true;
  return false;
}

async function migratePulls(peopleIdMap) {
  console.log('\n Migrating pulls...');
  const data = await dataQuery(
    `{ pulls(first:100){ edges { node {
        id name stage deliveryNote returnDate creditGiven
        coverageEvent coveragePlatform calendarEventId contractSent contractSigned
        client { id }
      } } } }`
  );
  const pulls = data.pulls.edges.map((e) => e.node);
  const idMap = {};

  for (const pull of pulls) {
    try {
      const input = {
        name: pull.name || '',
        stage: pull.stage || undefined,
        deliveryNote: pull.deliveryNote || undefined,
        returnDate: pull.returnDate || undefined,
        creditGiven: pull.creditGiven ?? undefined,
        coverageEvent: pull.coverageEvent || undefined,
        coveragePlatform: pull.coveragePlatform || undefined,
        calendarEventId: pull.calendarEventId || undefined,
        contractSent: pull.contractSent ?? undefined,
        contractSigned: pull.contractSigned ?? undefined,
      };
      if (pull.client?.id && peopleIdMap[pull.client.id]) {
        input.clientId = peopleIdMap[pull.client.id];
      }
      const res = await targetDataQuery(
        `mutation($input: PullCreateInput!) { createPull(data: $input) { id } }`,
        { input }
      );
      idMap[pull.id] = res.createPull.id;
      console.log(`   + ${pull.name}`);
    } catch (e) {
      console.warn(`   FAILED pull ${pull.name}: ${e.message}`);
    }
  }
  return idMap;
}

async function migrateInventoryItems(pullIdMap) {
  console.log('\n Migrating inventory items...');
  const data = await dataQuery(
    `{ inventoryItems(first:200){ edges { node {
        id name designer itemId color itemType season status
        retailPrice wholesalePrice loanFee
        pull { id }
      } } } }`
  );
  const items = data.inventoryItems.edges.map((e) => e.node);

  let count = 0;
  for (const item of items) {
    try {
      const input = {
        name: item.name || item.itemId || 'Untitled Item',
        designer: item.designer || undefined,
        itemId: item.itemId || undefined,
        color: item.color || undefined,
        itemType: item.itemType || undefined,
        season: item.season || undefined,
        status: item.status || undefined,
      };
      if (item.retailPrice != null) input.retailPrice = { amountMicros: item.retailPrice * 1000000, currencyCode: 'USD' };
      if (item.wholesalePrice != null) input.wholesalePrice = { amountMicros: item.wholesalePrice * 1000000, currencyCode: 'USD' };
      if (item.loanFee != null) input.loanFee = { amountMicros: item.loanFee * 1000000, currencyCode: 'USD' };
      if (item.pull?.id && pullIdMap[item.pull.id]) {
        input.pullId = pullIdMap[item.pull.id];
      }
      await targetDataQuery(
        `mutation($input: InventoryItemCreateInput!) { createInventoryItem(data: $input) { id } }`,
        { input }
      );
      count++;
      console.log(`   + ${input.name} (${item.itemId || 'no id'})`);
    } catch (e) {
      console.warn(`   FAILED item ${item.itemId || item.id}: ${e.message}`);
    }
  }
  console.log(`   ${count}/${items.length} inventory items migrated`);
}

// ---------- Main ----------

async function main() {
  console.log('Twenty CRM Full Migration');
  console.log('Source: Twenty_API_Key_showroom');
  console.log('Target: Twenty_API_Key_divisionpr');
  console.log('='.repeat(50));

  console.log('\nPhase 1: InventoryItem object + fields');
  const inventoryItemObjectId = await ensureInventoryItemObject();
  for (const f of INVENTORY_ITEM_FIELDS) {
    await createField(inventoryItemObjectId, f);
  }

  console.log('\nPhase 2: Pull missing fields');
  const pullObjectId = await getObjectId('pull');
  for (const f of PULL_FIELDS) {
    await createField(pullObjectId, f);
  }

  console.log('\nPhase 3: Relation fields (best effort)');
  const personObjectId = await getObjectId('person');
  await createRelationField({
    objectId: pullObjectId,
    targetObjectId: personObjectId,
    name: 'clientId',
    label: 'Client',
    relationType: 'MANY_TO_ONE',
  });
  await createRelationField({
    objectId: inventoryItemObjectId,
    targetObjectId: pullObjectId,
    name: 'pullId',
    label: 'Pull',
    relationType: 'MANY_TO_ONE',
  });

  console.log('\nPhase 4: Data migration');
  const companyIdMap = await migrateCompanies();
  const peopleIdMap = await migratePeople(companyIdMap);
  const pullIdMap = await migratePulls(peopleIdMap);
  await migrateInventoryItems(pullIdMap);

  console.log('\nDone.');
}

main().catch((e) => {
  console.error('\nFatal error:', e.message);
  process.exit(1);
});
