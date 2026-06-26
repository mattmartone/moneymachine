import { query } from '../db.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  const isPublic = authHeader === 'Bearer public';
  if (!isPublic) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
  }

  try {
    const { rows } = await query(`
      SELECT date, races_played, total_wagered, total_collected,
             model_net, random_avg_net, random_pct_beats,
             model_win_rate, random_win_rate,
             model_exacta_rate, random_exacta_rate, notes
      FROM postmortem_metrics
      ORDER BY date DESC
    `);

    if (!rows.length) {
      return res.status(200).json({ insights: [] });
    }

    const insights: string[] = [];

    // 1. Exacta rate comparison (model avg vs random avg)
    const withExacta = rows.filter((r: any) => r.model_exacta_rate != null && r.random_exacta_rate != null);
    if (withExacta.length > 0) {
      const avgModelExacta = withExacta.reduce((s: number, r: any) => s + parseFloat(r.model_exacta_rate), 0) / withExacta.length;
      const avgRandomExacta = withExacta.reduce((s: number, r: any) => s + parseFloat(r.random_exacta_rate), 0) / withExacta.length;
      if (avgRandomExacta > 0) {
        const multiplier = (avgModelExacta / avgRandomExacta).toFixed(1);
        insights.push(`Model hits exactas at ${multiplier}x the rate of random (${Math.round(avgModelExacta * 100)}% vs ${Math.round(avgRandomExacta * 100)}% avg)`);
      }
    }

    // 2. Days model beat random (by P/L)
    const withBoth = rows.filter((r: any) => r.model_net != null && r.random_avg_net != null);
    if (withBoth.length > 0) {
      const modelWins = withBoth.filter((r: any) => parseFloat(r.model_net) > parseFloat(r.random_avg_net)).length;
      insights.push(`Model beat random in ${modelWins} of last ${withBoth.length} race days`);
    }

    // 3. Best day
    const withNet = rows.filter((r: any) => r.model_net != null);
    if (withNet.length > 0) {
      const best = withNet.reduce((best: any, r: any) => parseFloat(r.model_net) > parseFloat(best.model_net) ? r : best, withNet[0]);
      const bestDate = new Date(best.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
      const bestNet = parseFloat(best.model_net);
      let bestLabel = `Best day: ${bestDate} (${bestNet >= 0 ? '+' : '-'}$${Math.abs(Math.round(bestNet))}`;
      if (best.model_exacta_rate != null) {
        bestLabel += `, ${Math.round(parseFloat(best.model_exacta_rate) * 100)}% exacta hit rate`;
      }
      bestLabel += ')';
      insights.push(bestLabel);
    }

    // 4. Model edge vs random (avg per day over profitable stretch or all time)
    if (withBoth.length > 0) {
      // Find the most recent profitable stretch (days where model > random consecutively from most recent)
      const sorted = [...withBoth].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      let streakDays: any[] = [];
      for (const r of sorted) {
        if (parseFloat(r.model_net) > parseFloat(r.random_avg_net)) {
          streakDays.push(r);
        } else {
          break;
        }
      }

      if (streakDays.length >= 2) {
        const edgeSum = streakDays.reduce((s: number, r: any) => s + (parseFloat(r.model_net) - parseFloat(r.random_avg_net)), 0);
        const avgEdge = Math.round(edgeSum / streakDays.length);
        const sinceDate = new Date(streakDays[streakDays.length - 1].date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
        insights.push(`Model edge vs random: +$${avgEdge} avg per day since ${sinceDate}`);
      } else {
        // All-time edge
        const totalEdge = withBoth.reduce((s: number, r: any) => s + (parseFloat(r.model_net) - parseFloat(r.random_avg_net)), 0);
        const avgEdge = Math.round(totalEdge / withBoth.length);
        if (avgEdge > 0) {
          insights.push(`Model edge vs random: +$${avgEdge} avg per race day`);
        } else {
          insights.push(`Model edge vs random: -$${Math.abs(avgEdge)} avg per race day`);
        }
      }
    }

    // 5. Exacta is the engine insight (compare win rate vs exacta rate)
    if (withExacta.length > 0) {
      const avgModelWin = rows.filter((r: any) => r.model_win_rate != null).reduce((s: number, r: any) => s + parseFloat(r.model_win_rate), 0) / rows.filter((r: any) => r.model_win_rate != null).length;
      const avgModelExacta = withExacta.reduce((s: number, r: any) => s + parseFloat(r.model_exacta_rate), 0) / withExacta.length;
      if (avgModelExacta > avgModelWin * 1.5) {
        insights.push(`Exacta is the engine — win rate lags but exotic consistency compounds`);
      }
    }

    return res.status(200).json({ insights });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
