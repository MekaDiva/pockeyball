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

        this.addBasicGeometries = this.addBasicGeometries.bind(this);
        this.addGlbModel = this.addGlbModel.bind(this);

        this.visualObjectsContainer = new THREE.Object3D();
        this.add(this.visualObjectsContainer);

        this.obstaclesContainer = new THREE.Object3D();
        this.add(this.obstaclesContainer);

        this.awardsContainer = new THREE.Object3D();
        this.add(this.awardsContainer);

        // Array of cloud
        this.cloudArray = [];

        // The mesh model of the cloud0
        this.cloud0 = null;

        // The mesh model of the cloud1
        this.cloud1 = null;

        // Array of tree
        this.treeArray = [];

        // The mesh model of the tree0
        this.tree0 = null;

        // The mesh model of the tree1
        this.tree1 = null;

        // The mesh model of the tree2
        this.tree2 = null;

        // The mesh model of the branche
        this.branche = null;

        // The basic path of for the player
        this.basicPath = null;

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
        floorTexture.repeat.set(10000, 10000);
        floorTexture.anisotrophy = 16;
        floorTexture.encoding = THREE.sRGBEncoding;
        const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture });
        const floorMesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(10000, 10000), floorMaterial);
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.receiveShadow = true;
        this.visualObjectsContainer.add(floorMesh);

        // Add sky to the scene
        const skyTexture = this.textureLoader.load(skyTexturePath);
        Game.scene.background = skyTexture;
        Game.scene.visible = true;

        // Load all the glb object meshes
        const cloudMaterial = new THREE.MeshToonMaterial({ color: 0xffffff });

        this.cloud0 = await this.addGlbModel(cloud0GlbPath, cloudMaterial, this.cloudArray);
        this.cloud1 = await this.addGlbModel(cloud1GlbPath, cloudMaterial, this.cloudArray);

        const treeTexture = this.textureLoader.load(treeTexturePath);
        const treeMaterial = new THREE.MeshStandardMaterial({ map: treeTexture, side: THREE.DoubleSide });

        this.tree0 = await this.addGlbModel(tree0GlbPath, treeMaterial, this.treeArray);
        this.tree1 = await this.addGlbModel(tree1GlbPath, treeMaterial, this.treeArray);
        this.tree2 = await this.addGlbModel(tree2GlbPath, treeMaterial, this.treeArray);

        this.branche = await this.addGlbModel(brancheGlbPath, treeMaterial);

        // Add cloud to the scene
        const centerOfCloud = new THREE.Vector3(0, sceneConfiguration.cloudHeight, 0);
        for (let index = 0; index < sceneConfiguration.cloudNumber; index++) {
            var positionOfCloud = Tools.randomSurfacePoint(centerOfCloud, sceneConfiguration.cloudRange);
            var cloudType = Tools.randomNum(0, 1);
            var cloud = this.cloudArray[cloudType].clone();
            cloud.position.copy(positionOfCloud);
            this.visualObjectsContainer.add(cloud);
        }

        // Add tree to scene
        const centerOfForest = new THREE.Vector3(0, 0, - sceneConfiguration.treeRange / 2 - 5);
        for (let index = 0; index < sceneConfiguration.treeNumber; index++) {
            var positionOfTree = Tools.randomSurfacePoint(centerOfForest, sceneConfiguration.treeRange);
            var treeType = Tools.randomNum(0, 2);
            var tree = this.treeArray[treeType].clone();
            tree.position.copy(positionOfTree);
            this.visualObjectsContainer.add(tree);
        }

        // Add the basic path
        var geometry = new THREE.BoxGeometry(2, sceneConfiguration.pathHeight, 1);
        var material = new THREE.MeshStandardMaterial({ color: 0x00b1b8, metalness: 0 });
        this.basicPath = this.addBasicGeometries(geometry, material);
        this.basicPath.position.set(0, 0.5 * sceneConfiguration.pathHeight, 0);
        this.visualObjectsContainer.add(this.basicPath);

        // Add the branche to the basic path
        for (let index = 0; index < sceneConfiguration.brancheNumber; index++) {
            var left0Right1 = Tools.randomNum(0, 1);
            var yPosition = Math.random() * sceneConfiguration.pathHeight;
            if (left0Right1 == 0) {
                var branche = this.branche.clone();
                branche.position.set(-1, yPosition + 0.5, 0);
                this.visualObjectsContainer.add(branche);
            }
            if (left0Right1 == 1) {
                var branche = this.branche.clone();
                branche.rotation.y = Math.PI;
                branche.position.set(1, yPosition + 0.5, 0);
                this.visualObjectsContainer.add(branche);
            }
        }

        var obstaclesDistance = Math.round(sceneConfiguration.pathHeight / sceneConfiguration.obstacleNumber);
        for (let index = 0; index < sceneConfiguration.obstacleNumber; index++) {
            var obstacleType = Tools.randomNum(0, 2);
            switch (obstacleType) {
                case 0:
                    // Add the grey block to the basic path
                    
                    break;
                case 1:
                    // Add the red block to the basic path

                    break;
                case 2:
                    // Add the acceleration target to the basic path

                    break;
                default:
                    break;
            }
        }

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

    addBasicGeometries(geometry, material) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return mesh;
    }

    async addGlbModel(filePath, material, arrayContainer = null) {
        var glbMesh = (await this.glftLoader.loadAsync(filePath)).scene.children[1];
        glbMesh.material = material;
        glbMesh.receiveShadow = false;
        glbMesh.castShadow = true;
        if (arrayContainer != null) {
            arrayContainer.push(glbMesh);
        }

        return glbMesh;
    }
}
