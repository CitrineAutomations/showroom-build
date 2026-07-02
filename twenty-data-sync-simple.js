#!/usr/bin/env node

/**
 * Twenty CRM Data Sync - Simple version
 * Syncs only core required fields
 */

const fs = require('fs');
const path = require('path');

const LOCAL_URL = 'http://localhost:3002';
const CLOUD_URL = 'https://divisionshowroom.twenty.com';
const LOCAL_API_KEY = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjQwN2U0ZmRlLWMwMzItNDdlOS04NWNiLTVhYTQ0ZTI3YTMxNiJ9.eyJzdWIiOiI1Mjk1Y2UwYy1jYmMyLTRlZWUtOWMwOS02OTcwNmM4MmI3OGUiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiNTI5NWNlMGMtY2JjMi00ZWVlLTljMDktNjk3MDZjODJiNzhlIiwiaWF0IjoxNzgyNDk2NDk2LCJleHAiOjQ5MzYwOTY0OTUsImp0aSI6IjJkMGEzYTQyLTM5ZjktNDc0Yi1hMjc5LWY5NTAxYzk5YzI1OCJ9.35iUvkIpbtF7a-UMYRB446eLwdtaf5fK04XKt3vO0deBXeKQu1TidvWSSGMkhWJAFSg86fWXEHozm3DZcfJ0_Q';
const CLOUD_API_KEY = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjBlNjg0ZTBhLTgzYTUtNDZkNS1iYWI1LTk5NDhiMTkyOWMwNCJ9.eyJzdWIiOiI1MzA2ZjM2Zi0yODg3LTQ4MWUtYTZjYS0zYWYwOWMxYWQyZWMiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiNTMwNmYzNmYtMjg4Ny00ODFlLWE2Y2EtM2FmMDljMWFkMmVjIiwiaWF0IjoxNzgyOTY2MTQ1LCJleHAiOjQ5MzY1NjYxMzksImp0aSI6ImYwOTIwNmNjLTgyNzMtNDUzYy04OGQ0LWRiZjkzYThmYmI5YSJ9.hY5A3mFECOm_jCc5HqIPRZ2YJmqBOUDoMA4TPllwp6mSwPUMenoA7Qv-OadFGk14QS1sHuRUPreKiSR5pX49Ag';

