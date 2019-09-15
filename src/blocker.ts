import config from './config';
import { queryServers } from './query';
import * as crypto from 'crypto';
import {
	decode,
	encode
	} from 'dns-packet';
import * as fs from 'fs-extra';
import * as minimatch from 'minimatch';
import fetch from 'node-fetch';
import * as path from 'path';

let hosts = [];

function md5(string: string): string {
	return crypto.createHash('md5').update(string).digest('hex')
}

async function download(url: string): Promise<Buffer> {
	const res = await fetch(url);
	if (res.status !== 200) throw new Error(res.statusText);
	return await res.buffer();
}

function parseHosts(data: string): string[] {
	return data.split('\n')
		.map(line => line.trim())
		.filter(line => !line.startsWith('#')) //Remove comments
		.filter(line => line.startsWith('0.0.0.0')) //Pick the blocked hosts
		.map(line => line.split(' ')[1]) //Keep just the hostname
		.map(line => line.trim());
}

function isBlocked(domain): boolean {
	if (hosts.includes(domain)) return true;
	return hosts.some(host => host.includes('*') && minimatch(domain, host));
}

export async function loadHosts(): Promise<void> {
	const cacheFile = path.join(config.cacheDir, md5(config.hostsUrl));
	let data = await download(config.hostsUrl).catch(() => { });

	//Write the cache file
	if (data) await fs.outputFile(cacheFile, data);

	//Fallback to cache only when fresh download fails
	if (!data) data = await fs.readFile(cacheFile, data).catch(() => { });

	//Throw error if both download and cache fails
	if (!data) throw new Error(`Failed to load the hosts file`);

	//Save parsed hosts
	hosts = parseHosts(data.toString('utf-8'));
}

export function resolveQuery(packet: Buffer): Promise<Uint8Array> {
	return new Promise((resolve) => {
		const servers = config.useHttp ? config.httpServers : config.udpServers;
		const request = decode(packet);

		//questions is an array but it's almost guaranteed to have only one element
		//https://serverfault.com/q/742785
		const question = request.questions[0];

		//Resolve with NXDOMAIN if the domain is blocked
		if (['A', 'AAAA'].includes(question.type) && isBlocked(question.name)) {
			console.log(`Blocked ${question.name}`);
			return resolve(encode({ type: 'response', id: request.id, flags: 3, questions: request.questions })); //Flag 3 is NXDOMAIN; https://serverfault.com/a/827108
		}

		//Query remote servers. Resolve with SERVFAIL on error
		queryServers(servers, packet, { timeout: config.timeout })
			.then(resolve)
			.catch((err) => {
				console.log(err.message);
				resolve(encode({ type: 'response', id: request.id, flags: 2, questions: request.questions })); //Flag 2 is SERVFAIL; https://serverfault.com/a/827108
			});
	});
}