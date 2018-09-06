import config from './config';
import fs from 'fs-extra';
import path from 'path';

const statsFilePath = path.resolve(config.dataDir, 'stats.json');
let data = {
  dns: {
    total: 0,
    blocked: 0,
    errors: 0
  }
};

async function loadData() {
  await fs.ensureFile(statsFilePath);
  try {
    data = await fs.readJson(statsFilePath);
  } catch (err) {}
}

async function saveStats() {
  try {
    await fs.outputJson(statsFilePath, data, { spaces: 2 });
  } catch (err) {
    console.error('Failed to save the stats data', err);
  }
}

export function incrementDnsBlockCount() {
  data.dns.blocked = data.dns.blocked + 1;
  saveStats();
}

export function incrementDnsQueryCount() {
  data.dns.total = data.dns.total + 1;
  saveStats();
}

export function incrementDnsErrorCount() {
  data.dns.errors = data.dns.errors + 1;
  saveStats();
}

export function get() {
  return JSON.parse(JSON.stringify(data));
}

loadData()
    .then(()=> console.log('Stats data loaded successfully'))
    .catch((err)=> console.error('Failed to read stats data', err));