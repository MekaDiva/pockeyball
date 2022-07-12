import * as THREE from "three";
import { gsap } from "gsap";
import { FlakesTexture } from "three/examples/jsm/textures/FlakesTexture.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import Game, { sceneConfiguration } from "../game";
import Tools from "game/tools";

const beakGlbFilePath = process.env.PUBLIC_URL + "/models/beakWithBall.glb";
const ballTexturePath = process.env.PUBLIC_URL + "/img/ball.jpg";
const ballLightMapPath = process.env.PUBLIC_URL + "/img/latexballoonmatcap.png";
const ballEnvMapPath = process.env.PUBLIC_URL + "/img/2_env.jpg";

export default class Player extends THREE.Object3D {
    constructor() {
        super();

        this.init = this.init.bind(this);
        this.update = this.update.bind(this);
        this.destroy = this.destroy.bind(this);

        // Init all the loaders
        this.textureLoader = new THREE.TextureLoader();
        this.glftLoader = new GLTFLoader();

        // The glb file loaded from loader of the beak
        this.beakGlb = null;

        // The scene of the beak model, an object3d
        this.beakScene = null;

        // The mesh of the ball attached to the beak
        this.ballMesh = null;

        // The animation mixer
        this.mixer = null;

        // The bend of the beak
        this.beakBendClip = null;

        // The clip of successfully stab in the path
        this.beakStabSuccessClip = null;

        // The clip of failling to stab in the path
        this.beakStabFailedClip = null;

        // The clip of withdraw the beak
        this.beakWithdrawClip = null;

        // The bend of the ball
        this.ballBendClip = null;

        // The shake of the ball
        this.ballShakeClip = null;

        // Is the beak is being pressed
        this.isBeingPressed = false;

        // Is the beak is attached to the column
        this.isAttached = true;

        // The hight of the ball
        this.ballHeight = 0;

        // The initial height and initial speed and the initial time when launched into the sky
        this.h0 = null;
        this.v0 = null;
        this.t0 = null;
    }

    async init() {
        this.clock = new THREE.Clock();
        this.glftLoader = new GLTFLoader();

        this.beakGlb = await this.glftLoader.loadAsync(beakGlbFilePath);
        //console.log(this.beakGlb);

        const beakMaterial = new THREE.MeshStandardMaterial({ color: 0xfcba03 });
        this.beakScene = this.beakGlb.scene;
        //console.log(this.beakScene);

        // Add the beakScene to the player
        this.add(this.beakScene);

        if (!sceneConfiguration.debug) {
            // Add the camera as the child of the beakScene
            this.add(Game.camera);
        }

        this.ballHeight = sceneConfiguration.ballInitialHeight;
        this.position.set(0, this.ballHeight, 0);
        
        this.beakScene.scale.set(10, 10, 10);
        this.beakScene.rotation.y = Math.PI;

        this.mixer = new THREE.AnimationMixer(this.beakScene);

        // Load the beak model
        this.beakScene.children[0].children[2].material = beakMaterial;
        this.beakScene.children[0].children[2].castShadow = true;
        //this.beakScene.children[0].children[2].receiveShadow = true;
        this.beakBendClip = this.mixer.clipAction(this.beakGlb.animations[0]);
        //this.beakBendClip.loop = new THREE.LoopOnce();
        this.beakStabFailedClip = this.mixer.clipAction(this.beakGlb.animations[1]);
        this.beakStabFailedClip.setLoop(THREE.LoopOnce);
        this.beakStabFailedClip.clampWhenFinished = true;
        this.beakStabSuccessClip = this.mixer.clipAction(this.beakGlb.animations[2]);
        this.beakStabSuccessClip.setLoop(THREE.LoopOnce);
        this.beakStabSuccessClip.clampWhenFinished = true;
        this.beakWithdrawClip = this.mixer.clipAction(this.beakGlb.animations[3]);
        this.beakWithdrawClip.setLoop(THREE.LoopOnce);
        this.beakWithdrawClip.clampWhenFinished = true;

        // Load the ball model
        const ballTexture = this.textureLoader.load(ballTexturePath);
        const ballLightMapTexture = this.textureLoader.load(ballLightMapPath);
        const ballEnvMap = this.textureLoader.load(ballEnvMapPath);
        let texture = new THREE.CanvasTexture(new FlakesTexture());
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        //repeat the wrapping 10 (x) and 6 (y) times
        texture.repeat.x = 10;
        texture.repeat.y = 6;

        const ballMat = {
            lightMap: ballLightMapTexture,
            clearcoat: 1.0,
            metalness: 0.9,
            roughness: 0.5,
            color: 0xe00000,
            normalMap: texture,
            normalScale: new THREE.Vector2(0.15, 0.15),
            envMap: ballEnvMap,
        };

        //add material setting
        const ballMaterial = new THREE.MeshPhysicalMaterial(ballMat);

        this.beakScene.children[1].material = ballMaterial;
        this.beakScene.children[1].castShadow = true;
        //this.beakScene.children[1].receiveShadow = true;

        this.ballBendClip = this.mixer.clipAction(this.beakGlb.animations[4]);
        this.ballShakeClip = this.mixer.clipAction(this.beakGlb.animations[5]);
        this.ballShakeClip.setLoop(THREE.LoopOnce);
        this.ballShakeClip.clampWhenFinished = true;
    }

