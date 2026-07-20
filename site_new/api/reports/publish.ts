import { query } from '../db.js';
import { put } from '@vercel/blob';

export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } }
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET || ''}`) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  const { title, track, date, races_analyzed, summary, filename, fileData } = req.body;

  if (!title || !track || !date || !filename || !fileData) {
    return res.status(400).json({ error: 'title, track, date, filename, and fileData (base64) required' });
  }

  try {
    // Upload PDF to Vercel Blob
    const buffer = Buffer.from(fileData, 'base64');
    const blob = await put(`reports/${filename}`, buffer, {
      access: 'public',
      contentType: 'application/pdf'
    });

    // Insert report record
    const { rows } = await query(
      `INSERT INTO reports (title, track, date, races_analyzed, roi_pct, summary, content_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, title, content_url`,
      [title, track, date, races_analyzed || null, null, summary || null, blob.url]
    );

    return res.status(201).json({ success: true, report: rows[0], blob_url: blob.url });
  } catch (err: any) {
    console.error('report publish error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
