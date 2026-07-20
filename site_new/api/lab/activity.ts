import { query } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });

  try {
    jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { race_id, track, date } = req.query;

  try {
    if (race_id) {
      const { rows } = await query(
        `SELECT id, event_type, message, details, created_at
         FROM pipeline_events WHERE race_id = $1
         ORDER BY created_at DESC`,
        [race_id]
      );
      return res.status(200).json({ events: rows });
    }

    if (track && date) {
      const { rows } = await query(
        `SELECT pe.id, pe.race_id, pe.event_type, pe.message, pe.details, pe.created_at, r.race_number
         FROM pipeline_events pe
         LEFT JOIN races r ON r.id = pe.race_id
         WHERE pe.date = $1 AND (r.track = $2 OR pe.race_id IS NULL)
         ORDER BY pe.created_at DESC`,
        [date, track]
      );
      return res.status(200).json({ events: rows });
    }

    if (date) {
      const { rows } = await query(
        `SELECT pe.id, pe.race_id, pe.event_type, pe.message, pe.details, pe.created_at, r.track, r.race_number
         FROM pipeline_events pe
         LEFT JOIN races r ON r.id = pe.race_id
         WHERE pe.date = $1
         ORDER BY pe.created_at DESC`,
        [date]
      );
      return res.status(200).json({ events: rows });
    }

    return res.status(400).json({ error: 'Provide race_id, or date, or date+track' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