    update() {
        if (this.mixer != null) {
            if (this.isAttached && this.isBeingPressed) {
                // If the beak is attached and is being pressed, no need to update
                this.clock.getDelta();
            } else {
                // If the beak is not attached, update
                this.mixer.update(this.clock.getDelta());

                if (!this.isAttached) {
                    let timeDelta = this.clock.elapsedTime - this.t0;
                    this.ballHeight = -9.8 * timeDelta * timeDelta + this.v0 * timeDelta + this.h0;
                    //console.log(this.ballHeight);
                    Game.objects.position.set(0, -this.ballHeight, 0);
                    //this.position.set(0, this.ballHeight, 0);

                    if (this.ballHeight < 0) {

                    }
                }
            }
        }

        // console.log(this.mixer.time);
        // console.log("isAttached", this.isAttached);
        // console.log("isBeingPressed", this.isBeingPressed);
    }

    destroy() {}

    // On pointer down
    onPointerDown() {
        if (this.isAttached && !this.isBeingPressed) {
            // If the beak is attached but not being pressed

            this.beakStabSuccessClip.stop();
            this.beakStabFailedClip.stop();
            this.beakWithdrawClip.stop();
            this.ballShakeClip.stop();
            this.beakBendClip.play();
            this.ballBendClip.play();

            this.isAttached = true;
            this.isBeingPressed = true;
        }

        if (!this.isAttached && !this.isBeingPressed) {
            // If the beak is not attached and not being pressed in the air

            this.stab();

            this.isAttached = true;
            this.isBeingPressed = false;
        }
    }

    // Press the ball with factor from 0 to 1
    onPointerMove(factor) {
        if (this.isAttached && this.isBeingPressed) {
            // Play the animation according to the control
            if (this.mixer != null) {
                this.mixer.setTime(factor);

                // Save the initial speed of the ball
                this.v0 = Tools.lerp(0, sceneConfiguration.ballMaxInitialSpeed, factor);
            }
        }
    }

    // Release the ball
    onPointerCancel() {
        if (this.isAttached && this.isBeingPressed) {
            // If the ball is attached and being pressed, release
            this.release();

            this.isAttached = false;
            this.isBeingPressed = false;
        }

        if (this.isAttached && !this.isBeingPressed) {
            // If the ball is attached and not being pressed
        }
    }

    // Stab the peak
    stab() {
        console.log("stab");
        this.beakBendClip.stop();
        this.ballBendClip.stop();
        this.beakWithdrawClip.stop();

        this.beakStabSuccessClip.reset();
        this.beakStabSuccessClip.play();
        this.ballShakeClip.reset();
        this.ballShakeClip.play();

        // Stop the ball's movement
    }

    // Release the ball
    release() {
        console.log("release");

        // withdraw the peak
        this.beakBendClip.stop();
        this.ballBendClip.stop();
        this.ballShakeClip.stop();
        this.beakStabSuccessClip.stop();

        this.beakWithdrawClip.reset();
        this.beakWithdrawClip.play();

        // Save the initial height of the ball
        this.h0 = -Game.objects.position.y;

        // Save the initial time of the release
        this.t0 = this.clock.elapsedTime;
    }
}
