export async function writeScoredCandidate(pool, data) {
  try {
    const signals = data.signals || [];
    const signalIds = signals.map(s => s.id);

    await pool.query(`
      INSERT INTO scored_candidates (
        race_id, date, status, blocked_reason, conviction,
        composite_score, signal_score, odds_bonus,
        s1_fired, s4_fired, s5_fired, s6_fired, s9_fired, s11_fired,
        win_pick_pp, win_pick_name, win_pick_ml, win_pick_style,
        win_pick_beyer, win_pick_distance_beyer,
        box_pps, box_names,
        field_size, pace_scenario, fave_vulnerable,
        fave_pp, fave_name, fave_style, vulnerability_reason,
        proposed_win_stake, proposed_exacta_stake, doubled,
        race_theory, run_id
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18,
        $19, $20,
        $21, $22,
        $23, $24, $25,
        $26, $27, $28, $29,
        $30, $31, $32,
        $33, $34
      )
      ON CONFLICT (race_id, date) DO UPDATE SET
        status = EXCLUDED.status,
        blocked_reason = EXCLUDED.blocked_reason,
        conviction = EXCLUDED.conviction,
        composite_score = EXCLUDED.composite_score,
        signal_score = EXCLUDED.signal_score,
        odds_bonus = EXCLUDED.odds_bonus,
        s1_fired = EXCLUDED.s1_fired,
        s4_fired = EXCLUDED.s4_fired,
        s5_fired = EXCLUDED.s5_fired,
        s6_fired = EXCLUDED.s6_fired,
        s9_fired = EXCLUDED.s9_fired,
        s11_fired = EXCLUDED.s11_fired,
        win_pick_pp = EXCLUDED.win_pick_pp,
        win_pick_name = EXCLUDED.win_pick_name,
        win_pick_ml = EXCLUDED.win_pick_ml,
        win_pick_style = EXCLUDED.win_pick_style,
        win_pick_beyer = EXCLUDED.win_pick_beyer,
        win_pick_distance_beyer = EXCLUDED.win_pick_distance_beyer,
        box_pps = EXCLUDED.box_pps,
        box_names = EXCLUDED.box_names,
        field_size = EXCLUDED.field_size,
        pace_scenario = EXCLUDED.pace_scenario,
        fave_vulnerable = EXCLUDED.fave_vulnerable,
        fave_pp = EXCLUDED.fave_pp,
        fave_name = EXCLUDED.fave_name,
        fave_style = EXCLUDED.fave_style,
        vulnerability_reason = EXCLUDED.vulnerability_reason,
        proposed_win_stake = EXCLUDED.proposed_win_stake,
        proposed_exacta_stake = EXCLUDED.proposed_exacta_stake,
        doubled = EXCLUDED.doubled,
        race_theory = EXCLUDED.race_theory,
        run_id = EXCLUDED.run_id,
        scored_at = NOW()
    `, [
      data.raceId,
      data.date,
      data.status,
      data.blockedReason || null,
      data.conviction || null,
      data.composite || null,
      data.signalScore || null,
      data.oddsBonus || null,
      signalIds.includes('S1'),
      signalIds.includes('S4'),
      signalIds.includes('S5'),
      signalIds.includes('S6'),
      signalIds.includes('S9'),
      signalIds.includes('S11'),
      data.winPickPP || null,
      data.winPickName || null,
      data.winPickML || null,
      data.winPickStyle || null,
      data.winPickBeyer || null,
      data.winPickDistanceBeyer || null,
      data.boxPPs || null,
      data.boxNames || null,
      data.fieldSize || null,
      data.paceScenario || null,
      data.faveVulnerable || false,
      data.favePP || null,
      data.faveName || null,
      data.faveStyle || null,
      data.vulnerabilityReason || null,
      data.proposedWinStake || null,
      data.proposedExactaStake || null,
      data.doubled || false,
      data.raceTheory || null,
      data.runId || null
    ]);
  } catch (e) {
    console.error(`  ⚠ scored_candidates write failed for race ${data.raceId}:`, e.message);
  }
}
