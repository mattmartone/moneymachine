import { query } from './db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ftc-dev-secret';

export default async function handler(req: any, res: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  let decoded: any;
  try {
    decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (req.method === 'GET') {
    try {
      const { rows } = await query(
        `SELECT p.id, p.title, p.body, p.likes, p.dislikes, p.pinned, p.created_at,
                u.name as author_name,
                (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
         FROM posts p
         JOIN users u ON u.id = p.user_id
         ORDER BY p.pinned DESC, p.created_at DESC`
      );
      return res.status(200).json({ posts: rows });
    } catch (err: any) {
      console.error('board GET error:', err);
      return res.status(500).json({ error: err.message || 'Internal error' });
    }
  }

  if (req.method === 'POST') {
    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body required' });
    }

    try {
      await query(
        `INSERT INTO posts (user_id, title, body) VALUES ($1, $2, $3)`,
        [decoded.userId, title, body]
      );
      return res.status(201).json({ success: true });
    } catch (err: any) {
      console.error('board POST error:', err);
      return res.status(500).json({ error: err.message || 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
