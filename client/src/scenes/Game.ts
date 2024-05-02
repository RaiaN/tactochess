import { Scene } from 'phaser';
import { GridCell } from '../components/GridCell';
import { GridComponent } from '../components/GridComponent';
import { Piece } from '../components/Piece';
import { PieceController } from '../components/PieceController';
import { Client, Room } from 'colyseus.js';
import { MyState } from "../state/State"
import { Cell } from '../state/Cell';
import { Player } from '../state/Player';
import { discordAuth, discordSdk, setupDiscordSdk } from '../lib/discord';

export class TactonGame extends Scene {
    room: Room;

    grid: GridComponent;
    pieceController: PieceController;

    selectedCell: GridCell | null;
    selectedCellIndex: number = -1;

    // TODO: Move to animation 
    // TODO: AnimController?
    pieceToMove: Piece | null;
    moveToTarget: GridCell | null;
    
    playerAttacks: any;
    playerSpells: any;
    bossAttacks: any;
    
    music: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound;
    controls: { up: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; spell: Phaser.Input.Keyboard.Key; };
    collectables: any;

    attackSound: any;
    playerSound: any;

    // UI
    notificationLabel: Phaser.GameObjects.Text;
    turnNotification: string;
    

    constructor()
    {
        super('TactonGame');
    }

    //  When a State is added to Phaser it automatically has the following properties set on it, even if they already exist:
    /*
        this.add;       //  used to add sprites, text, groups, etc (Phaser.GameObjectFactory)
        this.camera;    //  a reference to the game camera (Phaser.Camera)
        this.cache;     //  the game cache (Phaser.Cache)
        this.input;     //  the global input manager. You can access this.input.keyboard, this.input.mouse, as well from it. (Phaser.Input)
        this.load;      //  for preloading assets (Phaser.Loader)
        this.math;      //  lots of useful common math operations (Phaser.Math)
        this.sound;     //  the sound manager - add a sound, play one, set-up markers, etc (Phaser.SoundManager)
        this.stage;     //  the game stage (Phaser.Stage)
        this.time;      //  the clock (Phaser.Time)
        this.tweens;    //  the tween manager (Phaser.TweenManager)
        this.state;     //  the state manager (Phaser.StateManager)
        this.world;     //  the game world (Phaser.World)
        this.particles; //  the particle manager (Phaser.Particles)
        this.physics;   //  the physics manager (Phaser.Physics)
        this.rnd;       //  the repeatable random number generator (Phaser.RandomDataGenerator)
    */
    //  You can use any of these from any function within this State.
    //  But do consider them as being 'reserved words', i.e. don't create a property for your own game called 'world' or you'll over-write the world reference.
    
    // Runs once at start of game
    create () {

        // Generate in order of back to front
        var worldSize = 512;
        this.physics.world.setBounds(0, 0, worldSize, worldSize);

        // Client code (view and interactions)
        this.grid = new GridComponent(this);
        this.grid.onCellSelected = (cell) => this.onCellSelected(cell);

        this.pieceController = new PieceController(this, this.grid);
        // this.pieceController.enableCollision();
        this.pieceController.onMovementFinished = () => this.onMovementFinished();

        // Music
		this.music = this.sound.add('overworldMusic');
		this.music.loop = true;
		this.music.play();

        // Sound effects
        this.generateSounds();

        // Set the controls
        if (this.input.keyboard)
        {
            this.controls = {
                up: this.input.keyboard.addKey('W'),
                left: this.input.keyboard.addKey('A'),
                down: this.input.keyboard.addKey('S'),
                right: this.input.keyboard.addKey('D'),
                spell: this.input.keyboard.addKey('SPACE')
            };
        }

        // Show UI
        this.showLabels();
        this.turnNotification = 'Waiting for opponent to join the game ..';

        this.connectToServer();
    }

