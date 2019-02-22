const dgram = require('dgram');
const config = require('./config.js');
const blocker = require('./blocker');

function startServer() {
  const server = dgram.createSocket('udp4');
  server.on('message', async (packet, rinfo)=> {
    const response = await blocker.resolveQuery(packet); //resolveQuery() never rejects
    server.send(response, 0, response.length, rinfo.port, rinfo.address);
  });

  server.on('listening', ()=> console.log(`Listening on port ${config.port}`));
  server.bind(config.port);
}

//Load blocked hosts then start the server
blocker.loadHosts()
  .then(startServer)
  .catch(err=> {
    console.error(err);
    process.exit(1);
  });