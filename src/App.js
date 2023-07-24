//provides login screen for users to create an accoutn or log in to app
import React from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import NavbarComp from "./component/navigation/NavbarComp";
import * as api from "./services/api"; // imports modules and APIs from api.js
import { useState } from "react";


function App() {
  const [authenticated, setAuthenticated] = useState(false); // authenticated is bool that indicates whether user is authetnicated or not; initialized to false
  const [username, setUsername] = useState(); //username is state var to store input value for username field in login form
  const [password, setPassword] = useState();//password is state var to store input value for password field in login form
  const authUser = async () => { // called when Login button clicked
    setAuthenticated(await api.authenticate(username, password)); //uses api.authenticate function to authenticate user using provided username and password
  };

  const createUser = async () => { //createUser function called when Create User button is clicked
    await api.createUser(username, password); //uses api.createUser function to create new User account with provided username and password
  };




  return ( //renders login screen
    <div className="App">
      {!authenticated ? ( //if user not authenticated, login form displayed, allowing user to enter a username and password
        <div>
          <label>Username: </label>
          <br />
          <input type="text" onChange={(e) => setUsername(e.target.value)} />
          <br />
          <label>Password: </label>
          <br />
          <input
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <br />
          <button onClick={createUser}>Create User</button> 
          <button onClick={authUser}>Login</button>
        </div>
      ) : ( //if user is authenticated, then application screen is rendered which includes a component called NavbarComp
        <div className="App">
          <NavbarComp />
        </div>
      )}
    </div>
  );

  
}

export default App;
