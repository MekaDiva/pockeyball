import * as THREE from "three";
import Game from "../game";

class CollisionDetection extends THREE.EventDispatcher {
    constructor() {
        super();

        this.detectCollisions = this.detectCollisions.bind(this);
    }

    detectCollisions () {
        // Create a box for the player on its barrel
        const playerBox = new THREE.Box3().setFromObject(Game.player.astro);

        
        Game.objects.obstaclesContainer.children.forEach(element => {
            const obstacleBox = new THREE.Box3().setFromObject(element);

            if (obstacleBox.intersectsBox(playerBox)) {
                Game.playerTouchObstacle();
            }
        });

        Game.objects.awardsContainer.children.forEach(element => {
            const awardBox = new THREE.Box3().setFromObject(element);

            if (awardBox.intersectsBox(playerBox)) {
                Game.objects.awardsContainer.remove(element);

                Game.playerCollectOil();
            }
        });
    }
}

export default new CollisionDetection();