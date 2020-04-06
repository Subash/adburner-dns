const path = require('path');
const split = str=> str.split(',').map( item=> item.trim())

const env = Object.assign({}, {
  PORT: 53,
  DNS_OVER_HTTPS: 'true',
  UDP_REMOTE_ADDRESS: '1.1.1.1,8.8.8.8',
  HTTPS_REMOTE_ADDRESS: 'https://cloudflare-dns.com/dns-query,https://dns.google/dns-query',
  BLOCKED_HOSTS_URL: 'https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts',
}, process.env); // merge process.env and defaults

module.exports = {
  timeout: 10 * 1000, // 10 Seconds
  port: Number.parseInt(env.PORT, 10),
  hostsUrls: split(env.BLOCKED_HOSTS_URL),
  useHttp: env.DNS_OVER_HTTPS == 'true', // convert string to boolean
  udpServers: split(env.UDP_REMOTE_ADDRESS),
  httpServers: split(env.HTTPS_REMOTE_ADDRESS),
  cacheDir: path.resolve(__dirname, '../data'),
};
