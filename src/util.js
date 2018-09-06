import crypto from 'crypto';

export function md5(string) {
  return crypto.createHash('md5').update(string).digest('hex');
}