import { Scene } from 'phaser';
import { GridCell } from './components/GridCell';
import { GameState } from './state/GameState';
import { GridComponent } from './components/GridComponent';
import { Piece } from './components/Piece';
import { PieceController } from './components/PieceController';

export class TactonGame extends Scene {
    gameState: GameState;
    grid: GridComponent;
    pieceController: PieceController;

    selectedCell: GridCell | null;

    // Move to animation 
    // TODO: AnimController?
    pieceToMove: Piece | null;
    moveToTarget: GridCell | null;
    
    playerAttacks: any;
    playerSpells: any;
    bossAttacks: any;
    
    music: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound;
    controls: { up: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; spell: Phaser.Input.Keyboard.Key; };
    collectables: any;

    bosses: Phaser.Physics.Arcade.Group;
    enemies: Phaser.Physics.Arcade.Group;
    obstacles: Phaser.Physics.Arcade.StaticGroup;
    corpses: any;

    dragonSound: any;
    levelSound: any;
    attackSound: any;
    fireballSound: any;
    goldSound: any;
    potionSound: any;
    playerSound: any;
    skeletonSound: any;
    slimeSound: any;
    batSound: any;
    ghostSound: any;
    spiderSound: any;

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
         // TODO: colyseus OnJoin()
        this.gameState.addPlayer('white');
        this.gameState.addPlayer('black');

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

        // Generate objects
        // this.generateObstacles();
        // this.generateCollectables();

        // this.corpses = this.add.group();

        // Generate player and set camera to follow
        // this.player = this.generatePlayer();
        // this.cameras.main.startFollow(this.player.object!);

        // this.playerAttacks = this.generateAttacks('sword', 1, null, null);
        // this.playerSpells = this.generateAttacks('spell', 1, null, null);
        // this.bossAttacks = this.generateAttacks('spellParticle', 5,2000, 300);
        // this.bossAttacks = this.generateAttacks('fireball', 1, 2000, 300);

        // Generate enemies - must be generated after player and player.level
        // this.generateEnemies(100);

        // Generate bosses
        // this.bosses = this.physics.add.group();

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

        this.gameState.startGame();

