//sets up authentication system using express-basic-auth and custom middleware in Node.js app. Also defines several endpoints for user auth, user registration, and logout
const express = require("express"),
       app = express(),
       port = process.env.PORT || 8080,
       cors = require("cors");
const bodyParser = require('body-parser');
const fsPromises = require("fs").promises;
//const fs = require("fs");
const todoDBName = "tododb";
const useCloudant = true;


const basicAuth = require("express-basic-auth"); //import module for for basic authentication
var { authenticator, upsertUser, cookieAuth } = require("./authentication"); // import authenticator, upsertUser, and cookieAuth functions from authentication.js
const auth = basicAuth({ //auth var is assigned to basicAuth middleware, which is used to make endpoints authenticated
    authorizer: authenticator
});
const cookieParser = require("cookie-parser");
app.use(cookieParser("82e4e438a0705fabf61f9854e3b575af"));



//Init code for Cloudant
const {CloudantV1} = require('@ibm-cloud/cloudant');
if (useCloudant)
{
    initDB();
}


//app.use(cors());


app.use(bodyParser.json({ extended: true }));

app.listen(port, () => console.log("Backend server live on " + port));



app.get("/", (request, response) => {
    response.send({ message: "Connected to Backend server!" });
});

//add new item to json file
app.post("/add/item",cookieAuth, addItem) //add cookieAuth middleware to the endpoints to make them authenticated

async function addItem (request, response) {
    try {
        // Converting Javascript object (Task Item) to a JSON string
        const id = request.body.jsonObject.id
        const task = request.body.jsonObject.task
        const curDate = request.body.jsonObject.currentDate
        const dueDate = request.body.jsonObject.dueDate
        const newTask = {
          ID: id,
          Task: task,
          Current_date: curDate,
          Due_date: dueDate
        }
        
        if (useCloudant) {
            //begin here for cloudant
            //const todoDocID = id;

            // Setting `_id` for the document is optional when "postDocument" function is used for CREATE.
            // When `_id` is not provided the server will generate one for your document.
            const todoDocument = { _id: id.stringify };
          
            // Add "name" and "joined" fields to the document
            todoDocument['task'] = task;
            todoDocument.curDate = curDate;
            todoDocument.dueDate = dueDate;
          
            // Save the document in the database with "postDocument" function
            const client = CloudantV1.newInstance({});
            console.log('Writing to: ', todoDBName)
            const createDocumentResponse = await client.postDocument({
              db: todoDBName,
              document: todoDocument,
            });
            console.log('Successfully wrote to cloudant DB');
        } else {
            //original write to local file
            const data = await fsPromises.readFile("database.json");
            const json = JSON.parse(data);
            json.push(newTask);
            await fsPromises.writeFile("database.json", JSON.stringify(json))
            console.log('Successfully wrote to file') 
        }
        response.sendStatus(200)
    } catch (err) {
        console.log("error: ", err)
        response.sendStatus(500)
    }
}

//** week 6, get all items from the json database*/
app.get("/get/items",cookieAuth, getItems)
async function getItems (request, response) {
    //begin here

    //begin cloudant here
    if (useCloudant) {
    //add for cloudant client
    const client = CloudantV1.newInstance({});
    var listofdocs;
    await client.postAllDocs({
        db: todoDBName,
        includeDocs: true
    }).then(response => {
        listofdocs=response.result;
        });
    response.json(JSON.stringify(listofdocs));
    }
    else {
    //for non-cloudant use-case
    var data = await fsPromises.readFile("database.json");
    response.json(JSON.parse(data));
    }

};

//** week 6, search items service */
app.get("/get/searchitem",cookieAuth, searchItems) 
async function searchItems (request, response) {
    //begin here
    var searchField = request.query.taskname;

    if (useCloudant){
        const client = CloudantV1.newInstance({});
        var search_results
        await client.postSearch({
            db: todoDBName,
            ddoc: 'newdesign',
            query: 'task:'+searchField,
            index: 'newSearch'
          }).then(response => {
            search_results=response.result;
            console.log(response.result);
          });
        console.log(search_results);
        response.json(JSON.stringify(search_results));
        
    }
    else {
    var json = JSON.parse (await fsPromises.readFile("database.json"));
    var returnData = json.filter(jsondata => jsondata.Task === searchField);
    response.json(returnData);
    }
};


// Add initDB function here
async function initDB ()
{
    //TODO --- Insert to create DB
    //See example at https://www.npmjs.com/package/@ibm-cloud/cloudant#authentication-with-environment-variables for how to create db
    
    try {
        const client = CloudantV1.newInstance({});
        const putDatabaseResult = (
        await client.putDatabase({
        db: todoDBName,
      })
    ).result;
    if (putDatabaseResult.ok) {
      console.log(`"${todoDBName}" database created.`);
    }
  } catch (err) {
   
      console.log(
        `Cannot create "${todoDBName}" database, err: "${err.message}".`
      );

  }
};




app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000'
}));




app.get("/authenticate", auth, (req, res) => { // endpoint protected by auth middleware, ensuring user has provided authentication
  console.log(`user logging in: ${req.auth.user}`); //if authentication succeeds, sets a signed cookie named 'user' on the response, which will persist the user's auth for later requests
  res.cookie('user', req.auth.user, { signed: true, withCredentials: true });
  res.sendStatus(200); //send 200 (ok) status upon successful authentication
});

app.post("/users", (req, res) => { //this endpoint allows adding a new user to the users store and updating users.json file
  const b64auth = (req.headers.authorization || '').split(' ')[1] || '' //expects user crednetials in the authorization header usign basic authentication
  const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':')
  const upsertSucceeded = upsertUser(username, password) //calls upsertUser fucntion to add or update user in users object
  res.sendStatus(upsertSucceeded ? 200 : 401); // 200 if success, 401 is auth fails
});

app.get("/logout", (req, res) => { //endpoint used to logout user by clearing signed 'user' cookie
  res.clearCookie('user');
  res.end();
});

