import * as dgram from 'dgram';
import * as isIp from 'is-ip';
import * as isUrl from 'is-url';
import fetch from 'node-fetch';

export async function queryServer(server: string, packet: Buffer, { timeout = 10 * 1000 } = {}): Promise<Buffer> {
	if (isIp(server)) return await exports.queryUdp(server, packet, { timeout });
	if (isUrl(server)) return await exports.queryHttp(server, packet, { timeout });
	throw new Error(`Invalid Remote Server`);
}

export function queryUdp(server: string, packet: Buffer, { timeout }): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const socket = dgram.createSocket('udp4');

		const queryTimeout = setTimeout(() => {
			handleError(new Error(`Connection to ${server} timed out`));
		}, timeout);

		const cleanup = () => {
			socket.removeListener('message', handleSuccess);
			socket.removeListener('error', handleError);
			clearTimeout(queryTimeout);
			socket.close();
		};

		const handleSuccess = (message) => {
			cleanup();
			resolve(message);
		};

		const handleError = (err) => {
			cleanup();
			reject(err);
		};

		socket.on('message', handleSuccess);
		socket.on('error', handleError);
		socket.send(packet, 0, packet.length, 53, server);
	});
}

export async function queryHttp(server: string, packet: Buffer, { timeout }): Promise<Buffer> {
	const res = await fetch(server, {
		method: 'post',
		body: packet,
		timeout: timeout,
		headers: {
			'Content-Type': 'application/dns-udpwireformat',
			'Content-Length': packet.length.toString()
		}
	});
	if (res.status === 200) return await res.buffer();
	throw new Error(res.statusText);
}

export function queryServers(servers: string[], packet: Buffer, { timeout = 10 * 1000 } = {}) {
	return new Promise((resolve, reject) => {
		let errorCount = 0;
		servers.forEach(server => {
			exports.queryServer(server, packet, { timeout })
				.then(result => resolve(result))
				.catch(err => {
					if (++errorCount === servers.length) reject(err); //Throw the last error if all servers fail
				});
		});
	});
}