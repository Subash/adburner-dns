const { queryServers, queryServer } = require('../src/query');
const blocker = require('../src/blocker');
const { encode, decode, RECURSION_DESIRED } = require('dns-packet');
const config = require('../src/config');

const packet = encode({
  type: 'query',
  id: 1,
  flags: RECURSION_DESIRED,
  questions: [{ type: 'A', name: 'google.com' }]
});

test('Query HTTP', async ()=> {
  const response = decode(await queryServers(config.httpServers, packet));
  expect(response.answers.length).toBeGreaterThan(0);
});

test('Query HTTP Error', async ()=> {
  await expect(queryServer('https://www.google.com/abcd', packet)).rejects.toEqual(new Error('Not Found'));
});

test('Query UDP', async ()=> {
  const response = decode(await queryServers(config.udpServers, packet));
  expect(response.answers.length).toBeGreaterThan(0);
});

test('Query UDP Error', async ()=> {
  await expect(queryServer('2.4.6.8', packet, { timeout: 100 })).rejects.toEqual(new Error(`Connection to 2.4.6.8 timed out`));
});

test('Query Invalid Server', async ()=> {
  await expect(queryServer()).rejects.toEqual(new Error(`Invalid Remote Server`));
});

test('Multiple Query Errors', async ()=> {
  await expect(queryServers(['2.4.6.8', '2.4.6.8'], packet, { timeout: 100 })).rejects.toEqual(new Error(`Connection to 2.4.6.8 timed out`));
});

test('Resolve HTTP', async ()=> {
  const result = decode(await blocker.resolveQuery(packet));
  expect(result.answers.length).toBeGreaterThan(0);
});

test('Resolve UDP', async ()=> {
  config.useHttp = false;
  const result = decode(await blocker.resolveQuery(packet));
  expect(result.answers.length).toBeGreaterThan(0);
});

test('Resolve Blocked', async ()=> {
  await blocker.loadHosts();
  const request = encode({ type: 'query', id: 1, flags: RECURSION_DESIRED,
    questions: [{ type: 'A', name: 'google-analytics.com' }]
  });
  const result = decode(await blocker.resolveQuery(request));
  expect(result.rcode).toBe('NXDOMAIN');
});

test('Resolve Server Failure', async ()=> {
  config.udpServers = ['2.4.6.8'];
  config.timeout = 100;
  const result = decode(await blocker.resolveQuery(packet));
  expect(result.rcode).toBe('SERVFAIL');
});

test('Test getHosts()', async ()=> {
  await expect(blocker.loadHosts()).resolves;
});

test('Test getHosts() Error', async ()=> {
  config.hostsUrls = ['https://subashpathak.com/404.html'];
  await expect(blocker.loadHosts()).rejects.toEqual(new Error(`Failed to load the hosts file`));
});
