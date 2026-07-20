import { query } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

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

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const { rows: postRows } = await query(
        `SELECT p.id, p.title, p.body, p.likes, p.dislikes, p.created_at,
                u.name as author_name
         FROM posts p
         JOIN users u ON u.id = p.user_id
         WHERE p.id = $1`,
        [id]
      );

      if (postRows.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const { rows: commentRows } = await query(
        `SELECT c.id, c.body, c.likes, c.dislikes, c.created_at,
                u.name as author_name
         FROM comments c
         JOIN users u ON u.id = c.user_id
         WHERE c.post_id = $1
         ORDER BY c.created_at ASC`,
        [id]
      );

      return res.status(200).json({ post: postRows[0], comments: commentRows });
    } catch (err: any) {
      console.error('board/[id] GET error:', err);
      return res.status(500).json({ error: err.message || 'Internal error' });
    }
  }

  if (req.method === 'POST') {
    const { body } = req.body;
    if (!body) {
      return res.status(400).json({ error: 'Body required' });
    }

    try {
      await query(
        `INSERT INTO comments (post_id, user_id, body) VALUES ($1, $2, $3)`,
        [id, decoded.userId, body]
      );
      return res.status(201).json({ success: true });
    } catch (err: any) {
      console.error('board/[id] POST error:', err);
      return res.status(500).json({ error: err.message || 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
