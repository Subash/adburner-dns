import express from 'express';
import bodyParser from 'body-parser';
import api from './api';
import middlewares from './middlewares';
import config from './config';
const app = express();

app.use('/api', bodyParser.urlencoded({ extended: true }));
app.use('/api', middlewares);
app.use('/api', api);
app.use((req, res, next)=> {
  res.status(404).end('Adburner DNS');
});
app.listen(config.httpPort);

console.log(`Listening on port ${config.httpPort}`);
