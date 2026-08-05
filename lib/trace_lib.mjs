import { randomUUID } from 'crypto';

export class RaceTracer {
  constructor(raceId, date, runId, pool) {
    this.raceId = raceId;
    this.date = date;
    this.runId = runId;
    this.pool = pool;
    this.traceId = null;
    this.stepOrder = 0;
    this.blocked = false;
    this.hasWarning = false;
  }

  async start() {
    const { rows } = await this.pool.query(
      `INSERT INTO race_traces (race_id, date, run_id, status) VALUES ($1, $2, $3, 'running') RETURNING id`,
      [this.raceId, this.date, this.runId]
    );
    this.traceId = rows[0].id;
    return this.traceId;
  }

  async step(phase, name, gateType, fn) {
    this.stepOrder++;
    const startMs = Date.now();

    const { rows: [row] } = await this.pool.query(
      `INSERT INTO trace_steps (trace_id, step_order, phase, gate_type, name, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`,
      [this.traceId, this.stepOrder, phase, gateType, name]
    );
    const stepId = row.id;

    try {
      const { input, logic, result, status, message } = await fn();
      const duration = Date.now() - startMs;

      await this.pool.query(
        `UPDATE trace_steps SET input_data = $1, logic_applied = $2, result = $3, status = $4, message = $5, duration_ms = $6 WHERE id = $7`,
        [JSON.stringify(input || null), logic || null, JSON.stringify(result || null), status, message, duration, stepId]
      );

      if (gateType === 'hard_block' && status === 'failed') {
        this.blocked = true;
      }
      if (gateType === 'warning' && status === 'warning') {
        this.hasWarning = true;
      }

      return result;
    } catch (err) {
      const duration = Date.now() - startMs;
      await this.pool.query(
        `UPDATE trace_steps SET status = 'failed', message = $1, duration_ms = $2 WHERE id = $3`,
        [`ERROR: ${err.message}`, duration, stepId]
      );
      if (gateType === 'hard_block') this.blocked = true;
      return null;
    }
  }

  async complete(summary = {}) {
    const finalStatus = this.blocked ? 'blocked' : this.hasWarning ? 'warning' : 'passed';
    await this.pool.query(
      `UPDATE race_traces SET status = $1, conviction = $2, composite_score = $3, win_pick_pp = $4, box_pps = $5, race_theory = $6, completed_at = NOW() WHERE id = $7`,
      [finalStatus, summary.conviction || null, summary.composite || null, summary.winPickPP || null, summary.boxPPs || null, summary.theory || null, this.traceId]
    );
    return finalStatus;
  }
}

export function generateRunId() {
  return randomUUID().slice(0, 8);
}

export function distanceToYards(distStr) {
  if (!distStr) return null;
  const d = distStr.toLowerCase().trim();
  if (d.includes('1-1/2')) return 2640;
  if (d.includes('1-3/8')) return 2420;
  if (d.includes('1-1/4')) return 2200;
  if (d.includes('1-1/8')) return 1980;
  if (d.includes('1-1/16')) return 1870;
  if (d === '1 mile') return 1760;
  const m = d.match(/([\d.]+)\s*(f|fur)/);
  if (m) return Math.round(parseFloat(m[1]) * 220);
  return null;
}
