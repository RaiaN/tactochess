import http from 'http';
import express from 'express';
import cors from "cors";
import dotenv from 'dotenv'; 
// import path from 'path';
// import { fileURLToPath } from 'url';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';

import { Tactochess } from "./rooms/Tactochess"

dotenv.config({ path: "../.env" });

const app = express();
const port = 3001;

// Allow express to parse JSON bodies
app.use(express.json());
// WHY?
app.use(cors());

app.post("/api/token", async (req, res) => {
  
  // Exchange the code for an access_token
  const response = await fetch(`https://discord.com/api/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.VITE_DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code: req.body.code,
    }),
  });

  // Retrieve the access_token from the response
  let access_token = await response.json();

  // Return the access_token to our client as { access_token: "..."}
  res.send({access_token});
});

/*app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});*/

const server = http.createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({ server: server })
});

gameServer.define('tactochess', Tactochess);
gameServer.listen(port);

// const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
// const __dirname = path.dirname(__filename); // get the name of the directory
// app.use(express.static(__dirname + "/../frontend/public"));

console.log(`Listening on ws://localhost:${ port }`);