import * as path from 'path';

export interface IConfiguration {
	useHttp: boolean;
	httpServers: string[];
	udpServers: string[];
	hostsUrl: string;
	timeout: number;
	cacheDir: string;
	port: number;
};

const env = Object.assign({}, {
	PORT: '53', // env values are all string. In order to be compatible, we must assign a string
	DNS_OVER_HTTPS: 'true', // env values are all string. In order to be compatible, we must assign a string
	HTTPS_REMOTE_ADDRESS: 'https://cloudflare-dns.com/dns-query,https://dns.google.com/experimental',
	UDP_REMOTE_ADDRESS: '1.1.1.1,8.8.8.8',
	BLOCKED_HOSTS_URL: 'https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts',
}, process.env); //Merge process.env and defaults

const configuration: IConfiguration = {
	useHttp: env.DNS_OVER_HTTPS == 'true', //Can be a string
	httpServers: env.HTTPS_REMOTE_ADDRESS.split(',').map(item => item.trim()), //Split comma separated lists
	udpServers: env.UDP_REMOTE_ADDRESS.split(',').map(item => item.trim()), //Split comma separated lists
	hostsUrl: env.BLOCKED_HOSTS_URL,
	timeout: 10 * 1000, // 10 Seconds
	cacheDir: path.resolve(__dirname, '../data'),
	port: Number.parseInt(env.PORT, 10)
};

export default configuration;
