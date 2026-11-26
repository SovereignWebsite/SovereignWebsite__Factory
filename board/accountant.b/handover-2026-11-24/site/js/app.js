fetch('data/costs.json').then(r=>r.json()).then(d=>{
  const t=d.agents.reduce((s,a)=>s+a.usd,0), max=Math.max(...d.agents.map(a=>a.usd));
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  document.getElementById('snap').textContent=d.snapshot_utc;
  document.getElementById('total').textContent=t.toFixed(2)+' USD';
  document.getElementById('unit').textContent='Across '+d.agents.length+' agents, '+d.unit+'.';
  document.getElementById('agents').innerHTML=[...d.agents].sort((a,b)=>b.usd-a.usd).map(a=>
    '<tr><td><strong>'+esc(a.agent)+'</strong><br><span class="muted">'+esc(a.role)+(a.note?'. '+esc(a.note):'')+'</span><div class="bar" data-w="'+(a.usd/max*100).toFixed(1)+'"></div></td><td>'+esc(a.since.replace('T',' ').replace('Z',''))+'</td><td class="n">'+a.usd.toFixed(2)+'</td></tr>').join('');
  document.getElementById('loops').innerHTML=d.loops.map(l=>'<div class="card"><strong>'+esc(l.loop)+'</strong><br>'+esc(l.schedule)+', up to '+esc(l.runs_per_day)+' runs a day<br><span class="muted">'+esc(l.state)+'</span></div>').join('');
  const L=d.images.ledger, it=L.reduce((s,x)=>s+(x.usd||0),0);
  document.getElementById('images').innerHTML=esc(d.images.limit)+'.<br>'+L.length+' images logged, '+it.toFixed(2)+' USD reported.<br><span class="muted">Source: '+esc(d.images.cost_source)+'.</span>';
  document.querySelectorAll('.bar[data-w]').forEach(b=>{b.style.width=b.dataset.w+'%'});
  document.getElementById('method').textContent=d.method;
  document.getElementById('gaps').innerHTML=d.gaps.map(g=>'<li>'+esc(g)+'</li>').join('');
});
