import dgram from 'dgram';
import packet from 'dns-packet';
import queryHttp from './query-http';
import queryUdp from './query-udp';
import config from './config';
import * as blocker from './blocker';
import * as stats from './stats';
const server = dgram.createSocket('udp4');

async function resolveQuery(requestPacket) {
  stats.incrementDnsQueryCount();
  const queryRemote = config.useDoh ? queryHttp : queryUdp;
  
  const decodedRequestPacket = packet.decode(requestPacket);
  const remoteQueryOptions = { serverAddress: config.remoteAddress, requestPacket };

  //Proxy the query if the blocker is paused
  if(config.pauseBlocker) return await queryRemote(remoteQueryOptions);
  
  //questions is an array but it's almost guaranteed to have only one element
  //https://serverfault.com/q/742785
  const question = decodedRequestPacket.questions[0];

  //Proxy the query if the query is not for A or AAAA record
  if(!['A', 'AAAA'].includes(question.type)) return await queryRemote(remoteQueryOptions);

  //Proxy the query if requested domain is not blocked
  if(!blocker.isBlocked(question.name)) return await queryRemote(remoteQueryOptions);

  stats.incrementDnsBlockCount();  

  //Respond with NXDOMAIN
  return packet.encode({
    type: 'response',
    id: decodedRequestPacket.id,
    flags: 3, //3 is NXDOMAIN; https://serverfault.com/a/827108
    questions: decodedRequestPacket.questions,
  });
}

async function handleQuery(message, rinfo) {
  let response;
  try {
    response = await resolveQuery(message);
  } catch (err) {
    console.error(err);
    stats.incrementDnsErrorCount();
  }

  if(!response) {
    const req = packet.decode(message);
    response = packet.encode({
      type: 'response',
      id: req.id,
      flags: 2, //2 is SERVFAIL; https://serverfault.com/a/827108
      questions: req.questions,
    });
  }
  
  server.send(response, 0, response.length, rinfo.port, rinfo.address);
}

function handleListen() {
  const address = server.address();
  console.log(`server listening on port ${address.port}`);
}

function startListening() {
  server.on('message', handleQuery);
  server.on('listening', handleListen);
  server.bind(53);
}

startListening();