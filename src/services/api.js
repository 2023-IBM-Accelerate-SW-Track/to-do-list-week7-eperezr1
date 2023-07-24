//functions for setting up login form for users to log in before accessing the TODO app
import axios from "axios"; //backend API axios, JavaScript library for making/handling HTTP requests

const baseUrl = "http://localhost:8080"; // base URL for the backend API

export const authenticate = async (username, password) => { //authenticate function used for user auth, takes username and poassowrd as input params
    try {
        await axios.get(`${baseUrl}/authenticate`, { //sends HTTP GET request to /authenticate endpoint of backend API
            auth: { username, password }, //passes provided username and password 
            withCredentials: true // set flag in Axios request config to ensure cookies are sent along with the request
        });
        return true; //if auth successful, return true
    } catch (e) {
        console.log(e);
        return false;
    }
};

export const createUser = async (username, password) => { // creates new user account
    try {
        const options = {
            auth: {
                username: username,
                password: password
            }
        }
        return await axios.post(`${baseUrl}/users`, {}, options); //sends HTTP POST request to /users endpoint of backend API to create new user
    } catch (e) {
        console.log(e); // if error during process, logs error to console
    }
};


export const createItem = async (jsonObject) => {
    try {
        const res = await axios.post(`${baseUrl}/item`, jsonObject, {
            headers: {
                "Content-Type": "application/json"
            },
            withCredentials: true // Add withCredentials flag
        });
        console.log(res.data.message);
    } catch (e) {
        console.error(e); // Use console.error() for error logging
    }
};



