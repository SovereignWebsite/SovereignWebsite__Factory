// Fill {{vars}}: exact JSON string escaping in .json files, so published values are exact (security.b, review 026);
// HTML escaping everywhere else.
export const fill = (t, vars, f = '') => { for (const [k, v] of Object.entries(vars)) t = t.split(`{{${k}}}`).join(/\.json$/i.test(f) ? JSON.stringify(String(v)).slice(1, -1) : String(v).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c])); return t; };