    async connectToServer() {
        if (!discordAuth) await setupDiscordSdk();

        /*if (discordAuth == null) {
        // throw new Error('Discord Auth is not set up!');
            await setupDiscordSdk().then(() => this.connectToServer());
            return;
        }*/

        if (discordSdk.channelId == null || discordSdk.guildId == null) throw new Error('Channel ID or Guild ID is missing!');

        // LOCALHOST
        // const client = new Client("ws://localhost:2567/api");
        // COLYSEUS CLOUD (works only locally!)
        // const client = new Client("ws://gb-lhr-dbaf4307.colyseus.cloud/api");

        // TEST PRODUCTION
        // using 'wss' is VERY important to avoid issues related to "mixed content" and/or CORS 
        // WORKING in web browser!
        // const client = new Client("wss://gb-lhr-dbaf4307.colyseus.cloud");

        // TEST Discord
        // const client = new Client("wss://${location.host}/api");
        const client = new Client(`wss://1229829326296584223.discordsays.com/api`);

        // this.turnNotification = (await client.http.get('/hello_world')).data;

        // The second argument has to include for the room as well as the current player
        this.room = await client.joinOrCreate<MyState>('tactochess', {});

        let gameState: MyState = this.room.state;

        let numPlayers = 0;
        gameState.players.onAdd((item: Player, key: string) => {
            console.log('On player joined!');
            
            this.pieceController.spawnPieces(this.room.sessionId == key, numPlayers);
            ++numPlayers;

            if (numPlayers === 2) {
                this.onJoin();
            }
        });

        gameState.cells.onChange((item: Cell, key: number) => {
            // TODO:
            console.log('Server message: Grid modified!');
        });

        gameState.listen("currentTurn", (playerId, prevPlayerId) => {
            console.log('Server message: Current turn (player id): ' + playerId);

            this.nextTurn(playerId);
        });

        gameState.listen("selectedCellIndex", (cellIndex, prevCellIndex) => {
            console.log('Server message: selectedCellIndex changed to: ' + cellIndex);

            this.onCellSelected_ClientCallback(cellIndex, prevCellIndex);
        });

        gameState.listen("moveToCellIndex", (cellIndex, prevCellIndex) => {
            console.log('Server message: moveToCellIndex changed to: ' + cellIndex);

            this.onMovePiece_ClientCallback(cellIndex, prevCellIndex);
        });

        gameState.listen("attackPieceCellIndex", (cellIndex, prevCellIndex) => {
            console.log('Server message: attackPieceCellIndex changed to: ' + cellIndex);

            this.onAttackPiece_ClientCallback(cellIndex, prevCellIndex);
        });

        gameState.listen("winner", (winnerPlayerId) => {
            console.log('Server message: winner set to: ' + winnerPlayerId);

            if (winnerPlayerId != -1) {
                this.gameOver(winnerPlayerId);
            }
        });

        // TODO: Enable once game is stable!
        this.room.onError.once(() => this.scene.start('MainMenu'));
    }

    onJoin() {
        // TODO:
        console.log('On ALL players joined!');
    }

    onCellSelected(cell: GridCell): boolean {
        console.log('Cell selected: ' + cell.coordinates.x + ',' + cell.coordinates.y);

        // if (this.gameState.getCurrentTurnPlayerId() == this.gameState.getThisPlayerId()) {
        this.handlePlayerAction(cell);
        // }

        //if (!this.pieceController.hasActiveAction()) {
        //}

        return true;
    }

    handlePlayerAction(cell: GridCell) {
        console.log('Client message: ' + cell.index);
        this.room.send("action", {cellIndex: cell.index });

    }

    onCellSelected_ClientCallback(cellIndex: number, prevCellIndex: number) {
        console.log('onCellSelected_ClientCallback')

        // 1. select phase
        let cell: GridCell = this.grid.getCellByIndex(cellIndex);

        if (cellIndex == -1) {
            console.log('Unselecting cell: ' + cellIndex);
            this.selectedCell?.unselect();
            this.selectedCell = null;
            this.selectedCellIndex = -1;
            return;
        }

        if (this.selectedCellIndex == -1) {
            // select piece
            this.selectedCell = cell;
            this.selectedCell.select();

            this.selectedCellIndex = cellIndex;

            console.log('On new cell selected (validated by server!): ' + cellIndex);
        // 2. move/attack phase
        } else {
            let state: MyState = this.room.state;
            let cellOccupier: number = state.cells.toArray()[cellIndex].occupiedBy;
            let thisPlayerId: number = this.getThisPlayerId();

            if (this.selectedCell != null && cellOccupier == thisPlayerId) {
                // select new piece
                this.selectedCell.unselect();
                this.selectedCell = cell;
                this.selectedCell.select();

                this.selectedCellIndex = cellIndex;

                console.log('On new cell selected (validated by server!): ' + cellIndex);
            }
        }
    }

