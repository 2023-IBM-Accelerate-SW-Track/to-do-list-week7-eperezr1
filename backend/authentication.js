var crypto = require('crypto'); //import crypto package for creating hashes
var fs = require('fs'); //import fs package for reading and writing files
const basicAuth = require("express-basic-auth"); //import module used for basic authentication

// users holds user information that is backed up on file
let users = {}; //users is an object that will hold user info. Initially empty but will be populated with user data from users.json file during initialization

// initialize users store from file
(() => { // read data from users.json file and sotre in users object
    users = JSON.parse(fs.readFileSync('users.json', 'utf8')).users;
})()

// performs a SHA256 hash of a string
const sha256 = x => crypto.createHash('sha256').update(x, 'utf8').digest('hex'); // hash user passwrods for secure storage and comparison during authentication

// looks for the username/password combo in the users store
const authenticator = (user, password) => { //authentication function authenticates users
    if(!users[user] || !user || !password) return false; //takes in user and passowrds as input params and return true if provided username and password match an existing username and passwrod in users object
    return basicAuth.safeCompare(sha256(password), users[user].passwordHash);
}

// write the users store to file
const writeUsers = (_users) => { // write updated users object back to users.json file after any changes to user info
    const data = {
        users: _users
    }
    var json = JSON.stringify(data);
    fs.writeFile("users.json", json, function (err, result) {
        if (err) {
            console.log("error", err);
        } else {
            console.log("Successfully wrote users");
        }
    });
}

// update or insert a user object to the store ( users object)
// returns true/false to indicate success of the operation
const upsertUser = (username, password, userDetail) => {
    if(users[username]) { // if username already exists in user object
        if(basicAuth.safeCompare(sha256(password), users[username].passwordHash)) { // if passwordmathces stored password hash
            users[username] = { ...users[username], ...userDetail }; // update user details with the provided 'userDetail'
        } else {
            console.log("incorrect password in upsertUser");
            return false;
        }
    } else { // if username DNE in users object
        users[username] = { //create new user with provided username, password, adn userDetail
            ...userDetail,
            passwordHash: sha256(password)
        }
    }
    writeUsers(users); // after updating users object, call writeUsers to save the changes to the file
    return true;
}

// express middleware for validating `user` cookie against users store
//cookie based authentication middleware : function used to validate user authentication based on a 'user' cookie stored in the client's browser
const cookieAuth = (req, res, next) => {
    if(!req.signedCookies.user || !users[req.signedCookies.user]) { //if user cookie missing or user DNE in users object
        res.sendStatus(401); //unauthorized
    } else {
        next(); //call next function to allow request to proceed to next middleware or route handler
    }
}

module.exports = { authenticator, upsertUser, cookieAuth }