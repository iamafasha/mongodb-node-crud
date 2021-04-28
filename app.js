var http = require('http');
var fs = require('fs');
var path = require('path');
require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;
let database;

async function run(){
  const url = process.env.DB_URL;
  const dbName = process.env.DB_NAME;
  const client = new MongoClient(url);
  const error =await client.connect();
  const db = client.db(dbName);
  database = db
}
run()

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

http.createServer(function (request, response) {
    if(request.url.startsWith('/api')){
        response.writeHead(200, { 'Content-Type': 'text/html' });
        database.collection('users').find().toArray().then(res=>console.log(res));
        response.write('Hello World!');
        response.end();

    }else{

        var filePath = './public' + request.url;
        if (filePath == './public/') {
            console.log('request ', filePath);
            filePath = './public/index.html';
        }

        var extname = String(path.extname(filePath)).toLowerCase();
        var contentType = mimeTypes[extname] || 'application/octet-stream';

        fs.readFile(filePath, function(error, content) {
            if (error) {
                if(error.code == 'ENOENT') {
                    fs.readFile('./public/404.html', function(error, content) {
                        response.writeHead(404, { 'Content-Type': 'text/html' });
                        response.end(content, 'utf-8');
                    });
                }
                else {
                    response.writeHead(500);
                    response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                }
            }
            else {
                response.writeHead(200, { 'Content-Type': contentType });
                response.end(content, 'utf-8');
            }
        });
    }
}).listen(8125);


console.log('Server running at http://127.0.0.1:8125/');