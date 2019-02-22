const path = require('path');

const env = Object.assign({}, {
  PORT: 53,
  DNS_OVER_HTTPS: true,
  HTTPS_REMOTE_ADDRESS: 'https://cloudflare-dns.com/dns-query,https://dns.google.com/experimental',
  UDP_REMOTE_ADDRESS: '1.1.1.1,8.8.8.8',
  BLOCKED_HOSTS_URL: 'https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts',
}, process.env); //Merge process.env and defaults

module.exports = {
  useHttp: env.DNS_OVER_HTTPS == 'true', //Can be a string
  httpServers: env.HTTPS_REMOTE_ADDRESS.split(',').map( item=> item.trim()), //Split comma separated lists
  udpServers: env.UDP_REMOTE_ADDRESS.split(',').map( item=> item.trim()), //Split comma separated lists
  hostsUrl: env.BLOCKED_HOSTS_URL,
  timeout: 10 * 1000, // 10 Seconds
  cacheDir: path.resolve(__dirname, '../data'),
  port: Number.parseInt(env.PORT, 10)
};