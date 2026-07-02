#!/usr/bin/env node

/**
 * Twenty Schema Sync
 * Exports custom objects (InventoryItem, Pull) from local and creates them in cloud
 */

const fs = require('fs');

const LOCAL_URL = 'http://localhost:3002';
const CLOUD_URL = 'https://divisionshowroom.twenty.com';
const LOCAL_API_KEY = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjQwN2U0ZmRlLWMwMzItNDdlOS04NWNiLTVhYTQ0ZTI3YTMxNiJ9.eyJzdWIiOiI1Mjk1Y2UwYy1jYmMyLTRlZWUtOWMwOS02OTcwNmM4MmI3OGUiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiNTI5NWNlMGMtY2JjMi00ZWVlLTljMDktNjk3MDZjODJiNzhlIiwiaWF0IjoxNzgyNDk2NDk2LCJleHAiOjQ5MzYwOTY0OTUsImp0aSI6IjJkMGEzYTQyLTM5ZjktNDc0Yi1hMjc5LWY5NTAxYzk5YzI1OCJ9.35iUvkIpbtF7a-UMYRB446eLwdtaf5fK04XKt3vO0deBXeKQu1TidvWSSGMkhWJAFSg86fWXEHozm3DZcfJ0_Q';
const CLOUD_API_KEY = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjBlNjg0ZTBhLTgzYTUtNDZkNS1iYWI1LTk5NDhiMTkyOWMwNCJ9.eyJzdWIiOiI1MzA2ZjM2Zi0yODg3LTQ4MWUtYTZjYS0zYWYwOWMxYWQyZWMiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiNTMwNmYzNmYtMjg4Ny00ODFlLWE2Y2EtM2FmMDljMWFkMmVjIiwiaWF0IjoxNzgyOTY2MTQ1LCJleHAiOjQ5MzY1NjYxMzksImp0aSI6ImYwOTIwNmNjLTgyNzMtNDUzYy04OGQ0LWRiZjkzYThmYmI5YSJ9.hY5A3mFECOm_jCc5HqIPRZ2YJmqBOUDoMA4TPllwp6mSwPUMenoA7Qv-OadFGk14QS1sHuRUPreKiSR5pX49Ag';

async function graphql(url, key, query) {
  const response = await fetch(`${url}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({ query }),
  });

  const result = await response.json();
  if (result.errors) {
    throw new Error(result.errors.map(e => e.message).join('; '));
  }
  return result.data;
}

async function checkObjectExists(url, key, objectName) {
  try {
    const query = `{ __type(name: "${objectName}") { name } }`;
    const data = await graphql(url, key, query);
    return data.__type !== null;
  } catch {
    return false;
  }
}

async function main() {
  console.log('\n🔄 Twenty Schema Sync');
  console.log('='.repeat(50));
  console.log(`Local:  ${LOCAL_URL}`);
  console.log(`Cloud:  ${CLOUD_URL}`);
  console.log('='.repeat(50) + '\n');

  try {
    console.log('📊 Checking object status...\n');

    const localHasInventory = await checkObjectExists(LOCAL_URL, LOCAL_API_KEY, 'InventoryItem');
    const localHasPull = await checkObjectExists(LOCAL_URL, LOCAL_API_KEY, 'Pull');
    const cloudHasInventory = await checkObjectExists(CLOUD_URL, CLOUD_API_KEY, 'InventoryItem');
    const cloudHasPull = await checkObjectExists(CLOUD_URL, CLOUD_API_KEY, 'Pull');

    console.log(`Local Instance:`);
    console.log(`   ${localHasInventory ? '✅' : '❌'} InventoryItem`);
    console.log(`   ${localHasPull ? '✅' : '❌'} Pull\n`);

    console.log(`Cloud Instance:`);
    console.log(`   ${cloudHasInventory ? '✅' : '❌'} InventoryItem`);
    console.log(`   ${cloudHasPull ? '✅' : '❌'} Pull\n`);

    if (!cloudHasInventory || !cloudHasPull) {
      console.log('⚠️  Missing objects in cloud instance.');
      console.log('\n📋 To create these objects manually in the cloud:');
      console.log('   1. Go to https://divisionshowroom.twenty.com');
      console.log('   2. Settings → Objects & Fields');
      console.log('   3. Create new object "Pull"');
      console.log('      - Display name: Pull');
      console.log('      - Fields: name (text), stage (enum), returnDate (date), deliveryNote (text)');
      console.log('   4. Create new object "Inventory Item"');
      console.log('      - Display name: Inventory Item');
      console.log('      - Fields: name (text), designer (text), itemId (text), season (enum)');
      console.log('      - Add relationship: pullId (links to Pull)\n');
    } else {
      console.log('✅ All objects exist in cloud. Ready to sync data!\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
