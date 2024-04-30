import { Scene } from 'phaser';
import { GridCell } from '../components/GridCell';
import { GameState } from '../state/GameState';
import { GridComponent } from '../components/GridComponent';
import { Piece } from '../components/Piece';
import { PieceController } from '../components/PieceController';
import { Client, Room } from 'colyseus.js';
import { MyState } from '../../../server/rooms/state/State';
import { Cell } from '../../../server/rooms/state/Cell';

export class TactonGame extends Scene {
    room: Room;
    
    gameState: GameState;
    grid: GridComponent;
    pieceController: PieceController;

    selectedCell: GridCell | null;

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
    notification: string;
    

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

        // TODO: Server code
        this.gameState = new GameState();

        // this.gameState.addPlayer('red');
        // this.gameState.addPlayer('green');

        // Generate in order of back to front
        var worldSize = 512;
        this.physics.world.setBounds(0, 0, worldSize, worldSize);

        // Client code (view and interactions)
        this.grid = new GridComponent(this);
        this.grid.onCellSelected = (cell) => this.onCellSelected(cell);

        this.pieceController = new PieceController(this, this.grid);
        this.pieceController.spawnPieces();
        this.pieceController.enableCollision();
        this.pieceController.onMovementFinished = () => this.onMovementFinished();

        // Music
		this.music = this.sound.add('overworldMusic');
		this.music.loop = true;
		// this.music.play();

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

        // TODO: React to server message!
        // Show UI
        this.showLabels();
        this.notification = 'Waiting for opponent..';

        this.connectToServer();
    }

    async connectToServer() {
        const wsUrl = 'ws://localhost:3001';
        const client = new Client(wsUrl);
        // The second argument has to include for the room as well as the current player
        this.room = await client.joinOrCreate<MyState>('tactochess', {});

        let gameState: MyState = this.room.state;

        let numPlayers = 0;
        gameState.players.onAdd((item: Player, key: string) => {
            console.log('On player joined!');
            numPlayers++;

            this.gameState.addPlayer(key);

            if (this.room.sessionId == key) {
                console.log('This player id: ' + item.playerId);
                this.gameState.setThisPlayerId(item.playerId);
            }

            if (numPlayers === 2) {
                this.onJoin();
            }
        });

        gameState.cells.onChange((item: Cell, key: number) => {
            console.log('Server message: Grid modified!');
        });

        gameState.listen("currentTurn", (playerId, prevPlayerId) => {
            console.log('Server message: Current turn: ' + playerId);
            this.nextTurn(playerId);
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

        let gameState: MyState = this.room.state;
        if (gameState.currentTurn == this.gameState.getThisPlayerId()) {
            this.handlePlayerAction(cell);
        }

        //if (!this.pieceController.hasActiveAction()) {
        //}

        return true;
    }

    async handlePlayerAction(cell: GridCell): Promise<boolean> {
        console.log('Client message: ' + cell.index);
        this.room.send("action", cell.index);

        // TODO:

        /*let cellOccupier = this.gameState.grid.getByIndex(cell.index).occupiedBy;

        // 1. select phase
        if (this.selectedCell == null) {
            // cannot select enemy piece
            if (cellOccupier != this.gameState.currentPlayer) {
                return false;
            }

            // nothing to select
            if (cell.getPiece() == null) {
                return false;
            }

            // select piece
            this.selectedCell = cell;
            this.selectedCell.select();

            // implicit switch to next state: move/attack
 
        // 2. move/attack phase
        } else {
            // early exit: reselect piece
            if (cellOccupier == this.gameState.currentPlayer) {
                // select new piece
                this.selectedCell.unselect();
                this.selectedCell = cell;
                this.selectedCell.select();

            // Move piece
            } else if (cell.getPiece() == null) {
                if (this.pieceController.movePiece(this.selectedCell, cell)) {
                    console.log('MoveTo:');
                    // update game state

                    this.gameState.updateGrid(this.selectedCell.index, '');
                    this.gameState.updateGrid(cell.index, this.gameState.currentPlayer);

                    cell.setPiece(this.selectedCell.getPiece());

                    // drop active selection
                    this.selectedCell.unselect();
                    this.selectedCell.setPiece(null);
                    this.selectedCell = null;

                    this.nextTurn();

                    this.notification = 'Current turn: ' + this.gameState.getCurrentPlayer();
                }

            // Attack piece
            } else {
                let attackResult = await this.pieceController.attackPiece(this.selectedCell, cell);
                if (attackResult) {
                    console.log('Attack:');

                    this.attackSound.play();
                    // update game state
                    this.gameState.updateGrid(cell.index, '');

                    // drop active selection
                    this.selectedCell.unselect();
                    this.selectedCell = null;

                    // TODO: ideally we need to wait until Attack animation has been completed!
                    this.nextTurn();

                    // update UI
                    this.notification = 'Current turn: ' + this.gameState.getCurrentPlayer();
                }
            }
        }

        // TODO: fire message to server
        // TODO: server validates desired move can be done!

        return true;
    }

    onMovementFinished() {
        // Move animations disabled!
        // this.nextTurn();

        // this.notification = 'Current turn: ' + this.gameState.getCurrentPlayer();

    }

    nextTurn(playerId: number) {
        // TODO:
        this.notification = 'Current turn: ' + this.room.state.currentTurn;

        //if (!this.checkWin()) {
        // this.gameState.nextTurn();
        // return;
        //}
    }

    checkWin(): boolean {
        if (this.gameState.checkWin()) {
            this.notification = 'Game over! Winner: ' + this.room.state.currentTurn;
            setTimeout(() =>  this.gameOver(), 2000);
           
            return true;
        }
        return false;
    }

    // Checks for actions and changes
    update () {
        this.pieceController.update();

        this.notificationLabel.text = this.notification;
        this.notificationLabel.setPosition(this.input.mousePointer.position.x + 20, this.input.mousePointer.position.y);
    }

    showLabels() {

        var text = '0';
        const style = { font: '14px Arial', fill: '#100', align: 'center' };

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

    gameOver() {
        // this.gameState.winner = this.gameState.getCurrentPlayer();

		this.music.stop();
		this.music.destroy();

        //  Here you should destroy anything you no longer need.
        //  Stop music, delete sprites, purge caches, free resources, all that good stuff.

        //  Then let's go back to the main menu.
        this.scene.start('MainMenu'/*, true, false, this.xp + this.gold*/);
    }

    quitGame (pointer) {

        //  Here you should destroy anything you no longer need.
        //  Stop music, delete sprites, purge caches, free resources, all that good stuff.
		this.music.stop();

        //  Then let's go back to the main menu.
        this.scene.start('MainMenu'/*, true, false, this.xp + this.gold*/);
    }
};
