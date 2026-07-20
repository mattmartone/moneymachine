import pg from 'pg';
const { Pool } = pg;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

const DATE = process.argv[2] || new Date().toISOString().split('T')[0];

console.log(`\n=== SCORED CANDIDATES INSIGHTS — ${DATE} ===\n`);

// Day pattern vs history
const { rows: dayPatterns } = await pool.query(`
  SELECT date,
    count(*) as candidates,
    count(*) FILTER (WHERE conviction = 'HIGH') as high,
    count(*) FILTER (WHERE conviction = 'MEDIUM') as medium,
    count(*) FILTER (WHERE conviction = 'LOW') as low,
    count(*) FILTER (WHERE s4_fired AND s5_fired AND s9_fired) as triple_signal,
    count(*) FILTER (WHERE fave_vulnerable) as vulnerable_faves,
    round(avg(composite_score)::numeric, 1) as avg_composite,
    round(max(composite_score)::numeric, 1) as max_composite
  FROM scored_candidates WHERE status = 'scored'
  GROUP BY date ORDER BY date DESC
`);

console.log('--- Day Patterns (signal density) ---');
console.log('Date       | Cands | HIGH | MED | LOW | S4+S5+S9 | VulnFav | AvgComp | MaxComp');
console.log('-'.repeat(85));
for (const d of dayPatterns) {
  const ds = typeof d.date === 'string' ? d.date.split('T')[0] : d.date.toISOString().split('T')[0];
  const isToday = ds === DATE ? ' ←' : '';
  console.log(`${ds} |   ${String(d.candidates).padStart(3)} |   ${String(d.high).padStart(2)} |  ${String(d.medium).padStart(2)} |  ${String(d.low).padStart(2)} |       ${String(d.triple_signal).padStart(2)} |      ${String(d.vulnerable_faves).padStart(2)} |   ${d.avg_composite} |   ${d.max_composite}${isToday}`);
}

// Signal combo frequency and co-occurrence
const { rows: combos } = await pool.query(`
  SELECT
    CASE
      WHEN s4_fired AND s5_fired AND s9_fired THEN 'S4+S5+S9'
      WHEN s4_fired AND s5_fired THEN 'S4+S5'
      WHEN s4_fired AND s9_fired THEN 'S4+S9'
      WHEN s5_fired AND s9_fired THEN 'S5+S9'
      WHEN s4_fired THEN 'S4 only'
      WHEN s5_fired THEN 'S5 only'
      WHEN s9_fired THEN 'S9 only'
      WHEN s1_fired THEN 'S1 (bomb)'
      ELSE 'no major signal'
    END as combo,
    count(*) as occurrences,
    round(avg(composite_score)::numeric, 1) as avg_composite,
    count(*) FILTER (WHERE fave_vulnerable) as with_vuln_fave
  FROM scored_candidates
  WHERE status = 'scored'
  GROUP BY combo
  ORDER BY avg_composite DESC
`);

console.log('\n--- Signal Combos (all dates) ---');
console.log('Combo          | Count | AvgComp | w/Vulnerable');
console.log('-'.repeat(55));
for (const c of combos) {
  console.log(`${c.combo.padEnd(15)}|   ${String(c.occurrences).padStart(3)} |   ${c.avg_composite} |        ${c.with_vuln_fave}`);
}

// Today vs average
if (dayPatterns.length > 1) {
  const today = dayPatterns.find(d => {
    const ds = typeof d.date === 'string' ? d.date.split('T')[0] : d.date.toISOString().split('T')[0];
    return ds === DATE;
  });
  const others = dayPatterns.filter(d => {
    const ds = typeof d.date === 'string' ? d.date.split('T')[0] : d.date.toISOString().split('T')[0];
    return ds !== DATE;
  });

  if (today && others.length > 0) {
    const avgCands = (others.reduce((s, d) => s + parseInt(d.candidates), 0) / others.length).toFixed(1);
    const avgTriple = (others.reduce((s, d) => s + parseInt(d.triple_signal), 0) / others.length).toFixed(1);
    const avgVuln = (others.reduce((s, d) => s + parseInt(d.vulnerable_faves), 0) / others.length).toFixed(1);
    const avgComp = (others.reduce((s, d) => s + parseFloat(d.avg_composite), 0) / others.length).toFixed(1);

    console.log(`\n--- ${DATE} vs Historical Average ---`);
    console.log(`Candidates:    ${today.candidates} (avg: ${avgCands})`);
    console.log(`Triple signal: ${today.triple_signal} (avg: ${avgTriple})`);
    console.log(`Vuln faves:    ${today.vulnerable_faves} (avg: ${avgVuln})`);
    console.log(`Avg composite: ${today.avg_composite} (avg: ${avgComp})`);

    const tripleRatio = parseInt(today.triple_signal) / parseInt(today.candidates);
    const avgTripleRatio = parseFloat(avgTriple) / parseFloat(avgCands);
    const confidence = tripleRatio > avgTripleRatio ? 'HIGH signal day' : 'LOW signal day (grind)';
    console.log(`\n→ Day type: ${confidence}`);
  }
}

console.log('');
await pool.end();
