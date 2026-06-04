require('dotenv').config();

const app = require('./src/app');
const { startScheduler } = require('./src/jobs/scheduler');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[SERVER] Running on port ${PORT} — ${new Date().toISOString()}`);
  startScheduler();
  console.log('[SCHEDULER] Cron jobs started');
});
