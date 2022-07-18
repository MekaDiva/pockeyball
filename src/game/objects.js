import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { gsap } from "gsap";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import Game, { sceneConfiguration } from "../game";
import Tools from "game/tools";
import Ui from "game/ui";

const floorTexturePath = process.env.PUBLIC_URL + "/img/cube2_3.jpg";
const skyTexturePath = process.env.PUBLIC_URL + "/img/cube0145.jpg";
const cloud0GlbPath = process.env.PUBLIC_URL + "/models/cloud0.glb";
const cloud1GlbPath = process.env.PUBLIC_URL + "/models/cloud1.glb";
const treeTexturePath = process.env.PUBLIC_URL + "/models/map.png";
const tree0GlbPath = process.env.PUBLIC_URL + "/models/tree0.glb";
const tree1GlbPath = process.env.PUBLIC_URL + "/models/tree1.glb";
const tree2GlbPath = process.env.PUBLIC_URL + "/models/tree2.glb";
const brancheGlbPath = process.env.PUBLIC_URL + "/models/branche.glb";
const targetImgPath = process.env.PUBLIC_URL + "/img/target.png";
const markOfStabTexturePath = process.env.PUBLIC_URL + "/img/circle.png";

const finalLineTexturePath = process.env.PUBLIC_URL + "/img/checker.png";
const score2ImgPath = process.env.PUBLIC_URL + "/img/2.png";
const score5ImgPath = process.env.PUBLIC_URL + "/img/5.png";
const score11ImgPath = process.env.PUBLIC_URL + "/img/11.png";
const score20ImgPath = process.env.PUBLIC_URL + "/img/20.png";

export default class Objects extends THREE.Object3D {
    constructor() {
        super();

        this.init = this.init.bind(this);
        this.update = this.update.bind(this);
        this.destroy = this.destroy.bind(this);

        this.addBasicGeometries = this.addBasicGeometries.bind(this);
        this.addGlbModel = this.addGlbModel.bind(this);

        // Purly visual objects, will not be refreshed during reset
        this.visualObjectsContainer = new THREE.Object3D();
        this.add(this.visualObjectsContainer);

        // Obstacles objects, will receive raycast from player, will be refreshed during reset
        this.obstaclesContainer = new THREE.Object3D();
        this.add(this.obstaclesContainer);

        // Decoration for the obstacles' objects, will not receive raycast from player, will be refreshed during reset
        this.obstaclesDecorationContainer = new THREE.Object3D();
        this.add(this.obstaclesDecorationContainer);

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

        // The round mark of stab
        this.markOfStab = null;

        // The portal for the ball
        this.portal = new THREE.Object3D();
    }

