import { query } from '../db.js';

export async function logComm(userId: number, type: string, subject: string, body: string) {
  try {
    await query(
      `INSERT INTO member_comms (user_id, type, subject, body) VALUES ($1, $2, $3, $4)`,
      [userId, type, subject, body]
    );
  } catch (err) {
    console.error('logComm error:', err);
  }
}
