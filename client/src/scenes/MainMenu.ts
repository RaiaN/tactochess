import { Scene } from 'phaser';

export class MainMenu extends Scene
{
	music: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound;
	background: Phaser.GameObjects.TileSprite;
	splash: Phaser.GameObjects.Image;
	// playButton: Phaser.GameObjects.Text;
	playButton: Phaser.GameObjects.Image;
	
	constructor ()
    {
        super('MainMenu');
    }

	create () {

		// We've already preloaded our assets, so let's kick right into the Main Menu itself.
		// Here all we're doing is playing some music and adding a picture and button
		// Naturally I expect you to do something significantly better :)

		this.music = this.sound.add('openingMusic');
		this.music.loop = true;
		this.music.play();

		let { width, height } = this.sys.game.canvas;

		this.background = this.add.tileSprite(0, 0, width, height, 'tiles', 92).setOrigin(0);

		// Give it speed in x
		// this.background.autoScroll(-20, 0);

		this.splash = this.add.image(width/2, height/2, 'logo');
		this.splash.setOrigin(0.5);

		this.playButton = this.add.image(width/2, height/2, 'playButton').setInteractive();

		this.playButton.on('pointerdown', this.startGame, this); // Start game on click.
		
	}

	update () {
		this.background.tilePositionX += 1;
	}

	startGame (pointer) {

		// Ok, the Play Button has been clicked or touched, so let's stop the music (otherwise it'll carry on playing)
		this.sound.stopByKey('openingMusic')
	
		// And start the actual game
		this.scene.start('TactonGame');
	}

	shutdown () {

	    this.music.shutdown();
	    this.splash.shutdown();
        this.background.shutdown();
        this.playButton.shutdown();
    }
};