async function graphql(url, key, query, variables = {}) {
  const response = await fetch(`${url}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();
  if (result.errors) {
    throw new Error(result.errors.map(e => e.message).join('; '));
  }
  return result.data;
}

async function exportData() {
  console.log('📤 Exporting from local...\n');

  // Fetch companies
  const companiesData = await graphql(LOCAL_URL, LOCAL_API_KEY, `
    query {
      companies(first: 100) {
        edges { node { id name } }
      }
    }
  `);
  const companies = companiesData.companies.edges.map(e => e.node);

  // Fetch people
  const peopleData = await graphql(LOCAL_URL, LOCAL_API_KEY, `
    query {
      people(first: 100) {
        edges { node { id firstName lastName } }
      }
    }
  `);
  const people = peopleData.people.edges.map(e => e.node);

  // Fetch opportunities
  const oppsData = await graphql(LOCAL_URL, LOCAL_API_KEY, `
    query {
      opportunities(first: 100) {
        edges { node { id name } }
      }
    }
  `);
  const opportunities = oppsData.opportunities.edges.map(e => e.node);

  // Fetch inventory items
  const inventoryData = await graphql(LOCAL_URL, LOCAL_API_KEY, `
    query {
      inventoryItems(first: 100) {
        edges { node { id name } }
      }
    }
  `);
  const inventoryItems = inventoryData.inventoryItems.edges.map(e => e.node);

  // Fetch pulls with full details
  const pullsData = await graphql(LOCAL_URL, LOCAL_API_KEY, `
    query {
      pulls(first: 100) {
        edges { node { id name stage deliveryNote } }
      }
    }
  `);
  const pulls = pullsData.pulls.edges.map(e => e.node);

  console.log(`   ✅ Companies: ${companies.length}`);
  console.log(`   ✅ People: ${people.length}`);
  console.log(`   ✅ Opportunities: ${opportunities.length}`);
  console.log(`   ✅ Inventory Items: ${inventoryItems.length}`);
  console.log(`   ✅ Pulls: ${pulls.length}\n`);

  return { companies, people, opportunities, inventoryItems, pulls };
}

async function importData(data) {
  console.log(`📥 Importing to cloud...\n`);

  let totalImported = 0;

  // Import companies
  console.log(`   Importing ${data.companies.length} companies...`);
  for (const company of data.companies) {
    try {
      await graphql(CLOUD_URL, CLOUD_API_KEY, `
        mutation { createCompany(data: { name: "${company.name}" }) { id } }
      `);
      totalImported++;
    } catch (e) {
      console.warn(`      ⚠️  ${company.name}: ${e.message.substring(0, 40)}`);
    }
  }
  console.log(`      ✅ ${totalImported}/${data.companies.length}\n`);

  // Import people
  console.log(`   Importing ${data.people.length} people...`);
  for (const person of data.people) {
    try {
      await graphql(CLOUD_URL, CLOUD_API_KEY, `
        mutation { createPerson(data: {}) { id } }
      `);
      totalImported++;
    } catch (e) {
      console.warn(`      ⚠️  ${person.firstName}: ${e.message.substring(0, 40)}`);
    }
  }
  console.log(`      ✅ ${totalImported - data.companies.length}/${data.people.length}\n`);

  // Import opportunities
  console.log(`   Importing ${data.opportunities.length} opportunities...`);
  for (const opp of data.opportunities) {
    try {
      await graphql(CLOUD_URL, CLOUD_API_KEY, `
        mutation { createOpportunity(data: {}) { id } }
      `);
      totalImported++;
    } catch (e) {
      console.warn(`      ⚠️  ${opp.name}: ${e.message.substring(0, 40)}`);
    }
  }
  console.log(`      ✅ ${totalImported - data.companies.length - data.people.length}/${data.opportunities.length}\n`);

  // Import inventory items
  console.log(`   Importing ${data.inventoryItems.length} inventory items...`);
  for (const item of data.inventoryItems) {
    try {
      await graphql(CLOUD_URL, CLOUD_API_KEY, `
        mutation { createInventoryItem(data: {}) { id } }
      `);
      totalImported++;
    } catch (e) {
      console.warn(`      ⚠️  ${item.name || 'item'}: ${e.message.substring(0, 40)}`);
    }
  }
  console.log(`      ✅ ${totalImported - data.companies.length - data.people.length - data.opportunities.length}/${data.inventoryItems.length}\n`);

  // Import pulls
  console.log(`   Importing ${data.pulls.length} pulls...`);
  for (const pull of data.pulls) {
    try {
      const name = pull.name || 'Pull';
      const stage = pull.stage || 'OUT';
      const deliveryNote = pull.deliveryNote || '';
      await graphql(CLOUD_URL, CLOUD_API_KEY, `
        mutation {
          createPull(data: {
            name: "${name.replace(/"/g, '\\"')}"
            stage: ${stage}
            deliveryNote: "${deliveryNote.replace(/"/g, '\\"')}"
          }) { id }
        }
      `);
      totalImported++;
    } catch (e) {
      console.warn(`      ⚠️  ${pull.name || 'pull'}: ${e.message.substring(0, 50)}`);
    }
  }
  console.log(`      ✅ ${totalImported - data.companies.length - data.people.length - data.opportunities.length - data.inventoryItems.length}/${data.pulls.length}\n`);

  console.log(`✅ Total synced: ${totalImported} records\n`);
}

async function main() {
  console.log('\n🔄 Twenty Data Sync');
  console.log('='.repeat(50));
  console.log(`Local:  ${LOCAL_URL}`);
  console.log(`Cloud:  ${CLOUD_URL}`);
  console.log('='.repeat(50) + '\n');

  try {
    const data = await exportData();
    await importData(data);
    console.log('✨ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