    onMovePiece_ClientCallback(cellIndex: number, prevCellIndex: number) {
        console.log('onMovePiece_ClientCallback')

        let cell: GridCell = this.grid.getCellByIndex(cellIndex);

        if (this.selectedCell != null) {
            console.log(`Moving player piece at ${this.selectedCell?.index} to a new cell (validated by server!): ${cellIndex}`);

            this.pieceController.movePiece(this.selectedCell, cell);

            cell.setPiece(this.selectedCell.getPiece());

            // drop active selection
            this.selectedCell.unselect();
            this.selectedCell.setPiece(null);
            this.selectedCell = null;

            this.selectedCellIndex = -1;
        }
    }

    async onAttackPiece_ClientCallback(cellIndex: number, prevCellIndex: number) {
        console.log('onAttackPiece_ClientCallback');

        let cell: GridCell = this.grid.getCellByIndex(cellIndex);

        if (this.selectedCell != null) {
            console.log(`Attacking enemy piece at ${cellIndex}`);

            await this.pieceController.attackPiece(this.selectedCell, cell);

            this.attackSound.play();

            // drop active selection
            this.selectedCell?.unselect();
            this.selectedCell = null;

            this.selectedCellIndex = -1;
        }
    }

    onMovementFinished() {
        // Move animations disabled!
        // this.nextTurn();

        // this.notification = 'Current turn: ' + this.gameState.getCurrentPlayer();

    }

    getThisPlayerId(): number {
        let gameState: MyState = this.room.state;
        return gameState.players.get(this.room.sessionId)!.playerId;
    }

    isThisPlayerTurn(playerId: number): boolean {
        let gameState: MyState = this.room.state;
        return gameState.players.get(this.room.sessionId)?.playerId == playerId;
    }

    nextTurn(playerId: number) {
        this.turnNotification = this.isThisPlayerTurn(playerId) ? 'Your turn!' : 'Wait for opponent turn..';

        // drop any selection!
        this.selectedCell?.unselect();
        this.selectedCell = null;
        this.selectedCellIndex = -1;
    }

    // Checks for actions and changes
    update () {
        this.pieceController.update();

        this.notificationLabel.text = this.turnNotification;
        this.notificationLabel.setPosition(this.input.mousePointer.position.x + 20, this.input.mousePointer.position.y);
    }

    showLabels() {

        var text = '0';
        const style = { font: '16px Arial', fill: '#FFFF00', align: 'center' };

        const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        this.notificationLabel = this.add.text(screenCenterX, 25, text, style);
    }

    setUpSpriteAnim(sprite: Phaser.Physics.Arcade.Sprite, spriteKey: string, animKey: string, startFrame: integer, endFrame?: integer, frameRate?: integer, repeat?: integer)
    {
        let config = {
            key: animKey,
            frames: this.anims.generateFrameNumbers(spriteKey, {
                start: startFrame,
                end: endFrame ?? startFrame
            }),
            frameRate: frameRate ?? 10,
            repeat: repeat ?? -1
        };

        sprite.anims.create(config);
    }

    setUpGlobalAnim(spriteKey: string, animKey: string, startFrame: integer, endFrame?: integer, frameRate?: integer, repeat?: integer)
    {
        let config = {
            key: animKey,
            frames: this.anims.generateFrameNumbers(spriteKey, {
                start: startFrame,
                end: endFrame ?? startFrame
            }),
            frameRate: frameRate ?? 10,
            repeat: repeat ?? -1
        };

        this.anims.create(config);
    }

    generateSounds () {
        this.attackSound = this.sound.add('attackSound');
        this.playerSound = this.sound.add('playerSound');
    }

    gameOver(playerId: number) {
        this.notificationLabel.setFontSize(20);
        
        if (this.getThisPlayerId() == playerId) {
            this.turnNotification = 'Victory!';
            this.notificationLabel.setColor('#FFFFFF');
        } else {
            this.turnNotification = 'Defeat!';
        }

		this.music.stop();
		this.music.destroy();

        setTimeout(() => {
            this.scene.start('GameOver');
        }, 2000);
    }
};
