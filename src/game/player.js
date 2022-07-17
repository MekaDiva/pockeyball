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
const trackTexturePath = process.env.PUBLIC_URL + "/img/dotted.png";
const stabSuccessTexturePath = process.env.PUBLIC_URL + "/img/star.png";
const stabFailedTexturePath = process.env.PUBLIC_URL + "/img/sparkle.png";

export default class Player extends THREE.Object3D {
    constructor() {
        super();

        this.init = this.init.bind(this);
        this.update = this.update.bind(this);
        this.destroy = this.destroy.bind(this);

        // Init all the loaders
        this.textureLoader = new THREE.TextureLoader();
        this.glftLoader = new GLTFLoader();

        this.visualObjectsContainer = new THREE.Object3D();
        this.add(this.visualObjectsContainer);

        // The glb file loaded from loader of the beak
        this.beakGlb = null;

        // The scene of the beak model, an object3d
        this.beakScene = null;

        // The mesh of the beak model
        this.beakMesh = null;

        // The mesh of the ball attached to the beak
        this.ballMesh = null;

        // The animation mixer
        this.mixer = null;

        // The bend of the beak
        this.beakBendClip = null;

        // The fly away clip of the beak
        this.beakFlyAwayClip = null;

        // The clip of successfully stab in the path
        this.beakStabSuccessClip = null;

        // The clip of failling to stab in the path
        this.beakStabFailedClip = null;

        // The clip of withdraw the beak
        this.beakWithdrawClip = null;

        // The clip of the ball fly away
        this.ballFlyAwayClip = null;

        // The bend of the ball
        this.ballBendClip = null;

        // Is the ball is interactable
        this.isInteractable = true;

        // Is the beak is being pressed
        this.isBeingPressed = false;

        // Is the beak is attached to the column
        this.isAttached = true;

        // Actual max speed of the ball
        this.actualBallMaxSpeed = sceneConfiguration.ballMaxInitialSpeed;

        // The hight of the ball
        this.ballHeight = 0;

        // The speed of the ball
        this.ballSpeed = 0;

        // The initial height and initial speed and the initial time when launched into the sky
        this.h0 = null;
        this.v0 = null;
        this.t0 = null;

        // The raycaster from the ball
        this.raycaster = new THREE.Raycaster();

        // The bounce animation of gsap
        this.bounceAnimation = null;

        // The beak shake animation of gsap
        this.beakShakeAnimation = null;

        // The track image of the ball
        this.trackOfBall = null;

        // The effects of successful stab
        this.effectSuccessStab1 = null;
        this.effectSuccessStab2 = null;

        // The effects of unsuccessful stab
        this.effectFailedStab1 = null;
        this.effectFailedStab2 = null;
    }

