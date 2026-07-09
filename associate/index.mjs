import { query, pool } from './lib/db.mjs';
import { notify } from './lib/notify.mjs';
import { buyBrisnet } from './lib/brisnet.mjs';
import { parseDRFFile } from './lib/parser.mjs';
import { readdirSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';

const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS) || 300000; // 5 min default

async function checkIn() {
  try {
    const tasks = await query(
      "SELECT * FROM agent_tasks WHERE status = 'pending' ORDER BY created_at LIMIT 1"
    );

    if (!tasks.length) return;

    const task = tasks[0];
    console.log(`[ASSOCIATE] Found task: ${task.type} (id: ${task.id})`);

    // Mark in progress
    await pool.query(
      "UPDATE agent_tasks SET status = 'in_progress', started_at = NOW() WHERE id = $1",
      [task.id]
    );

    if (task.type === 'buy_brisnet') {
      const { tracks, date } = task.payload;
      const result = await buyBrisnet(tracks, date);

      if (result.status === 'awaiting_approval') {
        await pool.query(
          "UPDATE agent_tasks SET status = 'awaiting_approval', result = $1 WHERE id = $2",
          [JSON.stringify(result), task.id]
        );
        return;
      }

      if (result.status === 'complete' && result.files?.length > 0) {
        // Parse downloaded files into DB
        let totalRaces = 0, totalEntries = 0;
        for (const filePath of result.files) {
          if (filePath.endsWith('.zip')) {
            // Unzip first
            const dir = filePath.replace('.zip', '');
            mkdirSync(dir, { recursive: true });
            execSync(`unzip -o "${filePath}" -d "${dir}"`);
            const drfFiles = readdirSync(dir).filter(f => f.endsWith('.DRF'));
            for (const drf of drfFiles) {
              const parsed = await parseDRFFile(`${dir}/${drf}`);
              totalRaces += parsed.races;
              totalEntries += parsed.entries;
            }
          } else if (filePath.endsWith('.DRF')) {
            const parsed = await parseDRFFile(filePath);
            totalRaces += parsed.races;
            totalEntries += parsed.entries;
          }
        }

        await pool.query(
          "UPDATE agent_tasks SET status = 'complete', completed_at = NOW(), result = $1 WHERE id = $2",
          [JSON.stringify({ ...result, races_parsed: totalRaces, entries_parsed: totalEntries }), task.id]
        );
        await notify(`✅ Job done. ${totalRaces} races, ${totalEntries} entries loaded for ${date}. Street Boss — you're up.`);
      } else if (result.status === 'error') {
        await pool.query(
          "UPDATE agent_tasks SET status = 'error', result = $1 WHERE id = $2",
          [JSON.stringify(result), task.id]
        );
      }
    }
  } catch (e) {
    console.error('[ASSOCIATE] Error during check-in:', e.message);
    await notify(`❌ Associate error: ${e.message}`);
  }
}

// Also check for approved tasks (waiting for Matt's go-ahead)
async function checkApproved() {
  try {
    const tasks = await query(
      "SELECT * FROM agent_tasks WHERE status = 'approved' ORDER BY created_at LIMIT 1"
    );

    if (!tasks.length) return;

    const task = tasks[0];
    console.log(`[ASSOCIATE] Approved task found: ${task.type} (id: ${task.id})`);
    await pool.query("UPDATE agent_tasks SET status = 'in_progress' WHERE id = $1", [task.id]);

    // Re-run with auto-approve
    const origAutoApprove = process.env.AUTO_APPROVE;
    process.env.AUTO_APPROVE = 'true';
    const { tracks, date } = task.payload;
    const result = await buyBrisnet(tracks, date);
    process.env.AUTO_APPROVE = origAutoApprove;

    if (result.status === 'complete' && result.files?.length > 0) {
      let totalRaces = 0, totalEntries = 0;
      for (const filePath of result.files) {
        if (filePath.endsWith('.zip')) {
          const dir = filePath.replace('.zip', '');
          mkdirSync(dir, { recursive: true });
          execSync(`unzip -o "${filePath}" -d "${dir}"`);
          const drfFiles = readdirSync(dir).filter(f => f.endsWith('.DRF'));
          for (const drf of drfFiles) {
            const parsed = await parseDRFFile(`${dir}/${drf}`);
            totalRaces += parsed.races;
            totalEntries += parsed.entries;
          }
        }
      }

      await pool.query(
        "UPDATE agent_tasks SET status = 'complete', completed_at = NOW(), result = $1 WHERE id = $2",
        [JSON.stringify({ ...result, races_parsed: totalRaces, entries_parsed: totalEntries }), task.id]
      );
      await notify(`✅ Job done. ${totalRaces} races, ${totalEntries} entries loaded for ${date}. Street Boss — you're up.`);
    }
  } catch (e) {
    console.error('[ASSOCIATE] Error processing approved task:', e.message);
  }
}

// Main loop
console.log(`[ASSOCIATE] Checking in. Polling every ${POLL_INTERVAL / 1000}s.`);
await notify('🧑‍💼 Associate reporting for duty. Checking the board.');

// Ensure screenshots dir exists
mkdirSync('screenshots', { recursive: true });
mkdirSync('downloads', { recursive: true });

// Initial check
await checkIn();
await checkApproved();

// Poll loop
setInterval(async () => {
  await checkIn();
  await checkApproved();
}, POLL_INTERVAL);
