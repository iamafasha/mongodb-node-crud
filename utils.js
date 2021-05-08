var fs = require('fs');
var ObjectId = require('mongodb').ObjectId; 
const MongoClient = require('mongodb').MongoClient;

let database
async function run(){
    const url = process.env.DB_URL;
    const dbName = process.env.DB_NAME;
    const client = new MongoClient(url, { useUnifiedTopology: true });
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


function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

async function authenticated(request){
    const session_id = parseCookies(request).blog_auth
    const sessions = database.collection("sessions");
    const session = await sessions.findOne({ _id: (new ObjectId(session_id)) });
    if(await session.authed){
        return true
    }else{
        return false
    }
}

async function login(session, user_id ){
   var sessions = database.collection("sessions");
   const res = await sessions.findOneAndUpdate({ _id: (new ObjectId(session)) }, {$set: { authed: true , user_id }});
   return res.value.user_id  
}

async function logout(session){
    var sessions = database.collection("sessions");
    const res = await sessions.findOneAndUpdate({ _id: (new ObjectId(session)) }, {$set: { authed:false}});
    if(! await res.value.authed ){
        return true
    }else{
        return false
    }  
}

async function get_authenticated_user(session){
    var sessions = database.collection("sessions");
    const res = await sessions.findOne({ _id: (new ObjectId(session)) });
    return await res.user_id
}


function renderHtml(filePath, request , response){
    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT') {
                fs.readFile('./public/404.html', function(error, content) {
                    response.writeHead(404, { 'Content-Type':'text/html' });
                    response.end(content, 'utf-8');
                });
            }
            else {
                response.writeHead(500);
                response.end('File error: '+error.code+' ..\n');
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': 'text/html'});
            response.end(content, 'utf-8');
        }
    });
}


module.exports = {
    renderHtml,
    parseCookies,
    mimeTypes,
    authenticated,
    login,
    logout,
    get_authenticated_user
}