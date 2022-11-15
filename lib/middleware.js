const pool = require('./pgPool');

const pgMiddleware = (handler) => {
  return async (req, res, next) => {
    try {
      const client = await pool.connect();
      try {
        await handler(client, req, res, next);
      } finally {
        client.release();
      }
    } catch (e) {
      console.log('e: ', e);
      next(e);
    }
  }
}

module.exports = pgMiddleware;
