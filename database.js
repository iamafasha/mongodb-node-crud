const MongoClient = require('mongodb').MongoClient;

async function run(){
  const url = process.env.DB_URL;
  const dbName = process.env.DB_NAME;
  const client = new MongoClient(url);
  const error =await client.connect();
  const db = client.db(dbName);
  return db;
}

exports.database = run();