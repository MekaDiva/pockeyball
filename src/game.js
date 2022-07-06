import * as THREE from "three";
import { gsap } from "gsap";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import Objects from "game/objects";
import Player from "game/player";
import Ui from "game/ui";
import Tools from "game/tools";
import CollisionDetection from "game/collisionDetection";

const skyFloorTexture = process.env.PUBLIC_URL + "/img/sky.jpg";

export const sceneConfiguration = {
    FPS: 30,

    // Stage of the game
    stageGame: {
        readyStage: 0,
        runningStage: 1,
        finishStage: 2,
    },

    // Whether the scene is ready
    sceneReady: false,

    // Whether the game is on pause
    isPause: false,

    // Whether the player is moving
    playerMoving: false,

    // Collected game data
    data: {
        // How many oil the player has collected on this run
        oilCollected: 0,
    },

    // The target of number of oil collected
    targetOilCollected: 10,

    // The length of the current level, increases as levels go up
    courseLength: 500,

    // How far the player is through the current level, initialises to zero.
    courseProgress: 0,

    // How for between each line of Obstacles
    lengthBetweenObstacle: 15,

    // Number of maximum oil in a line
    maximumOilInLine: 3,

    // Whether the level has finished
    levelOver: false,

    // Gives the completion amount of the course thus far, from 0.0 to 1.0.
    coursePercentComplete: () => sceneConfiguration.courseProgress / sceneConfiguration.courseLength,

    // Whether the start animation is playing (the circular camera movement while looking at the ship)
    cameraStartAnimationPlaying: false,

    // The current speed of the player, unit/second
    playerSpeed: 10,
};

class Game extends THREE.EventDispatcher {
    constructor() {
        super();

        this.totalNumberOfObjects = 4;

        this.init = this.init.bind(this);
        this.keypress = this.keypress.bind(this);
        this.update = this.update.bind(this);
        this.playableResize = this.playableResize.bind(this);
        this.reset = this.reset.bind(this);
        this.pause = this.pause.bind(this);
        this.mousemove = this.mousemove.bind(this);
        this.movePlayer = this.movePlayer.bind(this);
        this.playerCollectOil = this.playerCollectOil.bind(this);
        this.playerTouchObstacle = this.playerTouchObstacle.bind(this);
        this.playerSuccess = this.playerSuccess.bind(this);

        this.objects = null;
        this.player = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.cameraControls = null;
        this.stats = null;
        this.positionRatio = null;
    }

    init() {
        console.log("init");

        // Document configuration
        document.backgroundColor = "#FFFFFF";
        document.body.style.margin = 0;
        document.body.style.display = "block";
        document.body.style["background-color"] = "#FFFFFF";
        document.body.style.color = "#fff";
        document.body.style.overflow = "hidden";

        this.initEngine();
        this.initGame();
        this.initEvents();
        this.debug();

        //START ENGINE
        gsap.ticker.fps(sceneConfiguration.FPS);
        gsap.ticker.add(this.update);
        //this.update();
    }

    initEngine() {
        // Scene configuration
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x008011);
        this.scene.fog = new THREE.Fog(0x008011, 10, 50);

        // Light configuration
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
        hemiLight.color.setHSL(0.6, 1, 0.6);
        hemiLight.groundColor.setHSL(0.095, 1, 0.75);
        hemiLight.position.set(0, 50, 0);
        this.scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.color.setHSL(0.1, 1, 0.95);
        dirLight.position.set(1, 1.75, 1);
        dirLight.position.multiplyScalar(30);
        this.scene.add(dirLight);

        dirLight.castShadow = true;

        dirLight.shadow.mapSize.width = 2048 * 100;
        dirLight.shadow.mapSize.height = 2048 * 100;

        const d = 50;

        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;

        dirLight.shadow.camera.far = 250000;
        dirLight.shadow.bias = 0.0001;

        // Renderer configuration
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.shadowMap.enabled = true;
        this.renderer.toneMapping = THREE.LinearToneMapping;
        document.body.appendChild(this.renderer.domElement);

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(5, 4, 5);

        const axesHelper = new THREE.AxesHelper(3);
        this.scene.add(axesHelper);

