import dgram from 'dgram';
const REMOTE_QUERY_TIMEOUT = 10 * 1000; // 10 Seconds

export default function queryDoh({ serverAddress, requestPacket }) {
  return new Promise((resolve, reject)=> {
    const socket = dgram.createSocket('udp4');
    
    const queryTimeout = setTimeout(()=> {
      handleError(new Error('Connection timed out'));
    }, REMOTE_QUERY_TIMEOUT);

    const cleanup = ()=> {
      socket.removeListener('message', handleMessage);
      socket.removeListener('error', handleError);
      clearTimeout(queryTimeout);
      socket.close();
    };

    const handleMessage = (message)=> {
      cleanup();
      resolve(message);
    };

    const handleError = (err)=> {
      cleanup();
      reject(err);
    };

    socket.on('message', handleMessage);
    socket.on('error', handleError);

    socket.send(requestPacket, 0, requestPacket.length, 53, serverAddress);
  });
}