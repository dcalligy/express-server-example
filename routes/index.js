const express = require('express');
const bodyParser = require('body-parser');
const pgMiddleware = require('../lib/middleware');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));

// Set up a route home.
app.get('/', pgMiddleware(async (client, req, res, next) => {
  try {
    const results = await client.query(`select * from company;`);
    res.send({ rows: results.rows });
  } catch (e) {
    console.log('Error: ', e);
  }
}));

app.post('/', pgMiddleware(async (client, req, res, next) => {
  try {
    // TODO: We would have to see what gets sent to us in the body.
    // Create a params array, query to insert the new items.
    // Send back something to the client to let them know that everything is okay.
    // COMMIT our changes.
    console.log('some place holder for now');
  } catch (err) {
    await client.query('ROLLBACK;');
    res.status(500).send(err);
    console.log('err: ',err);
  }
}));

// TODO: What other endpoints will we need?
// - A post to insert new items
// - A delete tor remove items
// - A search for items?
// This is something we would have to sit down with Christy and map out before we can continue on.

app.listen(port, () => {
  console.log('Connected to port: ', port);
});
