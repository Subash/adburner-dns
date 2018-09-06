import express from 'express';
import * as stats from './stats';
import * as blocker from './blocker';
import config from './config';
import wrapAsync from './wrap-async-middleware';

const router = new express.Router();

router.get('/stats', wrapAsync(async (req, res, next)=> {
  res.apiSuccess(stats.get());
}));

router.get('/blocker/status', wrapAsync(async (req, res, next)=> {
  res.apiSuccess({ paused: config.pauseBlocker });
}));

router.post('/blocker/toggle', wrapAsync(async (req, res, next)=> {
  config.set('pauseBlocker', !config.pauseBlocker);
  res.apiSuccess({ paused: config.pauseBlocker });
}));

router.post('/blocker/enable', wrapAsync(async (req, res, next)=> {
  config.set('pauseBlocker', false);
  res.apiSuccess({ paused: config.pauseBlocker });
}));

router.post('/blocker/disable', wrapAsync(async (req, res, next)=> {
  config.set('pauseBlocker', true);
  res.apiSuccess({ paused: config.pauseBlocker });
}));

router.get('/whitelist', wrapAsync(async (req, res, next)=> {
  res.apiSuccess(blocker.getCustomWhitelist());
}));

router.post('/whitelist', wrapAsync(async (req, res, next)=> {
  const domain = req.getBodyItemString('domain');
  await blocker.addToCustomWhitelist(domain);
  res.apiSuccess(blocker.getCustomWhitelist());
}));

router.delete('/whitelist', wrapAsync(async (req, res, next)=> {
  const domain = req.getBodyItemString('domain');
  await blocker.removeFromCustomWhitelist(domain);
  res.apiSuccess(blocker.getCustomWhitelist());
}));

router.get('/blacklist', wrapAsync(async (req, res, next)=> {
  res.apiSuccess(blocker.getCustomBlacklist());
}));

router.post('/blacklist', wrapAsync(async (req, res, next)=> {
  const domain = req.getBodyItemString('domain');
  await blocker.addToCustomBlacklist(domain);
  res.apiSuccess(blocker.getCustomBlacklist());
}));

router.delete('/blacklist', wrapAsync(async (req, res, next)=> {
  const domain = req.getBodyItemString('domain');
  await blocker.removeFromCustomBlacklist(domain);
  res.apiSuccess(blocker.getCustomBlacklist());
}));

export default router;