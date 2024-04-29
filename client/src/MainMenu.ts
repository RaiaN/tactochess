import { Scene } from 'phaser';

export class MainMenu extends Scene
{
    highestScore: integer;
	music: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound;
	background: Phaser.GameObjects.TileSprite;
	splash: Phaser.GameObjects.Image;
	score: Phaser.GameObjects.Text;
	instructions: Phaser.GameObjects.Text;
	playButton: Phaser.GameObjects.Text;
	
	constructor ()
    {
        super('MainMenu');
    }

    init(score) {

        score = score || 0;
        this.highestScore = this.highestScore || 0;
        this.highestScore = Math.max(score, this.highestScore);
    }

	create () {

		// We've already preloaded our assets, so let's kick right into the Main Menu itself.
		// Here all we're doing is playing some music and adding a picture and button
		// Naturally I expect you to do something significantly better :)

		this.music = this.sound.add('openingMusic');
		this.music.loop = true;
		// this.music.play();

		let { width, height } = this.sys.game.canvas;

		this.background = this.add.tileSprite(0, 0, width, height, 'tiles', 92)
			.setOrigin(0);

		// Give it speed in x
		// this.background.autoScroll(-20, 0);

		this.splash = this.add.image(width/2, height/2, 'logo');
		this.splash.setOrigin(0.5);

        // High score
        let text = "High score: "+ this.highestScore;
        let style = { font: "15px Arial", fill: "#fff", align: "center" };

        this.score = this.add.text(width/2, height - 50, text, style);
        this.score.setOrigin(0.5);

        // Instructions
        text = "Move: WASD Keys   Attack: Hold Left-Mouse Button   Spell: Spacebar";
        style = { font: "15px Arial", fill: "#fff", align: "center" };

        this.instructions = this.add.text(width/2, height - 25, text, style);
        this.instructions.setOrigin(0.5);

		this.playButton = this.add.text(width/2, height/2 + 100, 'playButton').setInteractive();
		this.playButton.setOrigin(0.5);

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
        this.score.shutdown();
        this.instructions.shutdown();
        this.background.shutdown();
        this.playButton.shutdown();
    }
};