    async init() {
        this.clock = new THREE.Clock();
        this.glftLoader = new GLTFLoader();

        this.beakGlb = await this.glftLoader.loadAsync(beakGlbFilePath);
        //console.log(this.beakGlb);

        const beakMaterial = new THREE.MeshStandardMaterial({ color: 0xfcba03, side: THREE.DoubleSide });
        this.beakScene = this.beakGlb.scene;
        //console.log(this.beakScene);

        // Add the beakScene to the player
        this.add(this.beakScene);

        if (!sceneConfiguration.debug) {
            // Add the camera as the child of the beakScene
            this.add(Game.camera);
        }

        this.ballHeight = sceneConfiguration.ballInitialHeight;

        // Move the game object to the - initial position
        Game.objects.position.set(0, -this.ballHeight, 0);

        this.beakScene.scale.set(10, 10, 10);
        this.beakScene.rotation.y = Math.PI;

        this.mixer = new THREE.AnimationMixer(this.beakScene);

        // Load the beak model
        this.beakMesh = this.beakScene.children[0].children[2];
        this.beakMesh.material = beakMaterial;
        this.beakMesh.castShadow = true;
        this.beakMesh.receiveShadow = true;
        this.beakBendClip = this.mixer.clipAction(this.beakGlb.animations[0]);

        this.beakFlyAwayClip = this.mixer.clipAction(this.beakGlb.animations[1]);
        this.beakFlyAwayClip.setLoop(THREE.LoopOnce);
        this.beakFlyAwayClip.clampWhenFinished = true;

        this.beakStabFailedClip = this.mixer.clipAction(this.beakGlb.animations[2]);
        this.beakStabFailedClip.setLoop(THREE.LoopOnce);
        this.beakStabFailedClip.clampWhenFinished = true;

        this.beakStabSuccessClip = this.mixer.clipAction(this.beakGlb.animations[3]);
        this.beakStabSuccessClip.setLoop(THREE.LoopOnce);
        this.beakStabSuccessClip.clampWhenFinished = true;

        this.beakWithdrawClip = this.mixer.clipAction(this.beakGlb.animations[4]);
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

        this.ballMesh = this.beakScene.children[1];
        this.ballMesh.material = ballMaterial;
        this.ballMesh.castShadow = true;
        //this.beakScene.children[1].receiveShadow = true;

        this.ballFlyAwayClip = this.mixer.clipAction(this.beakGlb.animations[5]);
        this.ballFlyAwayClip.setLoop(THREE.LoopOnce);
        this.ballFlyAwayClip.clampWhenFinished = true;

        this.ballBendClip = this.mixer.clipAction(this.beakGlb.animations[6]);

        // Add track image
        var trackTexture = this.textureLoader.load(trackTexturePath);
        var trackMaterial = new THREE.MeshStandardMaterial({ map: trackTexture, transparent: true });
        var trackGeometry = new THREE.PlaneBufferGeometry(0.65, 1);
        this.trackOfBall = new THREE.Mesh(trackGeometry, trackMaterial);
        this.trackOfBall.position.set(0, 0, 2);
        this.visualObjectsContainer.add(this.trackOfBall);
        this.trackOfBall.rotation.z = Math.PI;
        this.trackOfBall.visible = false;

        // Add the successful stab effects
        var effectSuccessTexture = this.textureLoader.load(stabSuccessTexturePath);
        var effectSuccessMaterial = new THREE.MeshPhongMaterial({ map: effectSuccessTexture, transparent: true, depthWrite: false });
        var effectSuccessGeometry = new THREE.PlaneBufferGeometry(2.5, 2.5);
        this.effectSuccessStab1 = new THREE.Mesh(effectSuccessGeometry, effectSuccessMaterial);
        this.effectSuccessStab1.position.set(0, 0, 0.55);
        this.visualObjectsContainer.add(this.effectSuccessStab1);
        this.effectSuccessStab1.visible = false;
        this.effectSuccessStab2 = this.effectSuccessStab1.clone();
        this.visualObjectsContainer.add(this.effectSuccessStab2);
        this.effectSuccessStab2.visible = false;

        // Add the failed stab effects
        var effectFailedTexture = this.textureLoader.load(stabFailedTexturePath);
        var effectFailedMaterial = new THREE.MeshPhongMaterial({ map: effectFailedTexture, transparent: true, depthWrite: false });
        effectFailedMaterial.transparent = true;
        var effectFailedGeometry = new THREE.PlaneBufferGeometry(2.5, 2.5);
        this.effectFailedStab1 = new THREE.Mesh(effectFailedGeometry, effectFailedMaterial);
        this.effectFailedStab1.position.set(0, 0, 0.8);
        this.visualObjectsContainer.add(this.effectFailedStab1);
        this.effectFailedStab1.visible = false;
        this.effectFailedStab2 = this.effectFailedStab1.clone();
        this.visualObjectsContainer.add(this.effectFailedStab2);
        this.effectFailedStab2.visible = false;
    }

    update() {
        if (this.mixer != null) {
            if (this.isAttached && this.isBeingPressed) {
                // If the beak is attached and is being pressed, no need to update
                this.clock.getDelta();
            } else {
                // If the beak is not attached, update
                this.mixer.update(this.clock.getDelta());

                if (this.isInteractable) {
                    if (!this.isAttached) {
                        let timeDelta = this.clock.elapsedTime - this.t0;
                        this.ballHeight = sceneConfiguration.gravityAcceleration * 0.5 * timeDelta * timeDelta + this.v0 * timeDelta + this.h0;
                        this.ballSpeed = sceneConfiguration.gravityAcceleration * timeDelta + this.v0;
                        Game.objects.position.set(0, -this.ballHeight, 0);

                        // Activate the track of the ball
                        this.trackOfBall.visible = true;
                        this.trackOfBall.scale.set(1, this.ballSpeed, 1);

                        // Game over if the ball falls below 2
                        if (this.ballHeight < 2) {
                            // Game over
                            Game.dropBallOnGround();
                            this.isInteractable = false;
                            this.playBallDropAnimation();

                            // Deactivate the track of the ball
                            this.trackOfBall.visible = false;
                        }
                    } else {
                        // Deactivate the track of the ball
                        this.trackOfBall.visible = false;
                    }
                }
            }

            // console.log(this.mixer.time);
            // console.log("isAttached", this.isAttached);
            // console.log("isBeingPressed", this.isBeingPressed);
        }
    }

    destroy() {
        console.log("destroy player");

        while (this.children.length) {
            this.remove(this.children[0]);
        }
    }

