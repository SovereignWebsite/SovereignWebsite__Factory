// Plan DNS: turn org/dns.json into one Route 53 change batch per zone (UPSERT only) and a plan for the policy check.
// Zone IDs come from the apply environment: SW_ZONE_ID_AI, SW_ZONE_ID_ORG, SW_ZONE_ID_SITE.
// Usage: node build/dns-plan.mjs <outdir>   writes <outdir>/plan.json and <outdir>/<zone>.json, prints a Markdown plan.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ZONE_VAR = { 'sovereignwebsite.ai': 'SW_ZONE_ID_AI', 'sovereignwebsite.org': 'SW_ZONE_ID_ORG', 'sovereignwebsite.site': 'SW_ZONE_ID_SITE' };

export function dnsPlan(dns, env = {}) {
  const actions = [], batches = [], errors = [];
  for (const z of dns.zones) {
    const idVar = ZONE_VAR[z.zone];
    if (!idVar) { errors.push(`zone ${z.zone} is not one of ours`); continue; }
    const Changes = [];
    for (const r of z.records) {
      if (r.name !== z.zone && !r.name.endsWith(`.${z.zone}`)) { errors.push(`${r.name} is not in ${z.zone}`); continue; }
      actions.push({ action: 'route53.upsert_record', target: `${r.name} ${r.type}` });
      Changes.push({ Action: 'UPSERT', ResourceRecordSet: { Name: r.name, Type: r.type, TTL: r.ttl ?? 300, ResourceRecords: r.values.map((Value) => ({ Value })) } });
    }
    if (Changes.length) batches.push({ zone: z.zone, idVar, zoneId: env[idVar] || null, batch: { Comment: 'SovereignWebsite__Factory dns-apply', Changes } });
  }
  return { plan: { pipeline: 'dns-apply', actions }, batches, errors };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const out = process.argv[2] || 'dns-out';
  mkdirSync(out, { recursive: true });
  const { plan, batches, errors } = dnsPlan(JSON.parse(readFileSync('org/dns.json', 'utf8')), process.env);
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  writeFileSync(join(out, 'plan.json'), JSON.stringify(plan, null, 2));
  const lines = [`### DNS plan (${plan.actions.length} records, UPSERT only)`];
  for (const b of batches) {
    writeFileSync(join(out, `${b.zone}.json`), JSON.stringify(b.batch, null, 2));
    lines.push(`- ${b.zone} (${b.zoneId ? 'zone id set' : `${b.idVar} not set`}): ${b.batch.Changes.map((c) => `${c.ResourceRecordSet.Name} ${c.ResourceRecordSet.Type}`).join(', ')}`);
  }
  writeFileSync(join(out, 'zones.txt'), batches.map((b) => `${b.zone} ${b.idVar}`).join('\n') + '\n');
  console.log(lines.join('\n'));
}
