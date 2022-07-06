import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import Game from "../game";

const pathAstroGlbFile = process.env.PUBLIC_URL + "/models/astro.glb";
const pathAstroColorMap = process.env.PUBLIC_URL + "/img/astroColorMap.png";

export default class Player extends THREE.Object3D {
    constructor() {
        super();

        this.init = this.init.bind(this);
        this.update = this.update.bind(this);
        this.destroy = this.destroy.bind(this);


        this.addPlayer = this.addPlayer.bind(this);
        this.gltfLoaded = this.gltfLoaded.bind(this);
    }

    init() {
        this.clock = new THREE.Clock();
        this.glftLoader = new GLTFLoader();
        this.astro = new THREE.Object3D();
        
        this.barrelMaterial = null;
        this.mixer = null;
        this.runClip = null;
        this.idleClip = null;
    }

    update() {
        //console.log("hahahaha", this.clock.getDelta());
        if (this.mixer != null) {
            this.mixer.update(this.clock.getDelta());
        }
    }

    destroy() {

    }

    addPlayer() {
        // Load a glTF player resource
        this.glftLoader.load(
            // resource URL
            pathAstroGlbFile,
            // called once loaded
            this.gltfLoaded,
            // called while loading is progressing
            function (xhr) {
                //console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            // called when loading has errors
            function (error) {
                console.log('An error happened');
            }
        );
    }

    gltfLoaded(gltf) {
        let astroMaterial = new THREE.MeshToonMaterial({ color: 0xffffff });
        let astroTexture = new THREE.TextureLoader().load(pathAstroColorMap);
        astroMaterial.map = astroTexture;
        astroMaterial.skinning = true;

        // called when the resource is loaded
        let model = gltf.scene;
        model.children.map((object) => {
            if (object.type == "SkinnedMesh") {
                object.material = astroMaterial;
                object.castShadow = true;
            }

            if (object.type == "Mesh") {
                object.visible = false;
            }
        })

        this.astro = model;
        this.add(this.astro);

        this.mixer = new THREE.AnimationMixer(model);

        this.runClip = this.mixer.clipAction(gltf.animations[0]);

        this.idleClip = this.mixer.clipAction(gltf.animations[1]);

        this.idleClip.play();
    }
}