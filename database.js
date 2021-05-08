const MongoClient = require('mongodb').MongoClient;

const dbName = process.env.DB_NAME;
const url = process.env.DB_URL;
const client = new MongoClient(url,  { useUnifiedTopology: true } );

async function database(){
  const error = await client.connect();
  return client.db(dbName);
}

module.exports = {
    database, 
    client
};