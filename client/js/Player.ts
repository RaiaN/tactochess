import Phaser from 'phaser';

type PlayerTraits = {
    speed: number;
}

export class Player
{
    scene: Phaser.Scene;

    object: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null;
    traits: PlayerTraits;
    
    constructor(scene: Phaser.Scene)
    {
        this.scene = scene;

        let centerX = 0; // this.scene.physics.world.bounds.centerX;
        let centerY = 0; // this.scene.physics.world.bounds.centerY;

        this.object = this.scene.physics.add.sprite(centerX, centerY, 'characters');

        var config = {
            key: 'down',
            frames: this.scene.anims.generateFrameNumbers("characters", {
                start: 3,
                end: 5
            }),
            frameRate: 10,
            repeat: -1
        };

        this.object.anims.create(config);

        config = {
            key: 'left',
            frames: this.scene.anims.generateFrameNumbers("characters", {
                start: 15,
                end: 17
            }),
            frameRate: 10,
            repeat: -1
        };

        this.object.anims.create(config);

        config = {
            key: 'right',
            frames: this.scene.anims.generateFrameNumbers("characters", {
                start: 27,
                end: 29
            }),
            frameRate: 10,
            repeat: -1
        };

        this.object.anims.create(config);

        config = {
            key: 'up',
            frames: this.scene.anims.generateFrameNumbers("characters", {
                start: 39,
                end: 41
            }),
            frameRate: 10,
            repeat: -1
        };

        this.object.anims.create(config);

        this.object.anims.play('down');
        this.object.scale = 2;

        // Enable player physics;
        this.object.body.enable = true;
        this.object.body.collideWorldBounds = true;
        // player.alive = true;

        this.object.name = 'Tacton';

        this.traits = {
            speed: 125
        }

        /*player.level = 1;
        

        player.health = 100;
        player.vitality = 100;
        player.strength = 25;
        player.speed = 125;

        player.invincibilityFrames = 500;
        player.invincibilityTime = 0;

        player.corpseSprite = 1;*/
    }

    destroy() {
        this.object?.destroy();
        this.object = null;
    }
};