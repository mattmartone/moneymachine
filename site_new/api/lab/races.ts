import { query } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ftc-dev-secret';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  const isPublic = authHeader === 'Bearer public';
  if (!isPublic) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
      jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  try {
    const { today, track } = req.query || {};

    // Track list for today
    if (today) {
      const now = new Date();
      const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const dateStr = `${et.getFullYear()}-${String(et.getMonth() + 1).padStart(2, '0')}-${String(et.getDate()).padStart(2, '0')}`;
      const { rows } = await query(
        `SELECT track as name, COUNT(*) as races FROM races
         WHERE date = $1 AND field_size >= 6
         AND track NOT IN (SELECT track FROM races WHERE date = $1 AND track = ANY(ARRAY['ALB','ARP','BTP','CT','DED','EMD','EVD','FMT','FL','MNR','TDN','PRM','LS','CBY']))
         GROUP BY track ORDER BY track`,
        [dateStr]
      );
      return res.status(200).json({ tracks: rows.map((r: any) => ({ name: r.name, races: parseInt(r.races) })) });
    }

    // Races for a specific track today
    if (track) {
      const now = new Date();
      const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const dateStr = `${et.getFullYear()}-${String(et.getMonth() + 1).padStart(2, '0')}-${String(et.getDate()).padStart(2, '0')}`;
      const { rows } = await query(
        `SELECT id, race_number as number, conditions, distance, surface, field_size
         FROM races WHERE track = $1 AND date = $2 AND field_size >= 6
         ORDER BY race_number`,
        [track, dateStr]
      );
      return res.status(200).json({ races: rows });
    }

    // Default: all qualified races grouped
    const { rows } = await query(
      `SELECT r.id, r.track, r.date, r.race_number, r.conditions, r.class,
              r.distance, r.surface, r.field_size, r.qualified, r.post_time,
              COUNT(e.id) AS entries_count,
              CASE WHEN res.id IS NOT NULL THEN true ELSE false END AS has_results
       FROM races r
       LEFT JOIN entries e ON e.race_id = r.id
       LEFT JOIN results res ON res.race_id = r.id
       WHERE r.qualified = true
       GROUP BY r.id, res.id
       HAVING COUNT(e.id) > 0
       ORDER BY r.date DESC, r.race_number ASC`
    );

    const grouped = rows.reduce((acc: any, race: any) => {
      const dateStr = typeof race.date === 'string' ? race.date.split('T')[0] : race.date.toISOString().split('T')[0];
      const key = `${race.track} — ${dateStr}`;
      if (!acc[key]) acc[key] = { track: race.track, date: dateStr, races: [] };
      acc[key].races.push(race);
      return acc;
    }, {});

    return res.status(200).json({ cards: Object.values(grouped) });
  } catch (err: any) {
    console.error('lab races error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
