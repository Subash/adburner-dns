const fetch = require('node-fetch');
const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const config = require('./config.js');
const minimatch = require('minimatch');
const { encode, decode } = require('dns-packet');
const { queryServers } = require('./query');
let hosts = [];

function md5(string) {
  return crypto.createHash('md5').update(string).digest('hex')
}

async function download(url) {
  const res = await fetch(url);
  if(res.status !== 200) throw new Error(res.statusText);
  return await res.buffer();
}

function parseHosts(data) {
  return data.split('\n')
    .map( line => line.trim())
    .filter( line => !line.startsWith('#')) // remove comments
    .filter( line => line.startsWith('0.0.0.0')) // pick the blocked hosts
    .map( line => line.split(' ')[1]) // keep just the hostname
    .map( line => line.trim());
}

function isBlocked(domain) {
  if(hosts.includes(domain)) return true;
  return hosts.some(host=> host.includes('*') && minimatch(domain, host));
}

async function _loadHosts(hostsUrl) {
  const cacheFile = path.join(config.cacheDir, md5(hostsUrl));
  let data = await download(hostsUrl).catch(()=>{});
  if(data) await fs.outputFile(cacheFile, data); // write the cache file if download succeeds
  if(!data) data = await fs.readFile(cacheFile).catch(()=>{});  // fallback to cache if download fails
  if(!data) throw new Error(`Failed to load the hosts file`); // throw an error if both download and cache fail
  hosts = hosts.concat(parseHosts(data.toString('utf-8')));
}

module.exports.loadHosts = async function loadHosts() {
  await Promise.all(config.hostsUrls.map(hostsUrl=> _loadHosts(hostsUrl)));
}

module.exports.resolveQuery = function resolveQuery(packet) {
  return new Promise((resolve)=> {
    const servers = config.useHttp? config.httpServers: config.udpServers;
    const request = decode(packet);

    // questions is an array but it's almost guaranteed to have only one element
    // https://serverfault.com/q/742785
    const question = request.questions[0];

    // resolve with NXDOMAIN if the domain is blocked
    if(['A', 'AAAA'].includes(question.type) && isBlocked(question.name)) {
      console.log(`Blocked ${question.name}`);
      return resolve(encode({ type: 'response', id: request.id, flags: 3, questions: request.questions })); // flag 3 is NXDOMAIN; https://serverfault.com/a/827108
    }

    // query remote servers. Resolve with SERVFAIL on error
    queryServers(servers, packet, { timeout: config.timeout })
      .then(resolve)
      .catch((err)=> {
        console.log(err.message);
        resolve(encode({ type: 'response', id: request.id, flags: 2, questions: request.questions })); // flag 2 is SERVFAIL; https://serverfault.com/a/827108
      });
  });
}
