export default function (handler) {
  return function wrapAsyncMiddleWare(req, res, next) {
    handler(req, res, next).catch(next);
  }
}