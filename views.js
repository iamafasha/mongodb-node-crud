const {  parse } = require('querystring');
var ObjectId = require('mongodb').ObjectId; 
const { renderHtml, authenticated, login: signin, parseCookies , logout:signout, get_authenticated_user } = require('./utils')
const MongoClient = require('mongodb').MongoClient;
const url = require('url');
let database;

async function run() {
    const url = process.env.DB_URL;
    const dbName = process.env.DB_NAME;
    const client = new MongoClient(url, {
        useUnifiedTopology: true
    });
    const error = await client.connect();
    const db = client.db(dbName);
    database = db
}
run()


async function home(request, response) {
    if (await authenticated(request)) {
        renderHtml('./public/index.html', request, response)
    } else {
        response.writeHead(302, {
            'Location': '/login.html'
        });
        response.end();
    }
}

async function edit_post(request, response) {
    if (await authenticated(request)) {
        renderHtml('./public/edit-post.html', request, response)
    } else {
        response.writeHead(302, {
            'Location': '/login.html'
        });
        response.end();
    }
}

async function add_post(request, response) {
    if (await authenticated(request)) {
        renderHtml('./public/add-post.html', request, response)
    } else {
        response.writeHead(302, {
            'Location': '/login.html'
        });
        response.end();
    }
}

async function login(request, response) {
    renderHtml('./public/login.html', request, response)
}

async function on_login(request, response) {
        let body = '';
        request.on('data', chunk => {
            body += chunk.toString();
        });
        request.on('end', () => {
            if (request.method === 'POST') {
            const users = database.collection("users");
            body = parse(body)
            const email = body.email
            users.findOne({
                email: email
            }).then( async res => {
                if (res !== null && body.password === res.password) {
                    const user_id = await signin(parseCookies(request).blog_auth, res._id)
                    response.writeHead(302, {
                        'Location': `/`
                    });
                    response.end();

                }else{
                    response.writeHead(302, {
                        'Location': `/login.html?error=user_error`
                    });
                    response.end();  
                }
            })
        }else if (request.method === 'GET') {
            response.writeHead(302, {
                'Location': `/login.html?error=bad_request`
            });
            response.end();
        }
        });
   
}

async function register(request, response) {
    if (request.method === 'POST') {
        let body = '';
        request.on('data', chunk => {
            body += chunk.toString();
        });
        request.on('end', () => {
            const users = database.collection("users");
            body = parse(body)
            const email = body.email
            users.findOne({
                email: email
            }).then(res => {
                if (res === null) {
                    console.log("adding user");
                    users.insertOne({
                        name: body.name,
                        email,
                        password: body.password
                    })

                    response.writeHead(302, {
                        'Location': `/login.html?success=account_created&email=${email}`
                    });
                    response.end();

                } else {
                    console.log("user exists");
                    response.writeHead(302, {
                        'Location': '/register.html?errors=email_exists'
                    });
                    response.end();
                }
            })

            //Check if user exists
            //If don't exists add to database
            //If exists redirect to registration page with email exists error
            //other wise redirect to login page for user to login with a success message
        });
    } else {
        renderHtml('./public/register.html', request, response)
    }
}

async function logout(request, response) {
    response.writeHead(302, {
        'Location': '/login.html?success=logged_out'
    });
    response.end();
}

async function post_add_post(request, response){
    if (await request.method === 'POST') {
        let body = '';
        request.on('data', chunk => {
            body += chunk.toString();
        });
        request.on('end', async () => {
            body = parse(body)
            const user_id = await get_authenticated_user(parseCookies(request).blog_auth)
            console.log(body);
            const blogs = database.collection("blogs");
            const result = await blogs.insertOne({
                text:body.post,
                user_id: new ObjectId(user_id),
                created_at:Date.now()
            });
            if(result){
                response.writeHead(302, {
                    'Location': `/?sucess=post_added`
                });
                response.end();
            }
        });
    }else{
        response.writeHead(302, {
            'Location': `/add-post.html?error=bad_request`
        });
        response.end();
    }
}


async function posts (request , response){
    if (await authenticated(request)) {
        const user_id = await get_authenticated_user(parseCookies(request).blog_auth)
        const posts = await database.collection('blogs').find().sort({$natural:-1}).toArray()
        let new_posts =[];
        // await posts.forEach( post => {
        //     database.collection('users').findOne({_id:post.user_id}).then(function (user){
        //     console.log(user);
        //     new_posts.push({user_name:user.name})
        // })
        // });

        for (let index = 0; index < posts.length; index++) {
           const user = await database.collection('users').findOne({_id:posts[index].user_id})
           new_posts.push({...posts[index], user_name:user.name})
        }

        console.log("waiting");
        const data = JSON.stringify({user_id, posts:new_posts})
        response.statusCode = 200;
        response.writeHead(200, { 'Content-Type':'application/json' });
        response.end(data);
    }
}

async function post_edit_post (request, response ){
    if (await authenticated(request)) {
        if (await request.method === 'POST') {
            let body = '';
            request.on('data', chunk => {
                body += chunk.toString();
            });
            request.on('end', async () => {
                body = parse(body)
                const result = await database.collection('blogs').findOneAndUpdate({ _id: (new ObjectId(body.post_id)) }, {$set: { text:(body.post)}});
                if(result){
                    response.writeHead(302, {
                        'Location': `/?sucess=post_edited`
                    });
                    response.end();
                }
            });
        }else{
            response.writeHead(302, {
                'Location': `/?post_id=&error=bad_request`
            });
            response.end();
        }
    }
}


async function delete_post(request, response){
    if (await authenticated(request)) {
        const post_id = url.parse(request.url,true).query.post_id;
        const blogs = database.collection("blogs");
        const result = blogs.deleteOne({_id: new ObjectId(post_id)});
        response.writeHead(302, {
            'Location': `/`
        });
        response.end();
    }
}

module.exports = {
    login,
    register,
    logout,
    home,
    add_post,
    edit_post,
    post_edit_post,
    on_login,
    post_add_post,
    posts,
    delete_post
}