    reset() {
        console.log("reset player");

        this.beakStabSuccessClip.stop();
        this.beakStabFailedClip.stop();
        this.beakWithdrawClip.stop();
        this.beakFlyAwayClip.stop();
        this.ballFlyAwayClip.stop();
        this.beakBendClip.stop();
        this.ballBendClip.stop();

        this.beakMesh.visible = true;
        this.ballMesh.position.y = 0;
        gsap.killTweensOf(this.ballMesh.position);

        // Move the game object to the - initial position
        Game.objects.position.set(0, -sceneConfiguration.ballInitialHeight, 0);

        this.isInteractable = true;
        this.isAttached = true;
        this.isBeingPressed = false;
    }

    // On pointer down
    onPointerDown() {
        if (this.isInteractable) {
            if (this.isAttached && !this.isBeingPressed) {
                // If the beak is attached but not being pressed
                this.press();
            }

            if (!this.isAttached && !this.isBeingPressed) {
                // If the beak is not attached and not being pressed in the air
                this.stab();
            }
        }
    }

    // Press the ball with factor from 0 to 1
    onPointerMove(factor) {
        if (this.isInteractable) {
            if (this.isAttached && this.isBeingPressed) {
                // Play the animation according to the control
                if (this.mixer != null) {
                    this.mixer.setTime(factor);

                    // Save the initial speed of the ball
                    this.v0 = Tools.lerp(0, this.actualBallMaxSpeed, factor);
                    
                    // Shake the scene according to the factor
                    this.beakShakeAnimation = gsap.fromTo(this.beakScene.rotation, { x: factor / 6 }, { x: 0, duration: 0.05, repeat: -1, ease: "elastic.out(1, 0.3)" });
                    
                    // 
                }
            }
        }
    }

    // Release the ball
    onPointerCancel() {
        if (this.isInteractable) {
            if (this.isAttached && this.isBeingPressed) {
                // If the ball is attached and being pressed, release
                this.release();
            }

            if (this.isAttached && !this.isBeingPressed) {
                // If the ball is attached and not being pressed
            }
        }
    }

    // Press the beak
    press() {
        this.beakStabSuccessClip.stop();
        this.beakStabFailedClip.stop();
        this.beakWithdrawClip.stop();
        this.beakFlyAwayClip.stop();
        this.ballFlyAwayClip.stop();
        this.beakBendClip.play();
        this.ballBendClip.play();

        //////////
        this.isAttached = true;
        this.isBeingPressed = true;
    }

    // Stab the beak
    stab() {
        //console.log("stab");
        this.beakBendClip.stop();
        this.ballBendClip.stop();
        this.beakWithdrawClip.stop();

        // Do the raycast check
        var rayOrigin = new THREE.Vector3(0, 0, 1);
        var rayDirection = new THREE.Vector3(0, 0, -1);
        this.raycaster.set(rayOrigin, rayDirection);
        const intersects = this.raycaster.intersectObjects(Game.objects.obstaclesContainer.children);
        console.log(intersects[0].object.name);

        var nameOfIntersectObject = intersects[0].object.name;

        switch (nameOfIntersectObject) {
            case "basicPath":
                // Touche the basic path, attached and gain score
                this.beakStabFailedClip.stop();
                this.beakFlyAwayClip.stop();
                this.ballFlyAwayClip.stop();
                this.beakStabSuccessClip.reset();
                this.beakStabSuccessClip.play();

                gsap.fromTo(this.beakScene.rotation, { x: 0.2 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });

                // Play the stab success animation
                this.playStabSuccessAnimation();

                // Add mark of stab
                Game.objects.addMarkOfStab();

                //////////
                // Stop the ball
                this.isAttached = true;
                this.isBeingPressed = false;
                break;
            case "greyBlock":
                // Touche the grey block, not able to attach
                this.beakStabSuccessClip.stop();
                this.beakFlyAwayClip.stop();
                this.ballFlyAwayClip.stop();
                this.beakStabFailedClip.reset();
                this.beakStabFailedClip.play();

                // Play the stab failed animation
                this.playStabFailedAnimation();

                // Shake the greyBlock
                Game.objects.shakeBox(intersects[0].object);

                //////////
                // Stop the ball for 1 seconds
                this.isAttached = true;
                this.isBeingPressed = false;
                this.v0 = this.ballSpeed;

                gsap.delayedCall(0.3, () => {
                    this.isAttached = false;
                    this.isBeingPressed = false;

                    // Save the initial time of the release
                    this.t0 = this.clock.elapsedTime;

                    // Save the initial height of the ball
                    this.h0 = -Game.objects.position.y;
                });
                break;
            case "redBlock":
                // Touche the red block, game over
                Game.touchRedBlock();

                this.beakStabSuccessClip.stop();
                this.beakStabFailedClip.stop();
                this.beakFlyAwayClip.reset();
                this.beakFlyAwayClip.play();
                this.ballFlyAwayClip.reset();
                this.ballFlyAwayClip.play();

                this.trackOfBall.visible = false;

                // Play the stab failed animation
                this.playStabFailedAnimation();

                //////////
                this.isInteractable = false;
                this.isAttached = false;
                this.isBeingPressed = false;
                break;
            case "targetImg":
                // Touche the track image, get bonus on the initial speed
                this.beakStabFailedClip.stop();
                this.beakFlyAwayClip.stop();
                this.ballFlyAwayClip.stop();
                this.beakStabSuccessClip.reset();
                this.beakStabSuccessClip.play();

                gsap.fromTo(this.beakScene.rotation, { x: 0.2 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });

                // Change the ball's max initial speed to
                this.actualBallMaxSpeed = sceneConfiguration.ballMaxBonusInitialSpeed;

                // Play the stab success animation
                this.playStabSuccessAnimation();

                // Add mark of stab
                Game.objects.addMarkOfStab();

                //////////
                this.isAttached = true;
                this.isBeingPressed = false;
                break;
            default:
                break;
        }
    }

