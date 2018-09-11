import path from 'path';

const config = {
  dnsOverHttps: process.env.DNS_OVER_HTTPS == 'true',
  httpsRemoteAddress: process.env.HTTPS_REMOTE_ADDRESS || 'https://cloudflare-dns.com/dns-query',
  udpRemoteAddress: process.env.UDP_REMOTE_ADDRESS || '1.1.1.1',
  blockedHostsUrl: process.env.BLOCKED_HOSTS_URL || 'https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts',
  blockedHosts: path.resolve(__dirname, '../data/hosts.txt'),
  blackList: path.resolve(__dirname, '../data/blacklist.txt'),
  whiteList: path.resolve(__dirname, '../data/whitelist.txt')
};

export default config;