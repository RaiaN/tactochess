
import { Scene } from 'phaser';

export class Preloader extends Scene
{
	splash: Phaser.GameObjects.Sprite;
	preloadBar: Phaser.GameObjects.Sprite;
	ready: boolean;

	constructor ()
	{
		super('Preloader');
	}

	preload () {

		this.ready = false;

		let worldX = this.cameras.main.midPoint.x;
		let worldY = this.cameras.main.midPoint.y;

		//	These are the assets we loaded in Boot.js
		//	A nice sparkly background and a loading progress bar
		this.splash = this.add.sprite(worldX, worldY, 'logo');
		this.splash.setOrigin(0.5);

		this.preloadBar = this.add.sprite(worldX, worldY + 128, 'preloaderBar');
		this.preloadBar.setOrigin(0.5);

		//	This sets the preloadBar sprite as a loader sprite.
		//	What that does is automatically crop the sprite from 0 to full-width
		//	as the files below are loaded in.
		// this.load.setPreloadSprite(this.preloadBar);

		//	Here we load the rest of the assets our game needs.
		this.load.image('playButton', 'assets/images/play.png');
		this.load.image('flame', 'assets/images/flame.png');
		this.load.image('sword', 'assets/images/sword.png');
		this.load.image('levelParticle', 'assets/images/level-particle.png');
		this.load.image('spellParticle', 'assets/images/spell-particle.png');

		this.load.spritesheet('tiles', 'assets/images/tiles.png', { frameWidth: 16, frameHeight: 16 });
		this.load.spritesheet('things', 'assets/images/things.png', { frameWidth: 16, frameHeight: 16 });
		this.load.spritesheet('characters', 'assets/images/characters.png', { frameWidth: 16, frameHeight: 16 });
		this.load.spritesheet('dead', 'assets/images/dead.png', { frameWidth: 16, frameHeight: 16 });
		this.load.spritesheet('potions', 'assets/images/potions.png', { frameWidth: 16, frameHeight: 16 });
		this.load.spritesheet('dragons', 'assets/images/dragons.png', { frameWidth: 32, frameHeight: 32 });
		this.load.spritesheet('fireball', 'assets/images/fireball.png', { frameWidth: 16, frameHeight: 16 });
		this.load.spritesheet('spell', 'assets/images/spell.png', { frameWidth: 12, frameHeight: 12 });

		this.load.audio('openingMusic', 'assets/sound/opening.ogg');

		this.load.audio('overworldMusic', 'assets/sound/overworld.ogg');
		this.load.audio('attackSound', 'assets/sound/attack.wav');
		this.load.audio('playerSound', 'assets/sound/player.wav');
		this.load.audio('skeletonSound', 'assets/sound/skeleton.wav');
		this.load.audio('slimeSound', 'assets/sound/slime.wav');
		this.load.audio('batSound', 'assets/sound/bat.wav');
		this.load.audio('ghostSound', 'assets/sound/ghost.wav');
		this.load.audio('spiderSound', 'assets/sound/spider.wav');
		this.load.audio('goldSound', 'assets/sound/gold.wav');
		this.load.audio('potionSound', 'assets/sound/potion.ogg');
		this.load.audio('levelSound', 'assets/sound/level.ogg');
		this.load.audio('fireballSound', 'assets/sound/fireball.wav');
		this.load.audio('dragonSound', 'assets/sound/dragon.wav');
	}

	create () {

		//	Once the load has finished we disable the crop because we're going to sit in the update loop for a short while as the music decodes
		this.preloadBar.isCropped = false;

		/* when the Scene's `create` method is called you are guaranteed that all of those assets are ready for use and have been loaded.*/
		// TODO: BUT AUDIO MIGHT NOT BE DECODED ?
	}
 
	update() {

		//	You don't actually need to do this, but I find it gives a much smoother game experience.
		//	Basically it will wait for our audio file to be decoded before proceeding to the MainMenu.
		//	You can jump right into the menu if you want and still play the music, but you'll have a few
		//	seconds of delay while the mp3 decodes - so if you need your music to be in-sync with your menu
		//	it's best to wait for it to decode here first, then carry on.
		
		//	If you don't have any music in your game then put the game.state.start line into the create function and delete
		//	the update function completely.
		
		if (this.ready == false)
		{
			this.ready = true;
			this.scene.start('MainMenu');
		}
	}
};
