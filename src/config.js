import path from 'path';
import ip from 'ip';
import fs from 'fs-extra';
const writeableConfigProperties = [ 'pauseBlocker' ];
const useDoh = process.env.USE_DOH === 'true';
const defaultRemoteAddress = useDoh ? 'https://cloudflare-dns.com/dns-query': '1.1.1.1';
const defaultBlacklistHostUrls = 'https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts';

const config = {
  useDoh,
  pauseBlocker: false,
  serverIp: process.env.SERVER_IP || ip.address(null, 'ipv4'),
  serverIpv6: process.env.SERVER_IPV6 || ip.address(null, 'ipv6'),
  httpPort: process.env.HTTP_PORT || 80,
  remoteAddress: process.env.REMOTE_ADDRESS || defaultRemoteAddress,
  blockedHostTTL: 300,
  dataDir: path.resolve(__dirname, '../data'),
  customWhitelistFilePath: path.resolve(__dirname, '../data', 'whitelist.json'),
  customBlacklistFilePath: path.resolve(__dirname, '../data', 'blacklist.json'),
  configFilePath: path.resolve(__dirname, '../data', 'config.json'),
  hostsCacheDir: path.resolve(__dirname, '../data/cache'),
  blacklistHostUrls: (process.env.BLACKLIST_HOST_URLS || defaultBlacklistHostUrls).split(',').map( url=> url.trim())
};

config.set = (key, value)=> {
  if(!writeableConfigProperties.includes(key)) throw new Error(`Property '${key}' is not settable`);
  config[key] = value;
  saveConfig();
};

//Saved keys
async function saveConfig() {
  try {
    const dataToSave = {};
    writeableConfigProperties.forEach( key => dataToSave[key] = config[key]);
    await fs.outputJson(config.configFilePath, dataToSave, { spaces: 2 });
  } catch(err) {
    console.error('Failed to save configuration', err);
  }
}

async function loadConfig() {
  try {
    const data = await fs.readJson(config.configFilePath);
    writeableConfigProperties.forEach( key => config[key] = data[key]);
    console.log(`Loaded ${filePath}`);
  } catch (err) {}
}

loadConfig()
    .then(()=> console.log('Config loaded successfully'))
    .catch((err)=> console.error('Failed to load config data', err));

export default config;