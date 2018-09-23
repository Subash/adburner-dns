import download from 'download';
import config from './config';
import fs from 'fs-extra';
import path from 'path';
import micromatch from 'micromatch';

let blockedHosts = [];
let blackList = [];
let whiteList = [];

async function downloadBlockedHosts() {
  console.log(`Caching ${config.blockedHostsUrl}`);
  await download(config.blockedHostsUrl, path.dirname(config.blockedHosts), { filename: path.basename(config.blockedHosts) });
  console.log(`Cached ${config.blockedHostsUrl}`);
}

async function exists(filePath) {
  try {
    await fs.stat(filePath);
    return true;
  } catch (err) {
    return false;
  }
}

async function loadBlockedHosts() {
  const isCached = await exists(config.blockedHosts);
  if(!isCached) await downloadBlockedHosts();
  let data = await fs.readFile(config.blockedHosts, 'utf-8');
  blockedHosts = data.split('\n')
    .map( line => line.trim())
    .filter( line => !line.startsWith('#')) //Remove comments
    .filter( line => line.startsWith('0.0.0.0')) //Pick the blocked hosts
    .map( line => line.split(' ')[1]) //Keep just the hostname
    .map( line => line.trim());
}

async function loadBlackList() {
  if(!(await exists(config.blackList))) await fs.outputFile(config.blackList, ''); //create empty file
  let data = await fs.readFile(config.blackList, 'utf-8');
  blackList = data.split('\n').map( line => line.trim())
}

async function loadWhiteList() {
  if(!(await exists(config.whiteList))) await fs.outputFile(config.whiteList, ''); //create empty file
  let data = await fs.readFile(config.whiteList, 'utf-8');
  whiteList = data.split('\n').map( line => line.trim())
}

async function loadData() {
  await Promise.all([loadBlockedHosts(), loadBlackList(), loadWhiteList()]);
}

export function isBlocked(hostname) {
  if(micromatch.any(hostname, whiteList)) return false;
  if(micromatch.any(hostname, blackList)) return true;
  return blockedHosts.includes(hostname);
}

loadData()
  .then(()=> console.log('Data loaded successfully'))
  .catch((err)=> console.error('Failed to load some data', err));