const path = require('path');

const env = Object.assign({}, {
  PORT: 53,
  DNS_OVER_HTTPS: `true`, //process.env items are strings
  HTTPS_REMOTE_ADDRESS: `https://cloudflare-dns.com/dns-query,https://dns.google.com/experimental`,
  UDP_REMOTE_ADDRESS: `1.1.1.1,8.8.8.8`,
  BLOCKED_HOSTS_URL: `https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts`,
}, process.env); //Create new env by merging process.env and default values

module.exports = {
  useHttp: env.DNS_OVER_HTTPS == 'true',
  httpServers: env.HTTPS_REMOTE_ADDRESS.split(',').map( item=> item.trim()), //Allow comma separated list
  udpServers: env.UDP_REMOTE_ADDRESS.split(',').map( item=> item.trim()), //Allow comma separated list
  hostsUrl: env.BLOCKED_HOSTS_URL,
  timeout: 10 * 1000, // 10 Seconds
  cacheDir: path.resolve(__dirname, '../data'),
  port: Number.parseInt(env.PORT, 10)
};