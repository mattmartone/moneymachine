import { query } from '../db.js';
import { logComm } from '../lib/logComm.js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET || ''}`) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  const { reportId } = req.body;
  if (!reportId) {
    return res.status(400).json({ error: 'reportId required' });
  }

  try {
    const { rows: reportRows } = await query(
      `SELECT title, track, date, races_analyzed, summary FROM reports WHERE id = $1`,
      [reportId]
    );
    const report = reportRows[0];
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const { rows: users } = await query(`SELECT id, email, name FROM users`);
    if (!users.length) return res.status(200).json({ success: true, sent: 0 });

    const emails = users.map((u: any) => u.email);
    const subject = `Fresh work just dropped — ${report.title}`;
    const htmlBody = `
        <div style="font-family: 'Georgia', serif; max-width: 500px; border: 3px solid black; padding: 32px; background: #fffff8;">
          <h1 style="font-family: serif; font-size: 24px; margin: 0 0 8px 0;">FADE THE CHALK</h1>
          <hr style="border: 1px solid black; margin: 0 0 24px 0;" />
          <p style="font-family: serif; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
            The crew just finished a new piece of work. It's ready for pickup.
          </p>
          <h2 style="font-family: serif; font-size: 20px; color: #c00; margin: 0 0 8px 0;">${report.title}</h2>
          <p style="font-family: monospace; font-size: 13px; color: #666; margin: 0 0 16px 0;">
            ${report.track} &mdash; ${report.date}${report.races_analyzed ? ` &mdash; ${report.races_analyzed} race${report.races_analyzed > 1 ? 's' : ''}` : ''}
          </p>
          ${report.summary ? `<p style="font-family: serif; font-size: 15px; line-height: 1.5; margin: 0 0 24px 0;">${report.summary}</p>` : ''}
          <div style="margin: 24px 0;">
            <a href="https://fadethechalk.vercel.app/reports" style="display: inline-block; padding: 12px 24px; background: black; color: white; font-family: monospace; font-weight: bold; text-decoration: none; font-size: 14px;">
              COME GET IT &rarr;
            </a>
          </div>
          <p style="font-family: monospace; font-size: 11px; color: #999; margin: 24px 0 0 0;">
            1,000 tokens off the tab. You know the deal.
          </p>
        </div>
      `;

    await resend.emails.send({
      from: 'Fade the Chalk <picks@org64.com>',
      to: emails,
      subject,
      html: htmlBody
    });

    // Log the communication for every member
    const plainBody = `The crew just finished a new piece of work. It's ready for pickup.\n\n${report.title}\n${report.track} — ${report.date}${report.races_analyzed ? ` — ${report.races_analyzed} race${report.races_analyzed > 1 ? 's' : ''}` : ''}\n${report.summary || ''}\n\n1,000 tokens off the tab. You know the deal.`;
    for (const user of users) {
      await logComm(user.id, 'report_notification', subject, plainBody);
    }

    return res.status(200).json({ success: true, sent: emails.length, report: report.title });
  } catch (err: any) {
    console.error('report notify error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