    // Release the ball
    release() {
        //console.log("release");
        
        // Stop the beak shake animation
        gsap.killTweensOf(this.beakScene.rotation);

        // Restore the original ballMaxInitialSpeed;
        this.actualBallMaxSpeed = sceneConfiguration.ballMaxInitialSpeed;

        // withdraw the peak
        this.beakBendClip.stop();
        this.ballBendClip.stop();
        this.beakStabSuccessClip.stop();

        this.beakWithdrawClip.reset();
        this.beakWithdrawClip.play();

        // Save the initial height of the ball
        this.h0 = -Game.objects.position.y;

        // Save the initial time of the release
        this.t0 = this.clock.elapsedTime;

        //////////
        this.isAttached = false;
        this.isBeingPressed = false;
    }

    playBallDropAnimation() {
        // Stop the movement of the ball
        this.isAttached = true;
        this.isBeingPressed = false;

        // Play the ball drop animation
        //this.ballMesh.position.y = -0.17;
        this.ballMesh.position.y = 0;
        this.bounceAnimation = gsap.to(this.ballMesh.position, { duration: 1, y: -0.17, ease: "bounce" });
        this.beakMesh.visible = false;
    }

    playStabSuccessAnimation() {
        this.effectSuccessStab1.visible = true;
        this.effectSuccessStab1.rotation.z = Math.random() * Math.PI * 2;
        gsap.fromTo(this.effectSuccessStab1.scale, { x: 0.1 }, { x: 1, duration: 0.5, ease: "power1" });
        gsap.fromTo(this.effectSuccessStab1.scale, { y: 0.1 }, { y: 1, duration: 0.5, ease: "power1" });
        gsap.fromTo(this.effectSuccessStab1.material, { opacity: 1 }, { opacity: 0, duration: 0.5, ease: "none" });
        this.effectSuccessStab2.visible = true;
        this.effectSuccessStab2.rotation.z = Math.random() * Math.PI * 2;
        gsap.fromTo(this.effectSuccessStab2.scale, { x: 0.1 }, { x: 1, duration: 0.5, ease: "power4" });
        gsap.fromTo(this.effectSuccessStab2.scale, { y: 0.1 }, { y: 1, duration: 0.5, ease: "power4" });
        gsap.fromTo(this.effectSuccessStab2.material, { opacity: 1 }, { opacity: 0, duration: 0.5, ease: "none" });
    }

    playStabFailedAnimation() {
        this.effectFailedStab1.visible = true;
        this.effectFailedStab1.rotation.z = Math.random() * Math.PI * 2;
        gsap.fromTo(this.effectFailedStab1.scale, { x: 0.1 }, { x: 1, duration: 0.5, ease: "power1" });
        gsap.fromTo(this.effectFailedStab1.scale, { y: 0.1 }, { y: 1, duration: 0.5, ease: "power1" });
        gsap.fromTo(this.effectFailedStab1.material, { opacity: 1 }, { opacity: 0, duration: 0.5, ease: "none" });
        this.effectFailedStab2.visible = true;
        this.effectFailedStab2.rotation.z = Math.random() * Math.PI * 2;
        gsap.fromTo(this.effectFailedStab2.scale, { x: 0.1 }, { x: 1, duration: 0.5, ease: "power4" });
        gsap.fromTo(this.effectFailedStab2.scale, { y: 0.1 }, { y: 1, duration: 0.5, ease: "power4" });
        gsap.fromTo(this.effectFailedStab2.material, { opacity: 1 }, { opacity: 0, duration: 0.5, ease: "none" });
    }
}
