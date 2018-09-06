import download from 'download';
import { md5 } from './util';
import config from './config';
import fs from 'fs-extra';
import path from 'path';
import micromatch from 'micromatch';

let customBlacklist = new Set();
let customWhitelist = new Set();
let blacklists = {};

function urlToFileName(url) {
  return md5(url) + '.txt';
}

async function cacheUrl(url) {
  console.log(`Caching ${url}`);
  const filename = urlToFileName(url);
  await fs.ensureDir(config.hostsCacheDir);
  await download(url, config.hostsCacheDir, { filename: filename });
  console.log(`Cached ${url}`);
}

async function isCached(url) {
  const filename = urlToFileName(url);
  const filePath = path.resolve(config.hostsCacheDir, filename);
  try {
    await fs.stat(filePath);
    return true;
  } catch (err) {
    return false;
  }
}

async function parseHostsFile(filePath) {
  const data = (await fs.readFile(filePath)).toString('utf-8');
  return data.split('\n')
              .map( line => line.trim())
              .filter( line => !line.startsWith('#')) //Remove comments
              .filter( line => line.startsWith('0.0.0.0')) //Pick the blocked hosts
              .map( line => line.split(' ')[1]) //Keep just the hostname
              .map( line => line.trim());
}

async function loadBlacklistHostFiles() {
  blacklists = {};
  for(const url of config.blacklistHostUrls) {
    if(!(await isCached(url))) await cacheUrl(url);
    const filename = urlToFileName(url);
    const filePath = path.resolve(config.hostsCacheDir, filename);
    const blockedHosts = await parseHostsFile(filePath);
    console.log(`Loaded ${url}`);
    blacklists[url] = new Set(blockedHosts);
  }
}

async function loadCustomBlacklist() {
  const filePath = config.customBlacklistFilePath;
  try {
    const data = await fs.readJson(filePath);
    customBlacklist = new Set(data);
    console.log(`Loaded ${filePath}`);
  } catch (err) {}
}

async function loadCustomWhitelist() {
  const filePath = config.customWhitelistFilePath;
  try {
    const data = await fs.readJson(filePath);
    customWhitelist= new Set(data);
    console.log(`Loaded ${filePath}`);
  } catch (err) {}
}

async function loadData() {
  await Promise.all([loadBlacklistHostFiles(), loadCustomBlacklist(), loadCustomWhitelist()]);
}

async function saveCustomWhitelist() {
  try {
    await fs.outputJson(config.customWhitelistFilePath, Array.from(customWhitelist), { spaces: 2 });
  } catch(err) {
    console.error('Failed to save custom whitelist file', err);
  }
}

async function saveCustomBlacklist() {
  try {
    await fs.outputJson(config.customBlacklistFilePath, Array.from(customBlacklist), { spaces: 2 });
  } catch(err) {
    console.error('Failed to save custom blacklist file', err);
  }
}

export function isBlocked(hostname) {
  if(micromatch.any(hostname, Array.from(customWhitelist))) return false;
  if(micromatch.any(hostname, Array.from(customBlacklist))) return true;
  for(const list of Object.values(blacklists)) {
    if(list.has(hostname)) return true;
  }
  return false;
}

export async function addToCustomWhitelist(string) {
  if(!string) throw new Error('Invalid Pattern');
  customWhitelist.add(string);
  saveCustomWhitelist();
}

export async function addToCustomBlacklist(string) {
  if(!string) throw new Error('Invalid Pattern');
  customBlacklist.add(string);
  saveCustomBlacklist();
}

export async function removeFromCustomWhitelist(string) {
  if(!string) throw new Error('Invalid Pattern');
  customWhitelist.delete(string);
  saveCustomWhitelist();
}

export async function removeFromCustomBlacklist(string) {
  if(!string) throw new Error('Invalid Pattern');
  customBlacklist.delete(string);
  saveCustomBlacklist();
}

export function getCustomWhitelist() {
  return Array.from(customWhitelist);
}

export function getCustomBlacklist() {
  return Array.from(customBlacklist);
}

loadData()
    .then(()=> console.log('Data loaded successfully'))
    .catch((err)=> console.error('Failed to load some data', err));