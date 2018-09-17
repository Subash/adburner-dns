import dgram from 'dgram';
import packet from 'dns-packet';
import queryHttp from './query-http';
import queryUdp from './query-udp';
import config from './config';
import * as blocker from './blocker';
const server = dgram.createSocket('udp4');

async function resolveQuery({ requestPacket, serverAddress }) {
  const decodedRequestPacket = packet.decode(requestPacket);
  const remoteQueryOptions = { serverAddress, requestPacket };
  const queryRemote = config.dnsOverHttps? queryHttp : queryUdp;
  
  //questions is an array but it's almost guaranteed to have only one element
  //https://serverfault.com/q/742785
  const question = decodedRequestPacket.questions[0];

  //Proxy the query if the query is not for A or AAAA record
  if(!['A', 'AAAA'].includes(question.type)) return await queryRemote(remoteQueryOptions);

  //Proxy the query if requested domain is not blocked
  if(!blocker.isBlocked(question.name)) return await queryRemote(remoteQueryOptions);

  console.log(`Blocked ${question.name}`);

  //Respond with NXDOMAIN
  return packet.encode({
    type: 'response',
    id: decodedRequestPacket.id,
    flags: 3, //3 is NXDOMAIN; https://serverfault.com/a/827108
    questions: decodedRequestPacket.questions,
  });
}

async function handleQuery(message, rinfo) {
  let response, request = packet.decode(message);
  
  //questions is an array but it's almost guaranteed to have only one element
  //https://serverfault.com/q/742785
  const question = request.questions[0];
  
  try {
    const remoteAddress = config.dnsOverHttps? config.httpsRemoteAddress: config.udpRemoteAddress;
    response = await resolveQuery({ requestPacket: message, serverAddress: remoteAddress });
  } catch (err) {
    console.log(`Failed to resolve ${question.name} with ${remoteAddress}, Error: ${err.message}`)
  }

  if(!response && config.useFallbackAddress) {
    try {
      const remoteAddressFallback = config.dnsOverHttps ? config.httpsRemoteAddressFallback: config.udpRemoteAddressFallback;
      response = await resolveQuery({ requestPacket: message, serverAddress: remoteAddressFallback });
    } catch (err) {
      console.log(`Failed to resolve ${question.name} with ${remoteAddressFallback}, Error: ${err.message}`)
    }
  }

  if(!response) {
    response = packet.encode({
      type: 'response',
      id: request.id,
      flags: 2, //2 is SERVFAIL; https://serverfault.com/a/827108
      questions: request.questions,
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