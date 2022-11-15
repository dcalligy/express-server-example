const express = require('express');
const bodyParser = require('body-parser');
const pgMiddleware = require('../lib/middleware');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

// CORS bullshit.
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// TODO: We should add all of the fields to the return object.
// That way we can update the record with the correct data.
// We also need to edit our query to update the record appropriately.
// I currently don't think that our query is the correct approach to update it.
async function checkExist(client, body) {
  let return_obj = {
    found: false,
  };
  const sql = await client.query(
    `SELECT * FROM items_inventory WHERE description = $1`
  ,[body.description]);
  if (sql && sql.rows.length == 1) {
    return_obj = {
      item_id: sql.rows[0].items_id,
      found: true,
    }
    console.log('return_obj: ', return_obj);
  }
  return return_obj;
}

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

app.post('/add', pgMiddleware(async (client, req, res, next) => {
  try {
    await client.query('BEGIN;');
    const check_exist = await checkExist(client, req.body);
    if (check_exist.found) {
      // I am not sure why this does not work...
      console.log('req.body: ', req.body);
      console.log('typeof: ', typeof check_exist.item_id);
      const sql = await client.query(`
        UPDATE items_inventory
          SET description = $1,
              qty_on_hand = $2,
              qty_desired = $3,
              qty_needed = $4
        WHERE items_id = $5
      `[req.body.description,
        req.body.qty_on_hand,
        req.body.qty_desired,
        req.body.qty_needed,
        check_exist.item_id
      ]);
      console.log('sql: ', sql);
    } else {
      console.log('we are in the else block');
      await client.query(`
        INSERT INTO items_inventory
          (items_id, description, qty_on_hand, qty_desired, qty_needed)
        VALUES
        (nextval('items_inventory_items_id_seq'), $1, $2, $3, $4)
      `, [req.body.description, req.body.qty_on_hand, req.body.qty_desired, req.body.qty_needed]);
    }
    await client.query('COMMIT;');
    res.status(200).send('OK');
  } catch (err) {
    await client.query('ROLLBACK;');
    res.status(500).send(err);
    console.log('err trying to: ',err);
  }
}));

app.post('/update/:items_id', pgMiddleware(async (client, req, res, next) => {
  await client.query('BEGIN;');
  try {
    if (Object.keys(req.body).length > 0) {
      const rows = client.query(`
        UPDATE items_inventory SET
          description = $1,
          qty_on_hand = $2,
          qty_desired = $3,
          qty_needed = $4
         WHERE items_id = $5;
      `, [req.body.description, req.body.qty_on_hand, req.body.qty_desired, req.body.qty_needed, parseInt(req.params.items_id)]);
      await client.query('COMMIT;');
      res.status(200).send({ results: rows });
    } else {
      await client.query('ROLLBACK;')
      throw new Error('Unexpected update size.');
    }
  } catch (e) {
    await client.query('ROLLBACK;');
    console.log('err: ', e);
    res.status(418).send(e);
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
