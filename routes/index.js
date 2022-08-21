const express = require('express');
const bodyParser = require('body-parser');
const pgMiddleware = require('../lib/middleware');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
// CORS bullshit.
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Set up a route home.
app.get('/', pgMiddleware(async (client, req, res, next) => {
  try {
    const results = await client.query(`select * from items_inventory;`);
    res.status(200).send({ rows: results.rows });
  } catch (e) {
    console.log('Error: ', e);
    res.status(418).send('We a teapot fam');
  }
}));

// TODO: Things to note. Are we going to need to pass as a query param
// when the the user tries to edit and individual record? We should see how that is handled
// at SRS, and mimic that model for this project.
app.post('/', pgMiddleware(async (client, req, res, next) => {
  try {
    await client.query('BEGIN;');
    if (req.body) {
      await client.query(`
        INSERT INTO items_inventory
          items_id, description, qty_on_hand, qty_desired, qty_needed
         VALUES
         nextval('items_inventory_item_id_seq'), $1, $2, $3, $4
      `, [req.body.item.description, req.body.item.qty_on_hand, req.body.item.qty_desired, req.body.item.qty_needed]);
      await client.query('COMMIT;');
      res.status(200).send('OK');
    }
  } catch (err) {
    await client.query('ROLLBACK;');
    res.status(500).send(err);
    console.log('err trying to: ',err);
  }
}));

app.post('/update/:items_id', pgMiddleware(async (client, req, res, next) => {
  await client.query('BEGIN;');
  try {
    // TODO: We need a query to update the record.
    // We should only want to do this when we get 
    // a contact_id.
    console.log('we should do some updating here.');
  } catch (e) {
    await client.query('ROLLBACK;');
    res.status(500).send(err);
    console.log('err trying to update: ', err);
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