        this.cameraControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.cameraControls.enablePan = false;
        this.cameraControls.enableZoom = true;
        //this.cameraControls.maxPolarAngle = Math.PI / 2;
        this.cameraControls.target.set(0, 2, 0);
        this.cameraControls.update();
    }

    initGame() {
        // Init the UI
        Ui.init();

        // Add the surrounding objects
        this.objects = new Objects();
        
        this.objects.init();

        this.scene.add(this.objects);

        // Add the player
        this.player = new Player();
        this.player.init();

        this.player.addPlayer();

        this.scene.add(this.player);
    }

    initEvents() {
        // Add event handlers for the resize of window
        window.addEventListener("resize", this.playableResize, false);

        // Add event handlers for clicking
        document.addEventListener("keypress", this.keypress, false);

        // Add event handlers for mousemove
        document.addEventListener("mousemove", this.mousemove, false);
    }

    debug() {
        // Add the stats ui
        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);
    }

    keypress(e) {
        if (e.key == "1") {
            this.start();
        }

        if (e.key == "2") {
            this.reset();
        }

        // if (e.key == "a") {
        //     this.moveLeft();
        // }

        // if (e.key == "d") {
        //     this.moveRight();
        // }
    }

    mousemove(e) {
        this.positionRatio = e.clientX / window.innerWidth;
    }

    update() {
        if (!sceneConfiguration.isPause) {
            // Update the stats ui in the scene
            this.stats.update();

            // Update the objects in the scene
            this.objects.update();

            // Update the player in the scene
            this.player.update();

            // Render the scene
            this.renderer.render(this.scene, this.camera);

            // console.log(this.renderer.info.render.triangles + " tri");
            // console.log(this.renderer.info.render.calls+ " call");

            if (sceneConfiguration.playerMoving) {
                // Move the scene to the back
                this.objects.translateZ(-sceneConfiguration.playerSpeed / sceneConfiguration.FPS);

                // Move the player according to the mouse ratio
                this.movePlayer(this.positionRatio);

                // Detect the collision
                CollisionDetection.detectCollisions();
            }
        }
    }

    playableResize() {
        console.log("playableResize");

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        //Force iOS view resize
        setTimeout(() => {
            window.scrollTo(0, 1);
        }, 500);
    }

    start() {
        console.log("start");

        sceneConfiguration.playerMoving = true;
        this.player.idleClip.stop();
        this.player.runClip.play();
    }

    reset() {
        console.log("reset");

        // Reset the player
        sceneConfiguration.playerMoving = false;
        this.player.position.set(0, 0, 0);
        this.player.runClip.stop();
        this.player.idleClip.play();
        this.objects.position.set(0, 0, 0);

        // Reset all the objects
        this.objects.destroy();
        this.objects.init();
        this.objects.addPath(sceneConfiguration.courseLength);

        // Reset the UI
        sceneConfiguration.data.oilCollected = 0;
        Ui.showCurrentOilScore();
        Ui.toggleStartButton(true);
    }

    pause() {
        console.log("pause");

        sceneConfiguration.isPause = true;
    }

    movePlayer(positionRatio) {
        // Reduce the control to the 0.2 to 0.8 of the screen width
        let controlRatio = Tools.remapValue(0.2, 0.8, positionRatio, 0, 1);
        //console.log("Control ratio: " + controlRatio);

        let playerX = Tools.lerp(2.5, -2.5, controlRatio);
        // console.log("playerX: " + playerX);
        this.player.position.set(playerX, 0, 0);
    }

    playerCollectOil() {
        sceneConfiguration.data.oilCollected += 1;
        console.log("oilCollected: " + sceneConfiguration.data.oilCollected);
        Ui.showCurrentOilScore();

        if (sceneConfiguration.data.oilCollected == sceneConfiguration.targetOilCollected) {
            this.playerSuccess();
        }
    }

    playerTouchObstacle() {
        console.log("Mission failed");

        sceneConfiguration.playerMoving = false;
        this.player.runClip.stop();
        this.player.idleClip.play();

        Ui.toggleAlert(true, "Mission failed");
        gsap.delayedCall(2, () => {
            Ui.toggleAlert(false);
        });
        gsap.delayedCall(2, () => {
            Ui.toggleResetButton(true);
        });
    }

    playerSuccess() {
        console.log("Mission success");

        sceneConfiguration.playerMoving = false;
        this.player.runClip.stop();
        this.player.idleClip.play();

        Ui.toggleAlert(true, "Mission success");
        gsap.delayedCall(2, () => {
            Ui.toggleAlert(false);
        });
        gsap.delayedCall(2, () => {
            Ui.toggleResetButton(true);
        });
    }
}

export default new Game();
