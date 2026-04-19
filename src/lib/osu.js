const CLIENT_ID = process.env.OSU_CLIENT_ID;
const CLIENT_SECRET = process.env.OSU_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiry = 0;

export async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

  const response = await fetch('https://osu.ppy.sh/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'public',
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`Failed to get osu! access token: ${data.error}`);
  }

  cachedToken = data.access_token;
  tokenExpiry = now + data.expires_in - 60; // Cache for slightly less than expires_in
  return cachedToken;
}

export async function osuApiFetch(endpoint) {
  const token = await getAccessToken();
  const response = await fetch(`https://osu.ppy.sh/api/v2/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`osu! API error (${response.status}): ${errorText}`);
  }

  return response.json();
}
