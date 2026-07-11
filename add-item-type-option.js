#!/usr/bin/env node

/**
 * Adds new SELECT options to the InventoryItem.itemType field in Twenty
 * (divisionshowroom workspace) without touching existing options.
 *
 * Usage: node add-item-type-option.js "Cape" ["Jumpsuit" ...]
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
  const [k, ...v] = line.split('=');
  if (k && k.trim()) process.env[k.trim()] = v.join('=').trim();
});

const HOST = 'https://divisionshowroom.twenty.com';
const TARGET_KEY = process.env.Twenty_API_Key_divisionpr;

if (!TARGET_KEY) {
  console.error('Missing Twenty_API_Key_divisionpr in .env');
  process.exit(1);
}

const newLabels = process.argv.slice(2);
if (newLabels.length === 0) {
  console.error('Usage: node add-item-type-option.js "Cape" ["Jumpsuit" ...]');
  process.exit(1);
}

async function gql(query, variables) {
  const res = await fetch(`${HOST}/metadata`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TARGET_KEY}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }
  return json.data;
}

function toEnumValue(label) {
  return label
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const COLORS = ['pink', 'purple', 'blue', 'gray', 'orange', 'yellow', 'brown', 'green', 'red', 'turquoise', 'sky'];

async function main() {
  const data = await gql(
    `{ objects(paging:{first:200}) { edges { node { id nameSingular fields(paging:{first:100}) { edges { node { id name options } } } } } } }`
  );
  const inventoryItem = data.objects.edges.find((e) => e.node.nameSingular === 'inventoryItem');
  if (!inventoryItem) throw new Error('inventoryItem object not found');

  const itemTypeField = inventoryItem.node.fields.edges.find((e) => e.node.name === 'itemType');
  if (!itemTypeField) throw new Error('itemType field not found');

  const existingOptions = itemTypeField.node.options || [];
  const existingValues = new Set(existingOptions.map((o) => o.value));
  let nextPosition = existingOptions.length;

  const toAdd = [];
  for (const label of newLabels) {
    const value = toEnumValue(label);
    if (existingValues.has(value)) {
      console.log(`   ${value} already exists, skipping.`);
      continue;
    }
    toAdd.push({
      label,
      value,
      color: COLORS[nextPosition % COLORS.length],
      position: nextPosition,
    });
    nextPosition++;
  }

  if (toAdd.length === 0) {
    console.log('Nothing to add.');
    return;
  }

  const updatedOptions = [...existingOptions, ...toAdd];

  await gql(
    `mutation UpdateField($id: UUID!, $input: UpdateFieldInput!) {
      updateOneField(input: { id: $id, update: $input }) { id name options }
    }`,
    {
      id: itemTypeField.node.id,
      input: { options: updatedOptions },
    }
  );

  console.log(`Added: ${toAdd.map((o) => o.value).join(', ')}`);
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
