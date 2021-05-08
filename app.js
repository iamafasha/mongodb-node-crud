var http = require('http');
var fs = require('fs');
require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId; 

const routes = require('./routes')
const views = require('./views');
const url = require('url');
const { parseCookies } = require('./utils')

let database;
async function run(){
  const url = process.env.DB_URL;
  const dbName = process.env.DB_NAME;
  const client = new MongoClient(url, { useUnifiedTopology: true });
  const error =await client.connect();
  const db = client.db(dbName);
  database = db
}
run()

http.createServer(async function (request, response) {
    //Set Sessions
    const baseURL = 'http://' + request.headers.host + '/';
    const cookies = parseCookies(request);
    const sessions= await database.collection('sessions')
    if(cookies.blog_auth === undefined){
        const result = await sessions.insertOne({});
        response.setHeader('Set-Cookie',`blog_auth=${result.insertedId}`);
    }else{
        const res = await sessions.findOne({_id:(new ObjectId(cookies.blog_auth))})
        if(res === null){
            const result = await sessions.insertOne({});
            response.setHeader('Set-Cookie',`blog_auth=${result.insertedId}`);
        }
    }
    
    //Call view
    const view = eval('views.'+ routes[(new url.URL(request.url, baseURL).pathname)]);
    if(view !== undefined){
        view(request , response)
    }else{
        //route not defined go to 404 page
        fs.readFile('./public/404.html', function(error, content) {
            response.writeHead(404, { 'Content-Type':'text/html' });
            response.end(content, 'utf-8');
        });
    }
}).listen(8125);
console.log('Server running at http://127.0.0.1:8125/');