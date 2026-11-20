// Minimal GitHub REST client for the pipeline. Token from GH_TOKEN (an App installation token minted in CI) unless one is passed.
export async function gh(method, path, body, token = process.env.GH_TOKEN) {
  const r = await fetch(`https://api.github.com${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', 'user-agent': 'sovereignwebsite-factory' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: r.status, data };
}