        // Show UI
        this.showLabels();
        this.notification = 'Current turn: ' + this.gameState.getCurrentPlayer();
    }

    onCellSelected(cell: GridCell): boolean {
        console.log('Cell selected: ' + cell.coordinates.x + ',' + cell.coordinates.y);

        if (!this.pieceController.hasActiveAction()) {
            this.handlePlayerAction(cell);
        }

        return true;
    }

    handlePlayerAction(cell: GridCell): boolean {
        let cellOccupier = this.gameState.grid.getByCoords(cell.coordinates.x, cell.coordinates.y).occupiedBy;

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

            // switch to next state: move/attack 
            // this.gameState.nextTurn();
        } else {
            if (cellOccupier == this.gameState.currentPlayer) {
                // select new piece
                this.selectedCell.unselect();
                this.selectedCell = cell;
                this.selectedCell.select();
            } else if (cell.getPiece() == null) {
                if (this.pieceController.movePiece(this.selectedCell, cell)) {
                    console.log('MoveTo:');
                    // update game state
                    this.gameState.grid.getByCoords(this.selectedCell.coordinates.x, this.selectedCell.coordinates.y).occupiedBy = '';
                    this.gameState.grid.getByCoords(cell.coordinates.x, cell.coordinates.y).occupiedBy = this.gameState.currentPlayer;

                    let selectedPiece = this.selectedCell.getPiece()!;
                    
                    cell.setPiece(selectedPiece);

                    // TODO: piece movement animation?
                    selectedPiece.moveTo(cell.worldLocation);

                    // drop active selection
                    this.selectedCell.unselect();
                    this.selectedCell.setPiece(null);
                    this.selectedCell = null;
                }
            } else {
                if (this.pieceController.attackPiece(this.selectedCell, cell)) {
                    console.log('Attack:');
                    // update game state
                    this.gameState.grid.getByCoords(cell.coordinates.x, cell.coordinates.y).occupiedBy = '';

                    // drop active selection
                    this.selectedCell.unselect();
                    this.selectedCell.setPiece(null);
                    this.selectedCell = null;

                    this.gameState.nextTurn();

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
        this.gameState.nextTurn();

        this.notification = 'Current turn: ' + this.gameState.getCurrentPlayer();

    }

    // Checks for actions and changes
    update () {
        this.pieceController.update();

        this.playerHandler();
        this.enemyHandler();
        this.bossHandler();
        this.collisionHandler();

        this.notificationLabel.text = this.notification;
        this.notificationLabel.setPosition(this.input.mousePointer.position.x + 20, this.input.mousePointer.position.y);

        /*this.collectables.forEachDead(function(collectable) {
            collectable.destroy();
        });*/
       
        // this.xpLabel.text = 'Lvl. ' + this.player.level + ' - ' + this.xp + ' XP / ' + this.xpToNext + ' XP';
        // this.goldLabel.text = this.gold + ' Gold';
        // this.healthLabel.text = this.player.health + ' / ' + this.player.vitality;
    }

    playerHandler() {
        // this.playerMovementHandler();
        
        
        /*if (this.player.alive) {
            

            // Attack towards mouse click
            if (this.game.input.activePointer.isDown) {
                this.playerAttacks.rate = 1000 - (this.player.speed * 4);
                    if (this.playerAttacks.rate < 200) {
                        this.playerAttacks.rate = 200;
                    }
                this.playerAttacks.range = this.player.strength * 3;
                this.attack(this.player, this.playerAttacks);
            }

            // Use spell when spacebar is pressed
            if (this.game.time.now > this.spellCooldown) {
            this.spellLabel.text = "READY!";

                if (this.controls.spell.isDown) {
                    this.playerSpells.rate = 5000;
                    this.playerSpells.range = this.player.strength * 6;
                    this.attack(this.player, this.playerSpells);
                    this.spellCooldown = this.game.time.now + 15000;
                }
            } else {
                this.spellLabel.text = "RECHARGING...";
            }

            if (this.player.health > this.player.vitality) {
                this.player.health = this.player.vitality;
            }

            if (this.xp >= this.xpToNext) {
                this.levelUp();
            }
        }

        if (!this.player.alive) {
            this.deathHandler(this.player);
            this.game.time.events.add(1000, this.gameOver, this);
        }*/
    }

    enemyHandler() {

        /*this.enemies.forEachAlive(function(enemy) {
            if (enemy.visible && enemy.inCamera) {
                this.game.physics.arcade.moveToObject(enemy, this.player, enemy.speed)
                this.enemyMovementHandler(enemy);
            }

        }, this);

        this.enemies.forEachDead(function(enemy) {
            if (this.rng(0, 5)) {
                this.generateGold(enemy);
            } else if (this.rng(0, 2)) {
                this.generatePotion(enemy);
                this.notification = 'The ' + enemy.name + ' dropped a potion!';
            }
            this.xp += enemy.reward;
            this.generateEnemy(this.enemies);
            this.deathHandler(enemy);
        }, this);*/
    }

    bossHandler() {

        // Spawn boss if player obtains enough gold
        /*if (this.gold > this.goldForBoss && !this.bossSpawned) {
            this.bossSpawned = true;
            this.goldForBoss += 5000;
            var boss = this.generateDragon(this.bossColorIndex);
            this.dragonSound.play();
            this.notification = 'A ' + boss.name + ' appeared!';
        }

        this.bosses.forEachAlive(function(boss) {
            if (boss.visible && boss.inCamera) {
                this.game.physics.arcade.moveToObject(boss, this.player, boss.speed)
                this.enemyMovementHandler(boss);
                this.attack(boss, this.bossAttacks);
            }
        }, this);

        this.bosses.forEachDead(function(boss) {;
            this.bossSpawned = false;
            if (this.bossColorIndex === 7) {
                 this.bossColorIndex = 0;
            } else {
                this.bossColorIndex++;
            }

            this.generateGold(boss);
            this.generateChest(boss);
            this.generateVitalityPotion(boss);
            this.generateStrengthPotion(boss);
            this.generateSpeedPotion(boss);
            this.notification = 'The ' + boss.name + ' dropped a potion!';
            this.xp += boss.reward;

            // Make the dragon explode
            var emitter = this.game.add.emitter(boss.x, boss.y, 100);
            emitter.makeParticles('flame');
            emitter.minParticleSpeed.setTo(-200, -200);
            emitter.maxParticleSpeed.setTo(200, 200);
            emitter.gravity = 0;
            emitter.start(true, 1000, null, 100);

            boss.destroy();

        }, this);*/
    }

    collisionHandler() {

        /*this.game.physics.arcade.collide(this.player, this.enemies, this.hit, null, this);
        this.game.physics.arcade.collide(this.player, this.bosses, this.hit, null, this);
        this.game.physics.arcade.collide(this.player, this.bossAttacks, this.hit, null, this);

        this.game.physics.arcade.collide(this.bosses, this.playerAttacks, this.hit, null, this);
        this.game.physics.arcade.collide(this.enemies, this.playerAttacks, this.hit, null, this);
        this.game.physics.arcade.overlap(this.bosses, this.playerAttacks, this.hit, null, this);
        this.game.physics.arcade.overlap(this.enemies, this.playerAttacks, this.hit, null, this);

        this.game.physics.arcade.collide(this.bosses, this.playerSpells, this.hit, null, this);
        this.game.physics.arcade.collide(this.enemies, this.playerSpells, this.hit, null, this);
        this.game.physics.arcade.overlap(this.bosses, this.playerSpells, this.hit, null, this);
        this.game.physics.arcade.overlap(this.enemies, this.playerSpells, this.hit, null, this);

        this.game.physics.arcade.collide(this.obstacles, this.player, null, null, this);
        this.game.physics.arcade.collide(this.obstacles, this.playerAttacks, null, null, this);
        this.game.physics.arcade.collide(this.obstacles, this.enemies, null, null, this);

        this.game.physics.arcade.overlap(this.collectables, this.player, this.collect, null, this);*/
    }

    showLabels() {

        var text = '0';
        const style = { font: '10px Arial', fill: '#100', align: 'center' };

        const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        this.notificationLabel = this.add.text(screenCenterX, 25, text, style);

        /*style = { font: '10px Arial', fill: '#ffd', align: 'center' };
        this.xpLabel = this.add.text(25, this.game.height - 25, text, style);
        this.xpLabel.fixedToCamera = true;

        style = { font: '20px Arial', fill: '#f00', align: 'center' };
        this.healthLabel = this.add.text(225, this.game.height - 50, text, style);
        this.healthLabel.fixedToCamera = true;

        var style = { font: '10px Arial', fill: '#fff', align: 'center' };
        this.goldLabel = this.add.text(this.game.width - 75, this.game.height - 25, text, style);
        this.goldLabel.fixedToCamera = true;

        var style = { font: '10px Arial', fill: '#fff', align: 'center' };
        this.spellLabel = this.add.text(230, this.game.height - 25, text, style);
        this.spellLabel.fixedToCamera = true;*/
    }

    /*attack (attacker, attacks) {

        if (attacker.alive && this.time.now > attacks.next && attacks.countDead() > 0) {
            attacks.next = this.time.now + attacks.rate;
            var a = attacks.getFirstDead();
            a.scale.setTo(1.5);
            a.name = attacker.name;
            a.strength = attacker.strength;
            a.setPosition(attacker.x + 16, attacker.y + 16);
            a.lifespan = attacks.rate;
            console.log(attacker.name + " used " + attacks.name + "!");
            if (attacks.name === 'sword') {
                a.rotation = this.physics.moveToObject(a, attacks.range);
                this.attackSound.play();
            } else if (attacks.name === 'spell') {
                a.rotation = this.physics.moveToObject(a, attacks.range);
                a.effect = 'spell';
                a.strength *= 3;
                this.fireballSound.play();
            } else if (attacks.name === 'fireball') {
                a.rotation = this.physics.moveToObject(a, this.player, attacks.range);
                this.fireballSound.play();
            }
        }
    }*/

    /*generateAttacks (name, amount, rate, range) {

        // Generate the group of attack objects
        var attacks = this.add.group();
        attacks.enableBody = true;
        attacks.physicsBodyType = Phaser.Physics.ARCADE;

        var groupConfig = {
            key: name,
            quantity: amount,
            classType: Phaser.GameObjects.TileSprite;
        };
        attacks.createMultiple(groupConfig);

        attacks.createMultipleCallback = (items: Phaser.GameObjects.GameObject[]) => {
            items.forEach((obj: Phaser.GameObjects.GameObject) => {
                let sprite: Phaser.GameObjects.Sprite = obj;
            });
        };

        // attacks.createMultiple(amount, name);

        if (name === 'spell') {
            attacks.callAll('animations.add', 'animations', 'particle', [0, 1, 2, 3,4 ,5], 10, true);
            attacks.callAll('animations.play', 'animations', 'particle');
        } else if (name === 'fireball') {
            attacks.callAll('animations.add', 'animations', 'particle', [0, 1, 2, 3], 10, true);
            attacks.callAll('animations.play', 'animations', 'particle');
        }

        attacks.setAll('anchor.x', 0.5);
        attacks.setAll('anchor.y', 0.5);
        attacks.setAll('outOfBoundsKill', true);
        attacks.setAll('checkWorldBounds', true);

        attacks.rate = rate;
        attacks.range = range;
        attacks.next = 0;
        attacks.name = name;

        return attacks;
    }*/

    hit (target, attacker) {

        /* 
        if (this.game.time.now > target.invincibilityTime) {
            target.invincibilityTime = this.game.time.now + target.invincibilityFrames;
            target.damage(attacker.strength)
            if (target.health < 0) {
                target.health = 0;
            }
            this.playSound(target.name);
            this.notification = attacker.name + ' caused ' + attacker.strength + ' damage to ' + target.name + '!';

            if (attacker.effect === 'spell') {
                var emitter = this.game.add.emitter(attacker.x, attacker.y, 100);
                emitter.makeParticles('spellParticle');
                emitter.minParticleSpeed.setTo(-200, -200);
                emitter.maxParticleSpeed.setTo(200, 200);
                emitter.gravity = 0;
                emitter.start(true, 1000, null, 100);
            }
        } 
        */
    }

    deathHandler (target) {

        /*var corpse = this.corpses.create(target.x, target.y, 'dead')
        corpse.scale.setTo(2);
        corpse.animations.add('idle', [target.corpseSprite], 0, true);
        corpse.animations.play('idle');
        corpse.lifespan = 3000;
        target.destroy();*/
    }

    collect(player, collectable) {

        /*if (!collectable.collected) {
            collectable.collected = true;
            var gain;
            if (collectable.name === 'gold') {
                gain = this.player.level + Math.floor(Math.random() * 10);
                this.gold += collectable.value;
                this.goldSound.play();
                this.notification = 'You pick up ' + collectable.value + ' gold.';
                collectable.destroy();
            } else if (collectable.name === 'chest') {
                collectable.animations.play('open');
                this.gold += collectable.value;
                this.goldSound.play();
                this.notification = 'You open a chest and find ' + collectable.value + ' gold!';
                collectable.lifespan = 1000;
            } else if (collectable.name === 'healthPotion') {
                player.health += collectable.value;
                this.notification = 'You consume a potion, healing you for ' + collectable.value + ' health.';
                this.potionSound.play();
                collectable.destroy();
            } else if (collectable.name === 'vitalityPotion') {
                player.vitality += collectable.value;
                this.notification = 'You consume a potion, increasing your vitality by ' + collectable.value + '!';
                this.potionSound.play();
                collectable.destroy();
            } else if (collectable.name === 'strengthPotion') {
                player.strength += collectable.value;
                this.notification = 'You consume a potion, increasing your strength by ' + collectable.value + '!';
                this.potionSound.play();
                collectable.destroy();
            } else if (collectable.name === 'speedPotion') {
                player.speed += collectable.value;
                this.notification = 'You consume a potion, increasing your speed by  ' + collectable.value + '!';
                this.potionSound.play();
                collectable.destroy();
            }

        }*/
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

    setStats (entity: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody, name, health, speed, strength, reward, corpseSprite) {

        entity.anims.play('down');
        entity.scale = 2;

        entity.body.collideWorldBounds = true;
        entity.body.velocity.x = 0;
        entity.body.velocity.y = 0;
        // entity.alive = true;

        // entity.name = name;
        // entity.level = this.player.level;
        // entity.health = health + (entity.level * 2);
        // entity.speed = speed + Math.floor(entity.level * 1.5);;
        // entity.strength = strength + Math.floor(entity.level * 1.5);;
        // entity.reward = reward + Math.floor(entity.level * 1.5);

        // entity.invincibilityFrames = 300;
        // entity.invincibilityTime = 0;

        // entity.corpseSprite = corpseSprite;

        return entity;
    }

    /*generateEnemies (count) {

        this.enemies = this.physics.add.group();

        for (var i = 0; i < count; i++) {
            this.generateEnemy();
        }
    }

    generateEnemy () {

        let width = this.physics.world.bounds.width;
        let height = this.physics.world.bounds.height;

        let enemy: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody = this.enemies.create(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), 'characters');

        do {
            enemy.setPosition(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height));
        } while (Phaser.Math.Distance.Between(this.player.object!.x, this.player.object!.y, enemy.x, enemy.y) <= 400)

        var rnd = Math.random();
        if (rnd >= 0 && rnd < .4) enemy = this.generateSkeleton(enemy);
        else if (rnd >= .4 && rnd < .8) enemy = this.generateSlime(enemy);
        else if (rnd >= .8 && rnd < 1) enemy = this.generateBat(enemy);

        // console.log('Generated ' + enemy.name + ' with ' + enemy.health + ' health, ' + enemy.strength + ' strength, and ' + enemy.speed + ' speed.');

        return enemy;
    }*/

    /*generateSkeleton (enemy: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {

        this.setUpSpriteAnim(enemy, 'characters', 'down', 9, 11);
        this.setUpSpriteAnim(enemy, 'characters', 'left', 21, 23);
        this.setUpSpriteAnim(enemy, 'characters', 'right', 33, 35);
        this.setUpSpriteAnim(enemy, 'characters', 'up', 45, 47);

        return this.setStats(enemy, 'Skeleton', 100, 70, 20, 5, 6);
    }

    generateSlime (enemy: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {
        this.setUpSpriteAnim(enemy, 'characters', 'down', 48, 50);
        this.setUpSpriteAnim(enemy, 'characters', 'left', 60, 62);
        this.setUpSpriteAnim(enemy, 'characters', 'right', 72, 74);
        this.setUpSpriteAnim(enemy, 'characters', 'up', 84, 86);

        return this.setStats(enemy, 'Slime', 300, 40, 50, 10, 7);
    }

    generateBat (enemy: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {
        this.setUpSpriteAnim(enemy, 'characters', 'down', 51, 53);
        this.setUpSpriteAnim(enemy, 'characters', 'left', 63, 65);
        this.setUpSpriteAnim(enemy, 'characters', 'right', 75, 77);
        this.setUpSpriteAnim(enemy, 'characters', 'up', 87, 89);

        return this.setStats(enemy, 'Bat', 20, 200, 10, 2, 8);
    }*/

    /*generateObstacles() {

        this.obstacles = this.physics.add.staticGroup();
        // this.obstacles.enableBody = true;

        // load obstacle sprites
        this.setUpGlobalAnim('tiles', 'tree', 38);
        this.setUpGlobalAnim('tiles', 'shrub', 20);
        this.setUpGlobalAnim('tiles', 'pine', 30);
        this.setUpGlobalAnim('tiles', 'column', 39);

        var amount = 300;
        for (var i = 0; i < amount; i++) {
            let point = this.getRandomLocation();
    
            let probability = Math.random();
            
            var obstacleKey = 'tree';
            if (probability < 0.4) {

            } else if (probability >= 0.4 && probability < 0.6) {
                obstacleKey = 'shrub';
            } else if (probability >= 0.6 && probability < 0.8) {
                obstacleKey = 'pine';
            } else if (probability >= 0.8) {
                obstacleKey = 'column';
            }

            this.generateObstacle(point, obstacleKey);
        }
    }

    generateObstacle (location, obstacleKey) {

        let obstacle: Phaser.Types.Physics.Arcade.SpriteWithStaticBody = this.obstacles.create(location.x, location.y, 'tiles');

        obstacle.anims.play(obstacleKey);
        
        obstacle.scale = 2;
        obstacle.body.setSize(8, 8);
        obstacle.body.setOffset(4, -2);
        // StaticBody will do the trick
        // obstacle.body.moves = false;

        return obstacle;
    }*/

    /*generateCollectables () {

        this.collectables = this.add.group();
        this.collectables.enableBody = true;
        this.collectables.physicsBodyType = Phaser.Physics.ARCADE;

        var amount = 100;
        for (var i = 0; i < amount; i++) {
            var point = this.getRandomLocation();
            this.generateChest(point);
        }
        
    }*/

    /*generateChest (location) {

        
        var collectable = this.collectables.create(location.x, location.y, 'things');
        collectable.scale.setTo(2);
        collectable.animations.add('idle', [6], 0, true);
        collectable.animations.add('open', [18, 30, 42], 10, false);
        collectable.animations.play('idle');
        collectable.name = 'chest'
        collectable.value = Math.floor(Math.random() * 150);

        return collectable;
        
    }*/

    /*generateGold (enemy) {
        
        var collectable = this.collectables.create(enemy.x, enemy.y, 'tiles');
        collectable.animations.add('idle', [68], 0, true);
        collectable.animations.play('idle');
        collectable.name = 'gold';
        collectable.value = enemy.reward * 2;
        return collectable;
    }

    generatePotion (location) {

        var rnd = Math.random();
        if (rnd >= 0 && rnd < .7) {
            this.generateHealthPotion(location);
        } else if (rnd >= .7 && rnd < .8) {
            this.generateVitalityPotion(location);
        } else if (rnd >= .8 && rnd < .9) {
            this.generateStrengthPotion(location);
        } else if (rnd >= .9 && rnd < 1) {
            this.generateSpeedPotion(location);
        }
    }

    generateHealthPotion (location) {
        var collectable = this.collectables.create(location.x, location.y, 'potions');
        collectable.animations.add('idle', [0], 0, true);
        collectable.animations.play('idle');
        collectable.name = 'healthPotion'
        collectable.value = 20 + Math.floor(Math.random() * 10) + this.player.level;
        return collectable;
    }

    generateVitalityPotion (location) {

        var collectable = this.collectables.create(location.x, location.y, 'potions');
        collectable.animations.add('idle', [2], 0, true);
        collectable.animations.play('idle');
        collectable.name = 'vitalityPotion'
        collectable.value = 4 + Math.floor(Math.random() * 10);
        return collectable;
    }

    generateStrengthPotion (location) {

        var collectable = this.collectables.create(location.x, location.y, 'potions');
        collectable.animations.add('idle', [3], 0, true);
        collectable.animations.play('idle');
        collectable.name = 'strengthPotion'
        collectable.value = 1 + Math.floor(Math.random() * 10);
        return collectable;
    }

    generateSpeedPotion (location) {

        var collectable = this.collectables.create(location.x, location.y, 'potions');
        collectable.animations.add('idle', [4], 0, true);
        collectable.animations.play('idle');
        collectable.name = 'speedPotion'
        collectable.value = 1 + Math.floor(Math.random() * 10);
        return collectable;
        
    }

    playSound (name) {

        if (name === this.player.object!.name) {
            this.playerSound.play();

        } else if (name === 'Skeleton') {
            this.skeletonSound.play();

        } else if (name === 'Slime') {
            this.slimeSound.play();

        } else if (name === 'Bat') {
            this.batSound.play();

        } else if (name === 'Ghost') {
            this.ghostSound.play();

        } else if (name === 'Spider') {
            this.spiderSound.play();

        } else if (name === 'Dragon') {
             this.dragonSound.play();
         }
    }
    */

    generateSounds () {

        this.attackSound = this.sound.add('attackSound');
        this.batSound = this.sound.add('batSound');
        this.fireballSound = this.sound.add('fireballSound');
        this.dragonSound = this.sound.add('dragonSound');
        this.ghostSound = this.sound.add('ghostSound');
        this.goldSound = this.sound.add('goldSound');
        this.levelSound = this.sound.add('levelSound');
        this.playerSound = this.sound.add('playerSound');
        this.potionSound = this.sound.add('potionSound');
        this.skeletonSound = this.sound.add('skeletonSound');
        this.slimeSound = this.sound.add('slimeSound');
        this.spiderSound = this.sound.add('spiderSound');
    }

    /*playerMovementHandler () {
        let playerBody = this.player.object!.body;

        // Up-Left
        if (this.controls.up.isDown && this.controls.left.isDown) {
            playerBody.velocity.x = -this.player.traits.speed;
            playerBody.velocity.y = -this.player.traits.speed;
            this.player.object!.play('left');

        // Up-Right
        } else if (this.controls.up.isDown && this.controls.right.isDown) {
            playerBody.velocity.x = this.player.traits.speed;
            playerBody.velocity.y = -this.player.traits.speed;
            this.player.object!.play('right');

        // Down-Left
        } else if (this.controls.down.isDown && this.controls.left.isDown) {
            playerBody.velocity.x = -this.player.traits.speed;
            playerBody.velocity.y = this.player.traits.speed;
            this.player.object!.play('left');

        // Down-Right
        } else if (this.controls.down.isDown && this.controls.right.isDown) {
            playerBody.velocity.x = this.player.traits.speed;
            playerBody.velocity.y = this.player.traits.speed;
            this.player.object!.play('right');

        // Up
        } else if (this.controls.up.isDown) {
            playerBody.velocity.x = 0;
            playerBody.velocity.y = -this.player.traits.speed;
            this.player.object!.play('up');

        // Down
        } else if (this.controls.down.isDown) {
            playerBody.velocity.x = 0;
            playerBody.velocity.y = this.player.traits.speed;
            this.player.object!.play('down');

        // Left
        } else if (this.controls.left.isDown) {
            playerBody.velocity.x = -this.player.traits.speed;
            playerBody.velocity.y = 0;
            this.player.object!.play('left');

        // Right
        } else if (this.controls.right.isDown) {
            playerBody.velocity.x = this.player.traits.speed;
            playerBody.velocity.y = 0;
            this.player.object!.play('right');

        // Still
        } else {
            playerBody.velocity.x = 0;
            playerBody.velocity.y = 0;
            this.player.object!.stop();
        }
    }*/

    enemyMovementHandler (enemy) {

        // Left
        if (enemy.body.velocity.x < 0 && enemy.body.velocity.x <= -Math.abs(enemy.body.velocity.y)) {
             enemy.animations.play('left');

        // Right
        } else if (enemy.body.velocity.x > 0 && enemy.body.velocity.x >= Math.abs(enemy.body.velocity.y)) {
             enemy.animations.play('right');

        // Up
        } else if (enemy.body.velocity.y < 0 && enemy.body.velocity.y <= -Math.abs(enemy.body.velocity.x)) {
            enemy.animations.play('up');

        // Down
        } else {
            enemy.animations.play('down');
        }
    }

    gameOver() {
        this.corpses.destroy();
        this.collectables.destroy();
        this.playerAttacks.destroy();
        this.enemies.destroy();

		this.music.stop();
		this.music.destroy();

        this.attackSound.destroy();
        this.playerSound.destroy();
        this.skeletonSound.destroy();
        this.slimeSound.destroy();
        this.batSound.destroy();
        this.ghostSound.destroy();
        this.spiderSound.destroy();
        this.goldSound.destroy();

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

    rng (floor, ceiling) {
        floor /= 10;
        ceiling /= 10;
        var rnd = Math.random();
        if (rnd >= floor && rnd < ceiling) {
            return true;
        }
        return false;
    }

    shuffle (array) {
       var currentIndex = array.length, temporaryValue, randomIndex ;

       // While there remain elements to shuffle...
       while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
       }

       return array;
    }
};
