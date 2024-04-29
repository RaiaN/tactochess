import { DiscordSDK } from "@discord/embedded-app-sdk";
import { Client, Room } from 'colyseus.js';
import { Boot } from './src/scenes/Boot'
import { GameOver } from './src/scenes/GameOver';
import { Preloader } from './src/scenes/Preloader';
import { MainMenu } from './src/scenes/MainMenu';
import { TactonGame } from './src/scenes/Game';


// Instantiate the SDK
// Uncomment this once your work is done on browser, it will ONLY work on Discord Activities
/*const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);
setupDiscordSdk().then(() => {
  console.log("Discord SDK is ready");
}).catch((error) => {
  console.log(error);
});
async function setupDiscordSdk() {
  await discordSdk.ready();
}*/

const wsUrl = 'ws://localhost:3001';
const client = new Client(wsUrl);

let roomName = 'Channel';

// The second argument has to include for the room as well as the current player
const newRoom = await client.joinOrCreate('tactochess', {});

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config = {
    type: Phaser.AUTO,
    width: 512,
    height: 512,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scale: {
      // TODO: make full screen? Test in Discord
      // mode: Phaser.Scale.NO_CENTER,
      autoCenter: Phaser.Scale.CENTER_HORIZONTALLY
    },
    input: {
        activePointers: 1, // This ensures only one pointer is tracked at a time
    },
    // disableVisibilityChange: true, // Prevents the game from pausing when the window loses focus
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: true
      }
    },
    scene: [
      Boot,
      Preloader,
      GameOver,
      MainMenu,
      TactonGame
    ]
};

new Phaser.Game(config);
