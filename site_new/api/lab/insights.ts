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
             model_net, random_median_net as random_avg_net, random_pct_beaten as random_pct_beats,
             win_rate as model_win_rate, null as random_win_rate,
             exacta_rate as model_exacta_rate, null as random_exacta_rate, notes
      FROM performance_warehouse
      ORDER BY date DESC
    `);

    if (!rows.length) {
      return res.status(200).json({ insights: [] });
    }

    const insights: string[] = [];

    // 1. Days model beat random (by P/L)
    const withRandom = rows.filter((r: any) => r.model_net != null && r.random_avg_net != null);
    if (withRandom.length > 0) {
      const modelWins = withRandom.filter((r: any) => parseFloat(r.model_net) > parseFloat(r.random_avg_net)).length;
      insights.push(`Model beats random in ${modelWins} of ${withRandom.length} race days`);
    }

    // 2. Exacta consistency
    const withExacta = rows.filter((r: any) => r.model_exacta_rate != null);
    if (withExacta.length > 0) {
      const avgExacta = withExacta.reduce((s: number, r: any) => s + parseFloat(r.model_exacta_rate), 0) / withExacta.length;
      insights.push(`Exacta hit rate: ${Math.round(avgExacta * 100)}% avg across ${withExacta.length} days`);
    }

    // 3. Lifetime P/L
    const allDays = rows.filter((r: any) => r.model_net != null);
    if (allDays.length > 0) {
      const totalNet = allDays.reduce((s: number, r: any) => s + parseFloat(r.model_net), 0);
      const totalWagered = allDays.reduce((s: number, r: any) => s + parseFloat(r.total_wagered), 0);
      const roi = totalWagered > 0 ? Math.round((totalNet / totalWagered) * 100) : 0;
      insights.push(`Lifetime: ${totalNet >= 0 ? '+' : '-'}$${Math.abs(Math.round(totalNet))} on $${Math.round(totalWagered)} wagered (${roi}% ROI)`);
    }

    // 4. Best day
    if (allDays.length > 0) {
      const best = allDays.reduce((best: any, r: any) => parseFloat(r.model_net) > parseFloat(best.model_net) ? r : best, allDays[0]);
      const bestDate = new Date(best.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
      const bestNet = parseFloat(best.model_net);
      insights.push(`Best day: ${bestDate} (+$${Math.round(bestNet)})`);
    }

    // 5. Selectivity insight (fewer races = better ROI if true)
    if (allDays.length >= 3) {
      const sorted = [...allDays].sort((a: any, b: any) => parseFloat(b.model_net) - parseFloat(a.model_net));
      const topDays = sorted.slice(0, 3);
      const avgRaces = topDays.reduce((s: number, r: any) => s + r.races_played, 0) / topDays.length;
      const allAvgRaces = allDays.reduce((s: number, r: any) => s + r.races_played, 0) / allDays.length;
      if (avgRaces < allAvgRaces) {
        insights.push(`Top days average ${Math.round(avgRaces)} races vs ${Math.round(allAvgRaces)} overall — selectivity pays`);
      }
    }

    return res.status(200).json({ insights });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
