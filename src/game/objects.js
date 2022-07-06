import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import Game, { sceneConfiguration } from "../game";
import Tools from "game/tools";

const floorTexturePath = process.env.PUBLIC_URL + "/img/cube2_3.jpg";
const skyTexturePath = process.env.PUBLIC_URL + "/img/cube0145.jpg";
const cloud0GlbPath = process.env.PUBLIC_URL + "/models/cloud0.glb";
const cloud1GlbPath = process.env.PUBLIC_URL + "/models/cloud1.glb";
const treeTexturePath = process.env.PUBLIC_URL + "/models/map.png";
const tree0GlbPath = process.env.PUBLIC_URL + "/models/tree0.glb";
const tree1GlbPath = process.env.PUBLIC_URL + "/models/tree1.glb";
const tree2GlbPath = process.env.PUBLIC_URL + "/models/tree2.glb";
const brancheGlbPath = process.env.PUBLIC_URL + "/models/branche.glb";

export default class Objects extends THREE.Object3D {
    constructor() {
        super();

        this.init = this.init.bind(this);
        this.update = this.update.bind(this);
        this.destroy = this.destroy.bind(this);

        this.addPath = this.addPath.bind(this);
        this.addBasicGeometries = this.addBasicGeometries.bind(this);

        this.visualObjectsContainer = new THREE.Object3D();
        this.add(this.visualObjectsContainer);

        this.obstaclesContainer = new THREE.Object3D();
        this.add(this.obstaclesContainer);

        this.awardsContainer = new THREE.Object3D();
        this.add(this.awardsContainer);

        // The mesh model of the cloud0
        this.cloud0 = null;

        // The mesh model of the cloud1
        this.cloud1 = null;

        // The mesh model of the tree0
        this.tree0 = null;

        // The mesh model of the tree1
        this.tree1 = null;

        // The mesh model of the tree2
        this.tree2 = null;

        // The mesh model of the branche
        this.branche = null;

        // Init all the loaders
        this.textureLoader = new THREE.TextureLoader();
        this.glftLoader = new GLTFLoader();
    }

    async init() {
        console.log("objectsInit");

        this.fixedTimeStep = 1.0 / Game.FPS; // seconds
        this.maxSubSteps = 10;

        // Add ground to the scene

        const floorTexture = this.textureLoader.load(floorTexturePath);
        floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(1000, 1000);
        floorTexture.anisotrophy = 16;
        floorTexture.encoding = THREE.sRGBEncoding;
        const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture });
        const floorMesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(1000, 1000), floorMaterial);
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.receiveShadow = true;
        this.visualObjectsContainer.add(floorMesh);

        // Add sky to the scene
        const skyTexture = this.textureLoader.load(skyTexturePath);
        Game.scene.background = skyTexture;
        Game.scene.visible = true;

        // Load all the glb object meshes
        const cloudMaterial = new THREE.MeshToonMaterial({ color: 0xffffff });
        this.cloud0 = (await this.glftLoader.loadAsync(cloud0GlbPath)).scene.children[1];
        this.cloud0.material = cloudMaterial;
        this.cloud0.receiveShadow = true;
        this.cloud0.castShadow = true;

        this.cloud1 = (await this.glftLoader.loadAsync(cloud1GlbPath)).scene.children[1];
        this.cloud1.material = cloudMaterial;
        this.cloud1.receiveShadow = true;
        this.cloud1.castShadow = true;

        const treeTexture = this.textureLoader.load(treeTexturePath);
        const treeMaterial = new THREE.MeshBasicMaterial({ map: treeTexture, side: THREE.DoubleSide});
        this.tree0 = (await this.glftLoader.loadAsync(tree0GlbPath)).scene.children[1];
        this.tree0.material = treeMaterial;
        this.tree0.receiveShadow = true;
        this.tree0.castShadow = true;

        this.tree1 = (await this.glftLoader.loadAsync(tree1GlbPath)).scene.children[1];        
        this.tree2 = (await this.glftLoader.loadAsync(tree2GlbPath)).scene.children[1];  
        this.branche = (await this.glftLoader.loadAsync(brancheGlbPath)).scene.children[1];      

        // Add cloud to the scene
        var cloud = this.cloud0.clone();
        cloud.position.set(10, 10, 10);
        //this.visualObjectsContainer.add(cloud);

        // Add tree to scene
        var tree = this.tree0.clone();
        this.visualObjectsContainer.add(tree);
    }

    update() {
        //console.log(this.loaderLoaded);
    }

    destroy() {
        console.log("destroy called");

        while (this.visualObjectsContainer.children.length) {
            this.visualObjectsContainer.remove(this.visualObjectsContainer.children[0]);
        }

        while (this.obstaclesContainer.children.length) {
            this.obstaclesContainer.remove(this.obstaclesContainer.children[0]);
        }

        while (this.awardsContainer.children.length) {
            this.awardsContainer.remove(this.awardsContainer.children[0]);
        }
    }

    addPath() {

    }

    addBasicGeometries(elements) {
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];

            const material = new THREE.MeshStandardMaterial({ color: element.color });
            material.metalness = 0.5;

            const mesh = new THREE.Mesh(element.geometry, material);
            mesh.position.copy(element.position);
            mesh.castShadow = true;
            if (element.type == "obstacle") {
                this.obstaclesContainer.add(mesh);
            } else if (element.type == "award") {
                this.awardsContainer.add(mesh);
            }
        }
    }

    addGlbModel(elements) {
        for (let index = 0; index < elements.length; index++) {
            const element = elements[index];

            const fbxModel = element.mesh.clone();
            const fbxMaterial = new THREE.MeshToonMaterial({ color: 0x636363 });
            fbxModel.material = fbxMaterial;
            fbxModel.castShadow = true;
            fbxModel.position.copy(element.position);
            fbxModel.scale.copy(element.size);

            if (element.type == "obstacle") {
                this.obstaclesContainer.add(fbxModel);
            } else if (element.type == "award") {
                this.awardsContainer.add(fbxModel);
            }
        }
    }
}
