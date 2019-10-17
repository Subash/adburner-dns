const fetch = require('node-fetch');
const dgram = require('dgram');
const isIp = require('is-ip');
const isUrl = require('is-url');

exports.queryHttp = async function queryHttp(server, packet, { timeout }) {
  const res = await fetch(server, {
    method: 'post',
    body: packet,
    timeout: timeout,
    headers: {
      'Content-Type': 'application/dns-udpwireformat',
      'Content-Length': packet.length
    }
  });
  if(res.status === 200) return await res.buffer();
  throw new Error(res.statusText);
}

exports.queryUdp = function queryUdp(server, packet, { timeout }) {
  return new Promise((resolve, reject)=> {
    const socket = dgram.createSocket('udp4');

    const queryTimeout = setTimeout(()=> {
      handleError(new Error(`Connection to ${server} timed out`));
    }, timeout);

    const cleanup = ()=> {
      socket.removeListener('message', handleSuccess);
      socket.removeListener('error', handleError);
      clearTimeout(queryTimeout);
      socket.close();
    };

    const handleSuccess = (message)=> {
      cleanup();
      resolve(message);
    };

    const handleError = (err)=> {
      cleanup();
      reject(err);
    };

    socket.on('message', handleSuccess);
    socket.on('error', handleError);
    socket.send(packet, 0, packet.length, 53, server);
  });
}

exports.queryServer = async function queryServer(server, packet, { timeout = 10 * 1000 } = {}) {
  if(isIp(server)) return await exports.queryUdp(server, packet, { timeout });
  if(isUrl(server)) return await exports.queryHttp(server, packet,{ timeout });
  throw new Error(`Invalid Remote Server`);
}

// query all servers then pick whichever resolves first
exports.queryServers = function queryServers(servers, packet, { timeout = 10 * 1000 } = {}) {
  return new Promise((resolve, reject)=> {
    let errorCount = 0;
    servers.forEach(server=> {
      exports.queryServer(server, packet, { timeout })
        .then(result=> resolve(result))
        .catch(err=> {
          if(++errorCount === servers.length) reject(err); // throw the last error if all servers fail
        });
    });
  });
}
