import url from 'url';
import https from 'https';

export default function queryHttp({ serverAddress, requestPacket }) {
  return new Promise((resolve, reject)=> {
    const parsedAddress = url.parse(serverAddress);
    const options = {
      hostname: parsedAddress.hostname,
      port: 443,
      path: parsedAddress.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/dns-udpwireformat',
        'Content-Length': requestPacket.length
      }
    };
    
    const req = https.request(options, (res) => {
      let data = new Buffer(0);
      res.on('data', (d)=> data = Buffer.concat([data, d]));
      res.on('end', ()=> {
        if(res.statusCode === 200) return resolve(data);
        reject(new Error(data.toString('utf-8')));
      });
    });

    req.on('error', (err)=> reject(err));
    req.write(requestPacket);
    req.end();
  });
}