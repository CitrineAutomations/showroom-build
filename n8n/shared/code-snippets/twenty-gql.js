/**
 * Paste into an n8n Code node (Run Once for All Items).
 * Requires n8n environment variables: TWENTY_API_URL, TWENTY_API_KEY
 *
 * Usage in downstream nodes: {{ $('Twenty GQL').item.json.data }}
 */
const TWENTY_API_URL = ($env.TWENTY_API_URL || '').replace(/\/$/, '');
const TWENTY_API_KEY = $env.TWENTY_API_KEY;

if (!TWENTY_API_URL || !TWENTY_API_KEY) {
  throw new Error('Set TWENTY_API_URL and TWENTY_API_KEY in n8n environment variables');
}

async function twentyGql(query, variables = {}) {
  const response = await this.helpers.httpRequest({
    method: 'POST',
    url: `${TWENTY_API_URL}/graphql`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TWENTY_API_KEY}`,
    },
    body: { query, variables },
    json: true,
  });

  if (response.errors?.length) {
    throw new Error(`Twenty GQL: ${response.errors[0].message}`);
  }

  return response.data;
}

// Example: pass query + variables from previous Set node
const { query, variables } = $input.first().json;

return [{ json: { data: await twentyGql.call(this, query, variables) } }];
