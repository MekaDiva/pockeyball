import Game from './game';
import gsap from 'gsap';

export default class Playable {

    constructor() {

        //let game = new Game();

        // Start the game after 0.5 seconds
        gsap.delayedCall(.5, Game.init);

    }

}

//Launch
new Playable();