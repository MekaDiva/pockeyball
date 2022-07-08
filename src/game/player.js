import * as THREE from "three";
import { gsap } from "gsap";
import { FlakesTexture } from "three/examples/jsm/textures/FlakesTexture.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import Game from "../game";

const beakGlbFilePath = process.env.PUBLIC_URL + "/models/beakWithBall.glb";
const ballTexturePath = process.env.PUBLIC_URL + "/img/ball.jpg";
const ballLightMapPath = process.env.PUBLIC_URL + "/img/latexballoonmatcap.png";
const ballEnvMapPath = process.env.PUBLIC_URL + "/img/2.png";

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

        // The beakBendClip
        this.beakBendClip = null;

        // The ballBendClip
        this.ballBendClip = null;
    }

    async init() {
        this.clock = new THREE.Clock();
        this.glftLoader = new GLTFLoader();

        this.beakGlb = await this.glftLoader.loadAsync(beakGlbFilePath);
        const beakMaterial = new THREE.MeshStandardMaterial({ color: 0xfcba03 });
        this.beakScene = this.beakGlb.scene;
        this.beakScene.scale.set(10, 10, 10);
        this.beakScene.rotation.y = Math.PI;
        this.beakScene.position.set(0, 0, 0);
        this.mixer = new THREE.AnimationMixer(this.beakScene);
        console.log(this.beakScene);

        // Load the beak model
        this.beakScene.children[0].children[2].material = beakMaterial;
        this.beakScene.children[0].children[2].castShadow = true;
        this.beakBendClip = this.mixer.clipAction(this.beakGlb.animations[0]);

        // Load the ball model
        const ballTexture = this.textureLoader.load(ballTexturePath);
        const ballEnvMap = this.textureLoader.load(ballEnvMapPath);
        let texture = new THREE.CanvasTexture(new FlakesTexture());
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        //repeat the wrapping 10 (x) and 6 (y) times
        texture.repeat.x = 10;
        texture.repeat.y = 6;

        const ballMat = {
            lightMap: ballTexture,
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

        this.beakScene.children[3].material = ballMaterial;

        this.beakScene.children[3].castShadow = true;

        this.ballBendClip = this.mixer.clipAction(this.beakGlb.animations[1]);


        this.beakBendClip.play();
        this.ballBendClip.play();
        //console.log(this.bendClip.getClip().duration);

        this.add(this.beakScene);
    }

    update() {
        if (this.mixer != null) {
            //this.mixer.setTime(0);
            //this.mixer.update(this.clock.getDelta());
        }
    }

    destroy() {}

    // Press the ball with factor from 0 to 1
    press(factor) {
        if (this.mixer != null) {
            this.mixer.setTime(factor);
        }
    }

    // Release the ball
    release() {
        if (this.mixer != null) {
            this.mixer.setTime(0);
        }
    }

    // Stab the peak
    stab() {
        gsap.to(this.beakScene.scale, { duration: 0.2, z: 1, ease: "elastic" });
    }

    // withdraw the peak
    withdraw() {
        gsap.to(this.beakScene.scale, { duration: 0.2, z: 0, ease: "expo" });
    }
}