    async init() {
        console.log("objectsInit");

        // Add ground to the scene
        const floorTexture = this.textureLoader.load(floorTexturePath);
        floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(10000, 10000);
        floorTexture.anisotrophy = 16;
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
        const cloudMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1 });

        this.cloud0 = await this.addGlbModel(cloud0GlbPath, cloudMaterial, this.cloudArray);
        this.cloud0.receiveShadow = false;
        this.cloud1 = await this.addGlbModel(cloud1GlbPath, cloudMaterial, this.cloudArray);
        this.cloud1.receiveShadow = false;

        const treeTexture = this.textureLoader.load(treeTexturePath);
        const treeMaterial = new THREE.MeshStandardMaterial({ map: treeTexture, side: THREE.DoubleSide });

        this.tree0 = await this.addGlbModel(tree0GlbPath, treeMaterial, this.treeArray);
        this.tree1 = await this.addGlbModel(tree1GlbPath, treeMaterial, this.treeArray);
        this.tree2 = await this.addGlbModel(tree2GlbPath, treeMaterial, this.treeArray);

        this.branche = await this.addGlbModel(brancheGlbPath, treeMaterial);

        // Add cloud to the scene
        const centerOfCloud = new THREE.Vector3(0, sceneConfiguration.pathHeight * 0.75, -5);
        for (let index = 0; index < sceneConfiguration.cloudNumber; index++) {
            var positionOfCloud = Tools.randomSurfacePoint(centerOfCloud, sceneConfiguration.cloudRange, sceneConfiguration.pathHeight / 2, false);
            var cloudType = Tools.randomNum(0, 1);
            var cloud = this.cloudArray[cloudType].clone();
            cloud.position.copy(positionOfCloud);
            this.visualObjectsContainer.add(cloud);
        }

        // Add tree to scene
        const centerOfForest = new THREE.Vector3(0, 0, -sceneConfiguration.treeRange / 2 - 5);
        for (let index = 0; index < sceneConfiguration.treeNumber; index++) {
            var positionOfTree = Tools.randomSurfacePoint(centerOfForest, sceneConfiguration.treeRange, sceneConfiguration.treeRange);
            var treeType = Tools.randomNum(0, 2);
            var tree = this.treeArray[treeType].clone();
            tree.position.copy(positionOfTree);
            this.visualObjectsContainer.add(tree);
        }

        // Add mark of stab
        var markOfStabTexture = this.textureLoader.load(markOfStabTexturePath);
        var markMaterial = new THREE.MeshPhongMaterial({ color: 0x000000, map: markOfStabTexture, transparent: true, depthWrite: false });
        var markGeometry = new THREE.PlaneBufferGeometry(0.2, 0.2);
        this.markOfStab = new THREE.Mesh(markGeometry, markMaterial);
        this.markOfStab.position.set(0, 0, 0.55);

        // Add the basic path to the obstaclesContainer
        this.addBasicPath();
    }

    update() {

    }

    destroy() {
        console.log("destroy objects");

        while (this.visualObjectsContainer.children.length) {
            this.visualObjectsContainer.remove(this.visualObjectsContainer.children[0]);
        }

        while (this.obstaclesContainer.children.length) {
            this.obstaclesContainer.remove(this.obstaclesContainer.children[0]);
        }

        while (this.obstaclesDecorationContainer.children.length) {
            this.obstaclesDecorationContainer.remove(this.obstaclesDecorationContainer.children[0]);
        }
    }

    reset() {
        console.log("reset objects");

        while (this.obstaclesContainer.children.length) {
            this.obstaclesContainer.remove(this.obstaclesContainer.children[0]);
        }

        while (this.obstaclesDecorationContainer.children.length) {
            this.obstaclesDecorationContainer.remove(this.obstaclesDecorationContainer.children[0]);
        }

        this.addBasicPath();
    }

    addBasicPath() {
        // Add mark of stab
        this.addMarkOfStab();

        // Add the basic path
        var geometry = new THREE.BoxGeometry(2, sceneConfiguration.pathHeight, 1);
        var material = new THREE.MeshStandardMaterial({ color: 0x00b1b8, metalness: 0, side: THREE.DoubleSide });
        this.basicPath = this.addBasicGeometries(geometry, material);
        this.basicPath.position.set(0, 0.5 * sceneConfiguration.pathHeight, 0);
        this.basicPath.name = "basicPath";
        this.obstaclesContainer.add(this.basicPath);

        // Add the branche to the basic path
        var branchesDistance = Math.round(sceneConfiguration.pathHeight / sceneConfiguration.brancheNumber);
        for (let index = 0; index < sceneConfiguration.brancheNumber; index++) {
            if (index > 1) {
                var brancheType = Tools.randomNum(0, 2);
                var yPosition = branchesDistance * index;
                switch (brancheType) {
                    case 0:
                        // Left
                        var branche = this.branche.clone();
                        branche.position.set(-1, yPosition + 0.5, 0);
                        this.obstaclesDecorationContainer.add(branche);
                        break;
                    case 1:
                        // Right
                        var branche = this.branche.clone();
                        branche.rotation.y = Math.PI;
                        branche.position.set(1, yPosition + 0.5, 0);
                        this.obstaclesDecorationContainer.add(branche);
                        break;
                    case 2:
                        // Do nothing
                        break;
                    default:
                        break;
                }
            }
        }

        // Add three types of obstacles
        var obstaclesDistance = Math.round(sceneConfiguration.pathHeight / sceneConfiguration.obstacleNumber);
        for (let index = 0; index < sceneConfiguration.obstacleNumber; index++) {
            var obstacleType = Tools.randomNum(0, 3);
            if (index > 2) {
                switch (obstacleType) {
                    case 0:
                        // Add the grey block to the basic path
                        var greyBlockGeometry = new THREE.BoxGeometry(2.5, 2, 1.4);
                        var greyBlockMaterial = new THREE.MeshStandardMaterial({ color: 0xa3a3a3, metalness: 0, side: THREE.DoubleSide });
                        var greyBlockMesh = this.addBasicGeometries(greyBlockGeometry, greyBlockMaterial);
                        greyBlockMesh.name = "greyBlock";
                        greyBlockMesh.position.set(0, obstaclesDistance * index, 0);
                        this.obstaclesContainer.add(greyBlockMesh);
                        break;
                    case 1:
                        // Add the red block to the basic path
                        var redBlockGeometry = new THREE.BoxGeometry(2.5, 1.5, 1.4);
                        var redBlockMaterial = new THREE.MeshStandardMaterial({ color: 0xc90000, metalness: 0, side: THREE.DoubleSide });
                        var redBlockMesh = this.addBasicGeometries(redBlockGeometry, redBlockMaterial);
                        redBlockMesh.name = "redBlock";
                        redBlockMesh.position.set(0, obstaclesDistance * index, 0);
                        this.obstaclesContainer.add(redBlockMesh);
                        break;
                    case 2:
                        // Add the acceleration target to the basic path
                        var targetTexture = this.textureLoader.load(targetImgPath);
                        var targetMaterial = new THREE.MeshPhongMaterial({ map: targetTexture, transparent: true });
                        var targetGeometry = new THREE.PlaneBufferGeometry(1, 1);
                        var targetMesh = this.addBasicGeometries(targetGeometry, targetMaterial);
                        targetMesh.name = "targetImg";
                        targetMesh.position.set(0, obstaclesDistance * index, 0.51);
                        this.obstaclesContainer.add(targetMesh);
                        break;
                    case 3:
                        // Do nothing, leave the space empty
                        break;
                    default:
                        break;
                }
            }
        }

        const finalLineHeight = sceneConfiguration.pathHeight;
        //const finalLineHeight = 6;

        // Add the final line and score multiplier on the path
        const finalLineGeometry = new THREE.BoxGeometry(5, 0.5, 1.5);
        const finalLineTexture = this.textureLoader.load(finalLineTexturePath);
        finalLineTexture.wrapS = finalLineTexture.wrapT = THREE.RepeatWrapping;
        finalLineTexture.repeat.set(4, 1);
        const finalLineMaterial = new THREE.MeshStandardMaterial({ map: finalLineTexture});
        this.finalLineMesh = this.addBasicGeometries(finalLineGeometry, finalLineMaterial);
        this.finalLineMesh.castShadow = false;
        this.finalLineMesh.position.set(0, finalLineHeight - 0.25, 0);
        this.obstaclesDecorationContainer.add(this.finalLineMesh);

        // Add all the score multiplier to the final line
        const texturePaths = [];
        texturePaths.push(score2ImgPath);
        texturePaths.push(score5ImgPath);
        texturePaths.push(score11ImgPath);
        texturePaths.push(score20ImgPath);

        const scoreNames = [];
        scoreNames.push("2", "5", "11", "20");

        const scoreColors = [];
        scoreColors.push(0x209ffe, 0x48d028, 0xffe22e, 0xffa82d);

        const scoreSize = 2;

        for (let index = 0; index < 4; index++) {
            const backgroundGeometry = new THREE.BoxGeometry(scoreSize + 0.2, scoreSize, 1.2);
            const backgroundMaterial = new THREE.MeshStandardMaterial({ color: scoreColors[index]});
            var backgroundMesh = this.addBasicGeometries(backgroundGeometry, backgroundMaterial);
            backgroundMesh.castShadow = false;
            backgroundMesh.position.set(0, finalLineHeight + scoreSize / 2 + scoreSize * index, 0);
            this.obstaclesDecorationContainer.add(backgroundMesh);


            const scoreGeometry = new THREE.PlaneBufferGeometry(scoreSize, scoreSize);
            const scoreTexture = this.textureLoader.load(texturePaths[index]);
            const scoreMaterial = new THREE.MeshPhongMaterial({ map: scoreTexture, transparent: true, depthWrite: false });
            const scoreMesh = new THREE.Mesh(scoreGeometry, scoreMaterial);
            scoreMesh.name = scoreNames[index];
            scoreMesh.position.set(0, finalLineHeight + scoreSize / 2 + scoreSize * index, 0.65);
            this.obstaclesDecorationContainer.add(scoreMesh);
        }

        // Add the portal for the ball
        const ringGeometry = new THREE.TorusGeometry(1, 0.1, 16, 100);
        const ringMaterial = new THREE.MeshStandardMaterial({ color: 0x0022ff});
        const ringMesh = this.addBasicGeometries(ringGeometry, ringMaterial);
        this.portal.add(ringMesh);
        ringMesh.rotation.x = 0.5 * Math.PI;
        const portalGeometry = new THREE.CylinderGeometry(1, 1, 0.05, 16, 1);
        const portalMaterial = new THREE.MeshPhongMaterial({ color: 0x91a0ff, opacity: 0.5, transparent: true, depthWrite: false });
        const portalMesh = this.addBasicGeometries(portalGeometry, portalMaterial);
        portalMesh.castShadow = false;
        this.portal.add(portalMesh);
        this.portal.position.set(0, finalLineHeight - 0.8, 2);
        this.obstaclesDecorationContainer.add(this.portal);
        this.portal.scale.set(0, 0, 0);
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
        glbMesh.receiveShadow = true;
        glbMesh.castShadow = true;
        if (arrayContainer != null) {
            arrayContainer.push(glbMesh);
        }

        return glbMesh;
    }

    addMarkOfStab(color = 0x000000) {
        var mark = this.markOfStab.clone();
        var markMaterial = this.markOfStab.material.clone();
        mark.material = markMaterial;
        mark.material.color.set(color);
        mark.position.set(0, -this.position.y, 0.55);
        if (color !== 0x000000) {
            mark.material.color.set(color);
            mark.position.set(0, -this.position.y, 0.75);
        }

        this.obstaclesDecorationContainer.add(mark);
    }

    shakeBox(object3D) {
        gsap.fromTo(object3D.position, { z: 0.5 }, { z: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
    }

    activatePortal() {
        gsap.fromTo(this.portal.scale, { x: 0, y: 0, z: 0}, { x: 1, y: 1, z: 1, duration: 0.5, ease: "back" });
    }

    deactivatePortal() {
        gsap.fromTo(this.portal.scale, { x: 1, y: 1, z: 1}, { x: 0, y: 0, z: 0, duration: 0.5, ease: "power2" });
    }
}
