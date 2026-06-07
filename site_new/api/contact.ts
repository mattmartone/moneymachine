import { Resend } from 'resend';
import { query } from './db.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ error: 'Email and message required' });
  }

  try {
    // Get all admin emails
    const { rows } = await query(`SELECT email FROM users WHERE role = 'admin'`);
    const adminEmails = rows.map((r: any) => r.email);

    if (adminEmails.length === 0) {
      adminEmails.push('mwmartone@gmail.com');
    }

    await resend.emails.send({
      from: 'Fade the Chalk <picks@org64.com>',
      to: adminEmails,
      subject: `[FTC Contact] Message from ${name || email}`,
      html: `
        <div style="font-family: monospace; max-width: 500px; border: 2px solid black; padding: 24px;">
          <h2 style="font-family: serif;">New Contact Message</h2>
          <p><strong>From:</strong> ${name || 'No name'} &lt;${email}&gt;</p>
          <hr style="border: 1px solid #ccc;" />
          <p style="white-space: pre-wrap;">${message}</p>
          <hr style="border: 1px solid #ccc;" />
          <p style="font-size: 12px; color: #666;">Reply directly to this email to respond to the user.</p>
        </div>
      `,
      replyTo: email
    });

    return res.status(200).json({ sent: true });
  } catch (err: any) {
    console.error('contact error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
