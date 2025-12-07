import { Scene } from 'phaser';
import { GridCell } from '../components/GridCell';
import { GridComponent } from '../components/GridComponent';
import { Piece } from '../components/Piece';
import { PieceController } from '../components/PieceController';
import { GameClient } from '../network/GameClient';
import { Cell } from '../state/Cell';

// Game mode constants (must match server)
const GAME_CONSTANTS = {
    MOVE_DISTANCE: 3,
    ATTACK_DISTANCE: 4,
};

export class TactonGame extends Scene {
    gameClient: GameClient;
    myPlayerId: number = -1;

    grid: GridComponent;
    pieceController: PieceController;

    selectedCell: GridCell | null = null;
    selectedCellIndex: number = -1;

    // Attack range indicators
    attackableEnemyCells: GridCell[] = [];
    movableCells: GridCell[] = [];

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
    

    constructor() {
        super('TactonGame');
    }
    
    create() {
        // Generate in order of back to front
        var worldSize = 512;
        this.physics.world.setBounds(0, 0, worldSize, worldSize);

        // Client code (view and interactions)
        this.grid = new GridComponent(this);
        this.grid.onCellSelected = (cell) => this.onCellSelected(cell);

        this.pieceController = new PieceController(this, this.grid);
        this.pieceController.onMovementFinished = () => this.onMovementFinished();

        // Music
        this.music = this.sound.add('overworldMusic');
        this.music.loop = true;
        this.music.play();

        // Sound effects
        this.generateSounds();

        // Set the controls
        if (this.input.keyboard) {
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
        this.turnNotification = 'Waiting for opponent to join the game...';

        this.connectToServer();
    }

    async connectToServer() {
        // Create game client
        this.gameClient = new GameClient();

        // Set up callbacks
        this.gameClient.setCallbacks({
            onPlayerJoined: (player, totalPlayers, isLocalPlayer) => {
                console.log('Player joined!', player, 'Total:', totalPlayers, 'IsLocal:', isLocalPlayer);
                // Pieces will be spawned on gameStart when both players are ready
            },

            onGameStart: (cells, currentTurn, myPlayerId) => {
                console.log('Game started! My player ID:', myPlayerId, 'First turn:', currentTurn);
                this.myPlayerId = myPlayerId;
                
                // Spawn all pieces now that both players are in
                // Player 0's pieces are at cells 0-15 (top), Player 1's at cells 48-63 (bottom)
                // isPlayer=true shows cyan indicator (my pieces), isPlayer=false shows red tint (enemy)
                if (myPlayerId === 0) {
                    // I'm player 0: my pieces at top (offset 0), enemy at bottom (offset 1)
                    this.pieceController.spawnPieces(true, 0);  // My pieces - top
                    this.pieceController.spawnPieces(false, 1); // Enemy pieces - bottom
                } else {
                    // I'm player 1: enemy pieces at top (offset 0), my pieces at bottom (offset 1)
                    this.pieceController.spawnPieces(false, 0); // Enemy pieces - top
                    this.pieceController.spawnPieces(true, 1);  // My pieces - bottom
                }
                
                this.onGameStart(currentTurn);
            },

            onCellSelected: (cellIndex, previousCellIndex) => {
                console.log('Cell selected:', cellIndex, 'Previous:', previousCellIndex);
                this.onCellSelected_ServerCallback(cellIndex, previousCellIndex);
            },

            onPieceMoved: (fromCellIndex, toCellIndex) => {
                console.log('Piece moved from', fromCellIndex, 'to', toCellIndex);
                this.onMovePiece_ServerCallback(fromCellIndex, toCellIndex);
            },

            onPieceAttacked: (fromCellIndex, targetCellIndex) => {
                console.log('Piece attacked from', fromCellIndex, 'to', targetCellIndex);
                this.onAttackPiece_ServerCallback(fromCellIndex, targetCellIndex);
            },

            onTurnChanged: (playerId) => {
                console.log('Turn changed to player:', playerId);
                this.nextTurn(playerId);
            },

            onGameOver: (winnerId) => {
                console.log('Game over! Winner:', winnerId);
                this.gameOver(winnerId);
            },

            onError: (message) => {
                console.error('Server error:', message);
            },

            onDisconnect: () => {
                console.log('Disconnected from server');
                this.scene.start('MainMenu');
            }
        });

        // Connect to server
        try {
            await this.gameClient.connect('ws://localhost:2567');
        } catch (error) {
            console.error('Failed to connect:', error);
            this.turnNotification = 'Failed to connect to server!';
        }
    }

    onGameStart(currentTurn: number) {
        this.turnNotification = this.myPlayerId === currentTurn 
            ? 'Your turn!' 
            : 'Wait for opponent turn...';
    }

    onCellSelected(cell: GridCell): boolean {
        console.log('Cell clicked: ' + cell.coordinates.x + ',' + cell.coordinates.y);

        // Send action to server
        this.gameClient.sendAction(cell.index);

        return true;
    }

    onCellSelected_ServerCallback(cellIndex: number, prevCellIndex: number) {
        console.log('onCellSelected_ServerCallback:', cellIndex);

        // Clear previous highlights
        this.clearRangeIndicators();

        // Unselect previous cell
        if (this.selectedCell) {
            this.selectedCell.unselect();
        }

        if (cellIndex === -1) {
            this.selectedCell = null;
            this.selectedCellIndex = -1;
            return;
        }

        // Select new cell
        let cell = this.grid.getCellByIndex(cellIndex);
        this.selectedCell = cell;
        this.selectedCellIndex = cellIndex;
        cell.select();

        // Show range indicators if it's my turn and my piece is selected
        if (this.gameClient.isMyTurn() && 
            this.gameClient.getCellOccupier(cellIndex) === this.myPlayerId) {
            this.showRangeIndicators(cell);
        }
    }

    // Show which cells can be moved to or attacked
    showRangeIndicators(fromCell: GridCell) {
        this.clearRangeIndicators();

        const fromX = fromCell.coordinates.x;
        const fromY = fromCell.coordinates.y;

        for (let i = 0; i < 64; i++) {
            const cell = this.grid.getCellByIndex(i);
            const toX = cell.coordinates.x;
            const toY = cell.coordinates.y;
            const distance = Math.abs(fromX - toX) + Math.abs(fromY - toY);

            if (distance === 0) continue; // Skip the selected cell itself

            const occupier = this.gameClient.getCellOccupier(i);

            // Empty cell within move range
            if (occupier === -1 && distance <= GAME_CONSTANTS.MOVE_DISTANCE) {
                cell.showMoveIndicator();
                this.movableCells.push(cell);
            }
            // Enemy cell within attack range
            else if (occupier !== -1 && occupier !== this.myPlayerId && distance <= GAME_CONSTANTS.ATTACK_DISTANCE) {
                cell.showAttackIndicator();
                this.attackableEnemyCells.push(cell);
            }
        }
    }

    clearRangeIndicators() {
        for (const cell of this.movableCells) {
            cell.clearIndicator();
        }
        for (const cell of this.attackableEnemyCells) {
            cell.clearIndicator();
        }
        this.movableCells = [];
        this.attackableEnemyCells = [];
    }

    onMovePiece_ServerCallback(fromCellIndex: number, toCellIndex: number) {
        console.log('onMovePiece_ServerCallback:', fromCellIndex, '->', toCellIndex);

        if (fromCellIndex === -1 || toCellIndex === -1) {
            console.log('Invalid move indices, skipping');
            return;
        }

        let fromCell = this.grid.getCellByIndex(fromCellIndex);
        let toCell = this.grid.getCellByIndex(toCellIndex);

        console.log(`Moving piece from ${fromCellIndex} to ${toCellIndex}`);

        // Move the piece visually
        this.pieceController.movePiece(fromCell, toCell);

        // Update cell piece references
        toCell.setPiece(fromCell.getPiece());
        fromCell.unselect();
        fromCell.setPiece(null);

        // Clear selection state
        this.clearRangeIndicators();
        if (this.selectedCell) {
            this.selectedCell.unselect();
            this.selectedCell = null;
            this.selectedCellIndex = -1;
        }
    }

    async onAttackPiece_ServerCallback(fromCellIndex: number, targetCellIndex: number) {
        console.log('onAttackPiece_ServerCallback:', fromCellIndex, '->', targetCellIndex);

        if (fromCellIndex === -1 || targetCellIndex === -1) {
            console.log('Invalid attack indices, skipping');
            return;
        }

        let fromCell = this.grid.getCellByIndex(fromCellIndex);
        let targetCell = this.grid.getCellByIndex(targetCellIndex);

        console.log(`Attacking enemy piece at ${targetCellIndex} from ${fromCellIndex}`);

        // Play attack animation and destroy target piece
        await this.pieceController.attackPiece(fromCell, targetCell);

        this.attackSound.play();

        // IMPORTANT: Clear the target cell's piece reference (fixes bug #1)
        // The piece is destroyed, so the cell should no longer reference it
        targetCell.setPiece(null);

        // Clear selection state
        this.clearRangeIndicators();
        fromCell.unselect();
        if (this.selectedCell) {
            this.selectedCell.unselect();
            this.selectedCell = null;
            this.selectedCellIndex = -1;
        }
    }

    onMovementFinished() {
        // Movement animations handled
    }

    isThisPlayerTurn(playerId: number): boolean {
        return this.myPlayerId === playerId;
    }

    nextTurn(playerId: number) {
        this.turnNotification = this.isThisPlayerTurn(playerId) 
            ? 'Your turn!' 
            : 'Wait for opponent turn...';

        // Clear any selection and indicators when turn changes
        this.clearRangeIndicators();
        this.selectedCell?.unselect();
        this.selectedCell = null;
        this.selectedCellIndex = -1;
    }

    update() {
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

    setUpSpriteAnim(sprite: Phaser.Physics.Arcade.Sprite, spriteKey: string, animKey: string, startFrame: integer, endFrame?: integer, frameRate?: integer, repeat?: integer) {
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

    setUpGlobalAnim(spriteKey: string, animKey: string, startFrame: integer, endFrame?: integer, frameRate?: integer, repeat?: integer) {
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

    generateSounds() {
        this.attackSound = this.sound.add('attackSound');
        this.playerSound = this.sound.add('playerSound');
    }

    gameOver(winnerId: number) {
        this.notificationLabel.setFontSize(20);
        
        if (this.myPlayerId === winnerId) {
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
}
