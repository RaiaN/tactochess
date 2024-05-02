import config from "@colyseus/tools";
import { monitor } from "@colyseus/monitor";
import express from 'express';
import cors from 'cors';
import { Tactochess } from "./rooms/Tactochess";

export default config({
    initializeGameServer: (gameServer) => {
        gameServer.define('tactochess', Tactochess);
    },
    initializeExpress: (app) => {
       // Allow express to parse JSON bodies
        app.use(express.json());

        app.use(cors());

        app.get("/helloworld", (req, res) => {
            res.send("YEP YEP IT WORKS!");
        });

        app.post("/token", async (req, res) => {
  
            // Exchange the code for an access_token
            const response = await fetch(`https://discord.com/api/oauth2/token`, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
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

        /**
         * Use @colyseus/monitor
         * It is recommended to protect this route with a password
         * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
         */
        app.use("/colyseus", monitor());
          
    },
    beforeListen: () => {
        // ...
    }
});