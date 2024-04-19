import { Scene } from 'phaser';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }
    
    init () {

        //  Unless you specifically know your game needs to support multi-touch I would recommend setting this to 1
        // this.input.maxPointers = 1;

        //  Phaser will automatically pause if the browser tab the game is in loses focus. You can disable that here:
        // this.stage.disableVisibilityChange = true;

        /*if (this.game.device.os.desktop)
        {
            //  If you have any desktop specific settings, they can go in here
            this.scale.pageAlignHorizontally = true;
        }
        else
        {
            //  Same goes for mobile settings.
            //  In this case we're saying "scale the game, no lower than 480x260 and no higher than 1024x768"
            this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
            this.scale.setMinMax(480, 260, 1024, 768);
            this.scale.forceLandscape = true;
            this.scale.pageAlignHorizontally = true;
        }*/
    }

    preload () {

        //  Here we load the assets required for our preloader (in this case a background and a loading bar)
        // this.load.image('preloaderBackground', 'images/preloader_background.jpg');
        this.load.image('logo', 'assets/images/logo.png');
        this.load.image('preloaderBar', 'assets/images/preload-bar.png');
    }

    create () {

        //  By this point the preloader assets have loaded to the cache, we've set the game settings
        //  So now let's start the real preloader going
        this.scene.start('Preloader');
    }
};