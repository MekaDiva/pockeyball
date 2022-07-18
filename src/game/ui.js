import * as THREE from "three";
import { gsap } from "gsap";
import Game, { sceneConfiguration } from "../game";

const add240PointsImgPath = process.env.PUBLIC_URL + "/img/240.png";

class Ui extends THREE.Object3D {
    constructor() {
        super();

        this.init = this.init.bind(this);
        this.toggleResetButton = this.toggleResetButton.bind(this);

        // The game score
        this.gameScore = null;

        // The reset button
        this.resetButton = null;

        // The great message
        this.greatMessage = null;

        // The perfect message
        this.perfectMessage = null;

        // The sprite mesh of 4 multiplier messages
        this.multiplierdictionary = {};

        // The add 240 points info
        this.addPoints = null;

        // Is the multiplier is already applied
        this.currentMultiplier = "1";

        // The initial final score
        this.initialFinalScore = null;
    }

    init() {
        // Add this to the scene
        Game.scene.add(this);

        // Init all the loaders
        this.textureLoader = new THREE.TextureLoader();

        // Disable the selection of the text field
        function disableselect(e) {
            return false;
        }
        document.onselectstart = disableselect;

        // Add score
        this.gameScore = document.createElement("p");
        this.gameScore.id = "gameScore";
        this.gameScore.innerText = "0";
        this.gameScore.style.fontSize = "40px";
        this.gameScore.style.color = "white";
        this.gameScore.style.position = "absolute";
        this.gameScore.style.textAlign = "center";
        this.gameScore.style.left = "calc(50% - 100px)";
        this.gameScore.style.top = "calc(10%)";
        this.gameScore.style.width = "200px";
        this.gameScore.style.height = "30px";
        this.gameScore.style.cursor = "default";
        this.gameScore.style.fontFamily = "TappedDefault";

        document.body.appendChild(this.gameScore);

        // Add great message
        this.greatMessage = this.makeLabelCanvas(2, 1, 5, "#ffffff", "Great!");
        this.greatMessage.position.set(-1, 3, 2);
        this.add(this.greatMessage);
        this.greatMessage.visible = false;

        // Add perfect message
        this.perfectMessage = this.makeLabelCanvas(2, 1, 5, "#ffffff", "Perfect!");
        this.perfectMessage.position.set(-1, 3.5, 2);
        this.add(this.perfectMessage);
        this.perfectMessage.visible = false;

        // Add times2 message
        this.times2Message = this.makeLabelCanvas(2, 1, 8, "#bafff5", "x2");
        this.times2Message.position.set(-1, 4, 2);
        this.add(this.times2Message);
        this.times2Message.visible = false;
        this.multiplierdictionary["2"] = this.times2Message;

        // Add times5 message
        this.times5Message = this.makeLabelCanvas(2, 1, 8, "#48d028", "x5");
        this.times5Message.position.set(-1, 4.5, 2);
        this.add(this.times5Message);
        this.times5Message.visible = false;
        this.multiplierdictionary["5"] = this.times5Message;

        // Add times11 message
        this.times11Message = this.makeLabelCanvas(2, 1, 8, "#ffe22e", "x11");
        this.times11Message.position.set(-1, 5, 2);
        this.add(this.times11Message);
        this.times11Message.visible = false;
        this.multiplierdictionary["11"] = this.times11Message;

        // Add times20 message
        this.times20Message = this.makeLabelCanvas(2, 1, 8, "#ffa82d", "x20");
        this.times20Message.position.set(-1, 5.5, 2);
        this.add(this.times20Message);
        this.times20Message.visible = false;
        this.multiplierdictionary["20"] = this.times20Message;

        // Load the 240 points image
        var pointsTexture = this.textureLoader.load(add240PointsImgPath);
        var pointsMaterial = new THREE.MeshPhongMaterial({ map: pointsTexture, transparent: true, depthWrite: false });
        var pointsGeometry = new THREE.PlaneBufferGeometry(2, 2);
        this.addPoints = new THREE.Mesh(pointsGeometry, pointsMaterial);
        this.addPoints.position.set(1.5, 3, 2);
        this.add(this.addPoints);
        this.addPoints.visible = false;
    }

    reset() {
        this.currentMultiplier = "1";
    }

    makeLabelCanvas(baseWidth, baseHeight, textSize, textColor, name) {
        baseWidth = baseWidth * 100;
        baseHeight = baseHeight * 100;
        const borderSize = 2;
        const ctx = document.createElement("canvas").getContext("2d");
        // const font = new FontFace("TappedDefault", process.env.PUBLIC_URL + "/fonts/TappedDefault.woff");
        // font.load();
        const font = "TappedDefault";
        ctx.font = font;

        const doubleBorderSize = borderSize * 2;
        const width = baseWidth + doubleBorderSize;
        const height = baseHeight + doubleBorderSize;
        ctx.canvas.width = width;
        ctx.canvas.height = height;

        // need to set font again after resizing canvas
        ctx.font = font;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        // ctx.fillStyle = "blue";
        // ctx.fillRect(0, 0, width, height);

        ctx.translate(width / 2, height / 2);
        //ctx.scale(scaleFactor, 1);
        ctx.scale(textSize, textSize);
        ctx.fillStyle = textColor;
        ctx.fillText(name, 0, 0);

        const canvas = ctx.canvas;
        const texture = new THREE.CanvasTexture(canvas);
        // because our canvas is likely not a power of 2
        // in both dimensions set the filtering appropriately.
        texture.minFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        const labelMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
        });
        var label = new THREE.Sprite(labelMaterial);

        // if units are meters then 0.01 here makes size
        // of the label into centimeters.
        const labelBaseScale = 0.01;
        label.scale.x = canvas.width * labelBaseScale;
        label.scale.y = canvas.height * labelBaseScale;

        return label;
    }

    toggleResetButton(isActive) {
        if (isActive) {
            // Add reset button
            this.resetButton = document.createElement("p");
            this.resetButton.id = "resetButton";
            this.resetButton.innerText = "reset";
            this.resetButton.style.fontSize = "50px";
            this.resetButton.style.color = "white";
            this.resetButton.style.textAlign = "center";
            this.resetButton.style.position = "absolute";
            this.resetButton.style.left = "calc(50% - 100px)";
            this.resetButton.style.top = "calc(50% - 50px)";
            this.resetButton.style.width = "200px";
            this.resetButton.style.height = "100px";
            this.resetButton.style.cursor = "pointer";
            this.resetButton.style.fontFamily = "TappedDefault";
            this.resetButton.onmouseenter = (e) => {
                this.resetButton.style.color = "grey";
            };
            this.resetButton.onmouseup = (e) => {
                Game.reset();

                this.toggleResetButton(false);
            };
            this.resetButton.onmouseleave = (e) => {
                this.resetButton.style.color = "white";
            };

            document.body.appendChild(this.resetButton);
        } else {
            this.resetButton.remove();
        }
    }

    stabBasicPath() {
        // Play the add 240 points animation
        this.addPoints.visible = true;
        gsap.fromTo(this.addPoints.position, { y: 3 }, { y: 4, duration: 0.7 });
        gsap.fromTo(this.addPoints.material, { opacity: 1 }, { opacity: 0, duration: 0.7 });

        // Add 240 points to the score
        var initialScore = sceneConfiguration.playerData.playerScore;
        var currentScore = initialScore + 240;
        sceneConfiguration.playerData.playerScore = currentScore;

        gsap.fromTo(this.gameScore, { innerText: initialScore }, { innerText: currentScore, duration: 0.5, ease: "steps(40)" });

        // Play the Great! animation
        this.greatMessage.visible = true;
        gsap.fromTo(this.greatMessage.scale, { x: 0.1 }, { x: 2, duration: 0.5, ease: "back" });
        gsap.fromTo(this.greatMessage.scale, { y: 0.1 }, { y: 1, duration: 0.5, ease: "back" });
        gsap.fromTo(this.greatMessage.material, { opacity: 1 }, { opacity: 0, duration: 2, ease: "slow" });
    }

    stabTarget() {
        // Play the add 240 points animation
        this.addPoints.visible = true;
        gsap.fromTo(this.addPoints.position, { y: 3 }, { y: 4, duration: 0.7 });
        gsap.fromTo(this.addPoints.material, { opacity: 1 }, { opacity: 0, duration: 0.7 });

        // Add 240 points to the score
        var initialScore = sceneConfiguration.playerData.playerScore;
        var currentScore = initialScore + 240;
        sceneConfiguration.playerData.playerScore = currentScore;

        gsap.fromTo(this.gameScore, { innerText: initialScore }, { innerText: currentScore, duration: 0.5, ease: "steps(40)" });

        // Play the perfect animation
        this.perfectMessage.visible = true;
        gsap.fromTo(this.perfectMessage.scale, { x: 0.1 }, { x: 2, duration: 0.5, ease: "back" });
        gsap.fromTo(this.perfectMessage.scale, { y: 0.1 }, { y: 1, duration: 0.5, ease: "back" });
        gsap.fromTo(this.perfectMessage.material, { opacity: 1 }, { opacity: 0, duration: 2, ease: "slow" });
    }

    getMultiplier(scoreName) {
        if (this.currentMultiplier != scoreName && parseFloat(this.currentMultiplier) < parseFloat(scoreName)) {
            if (scoreName == "2") {
                this.initialFinalScore = sceneConfiguration.playerData.playerScore;
            }

            var messageSprite = this.multiplierdictionary[scoreName];
    
            // Play the multiplier animation
            messageSprite.visible = true;
            gsap.fromTo(messageSprite.scale, { x: 0.1 }, { x: 2, duration: 0.5, ease: "back" });
            gsap.fromTo(messageSprite.scale, { y: 0.1 }, { y: 1, duration: 0.5, ease: "back" });
            gsap.fromTo(messageSprite.material, { opacity: 1 }, { opacity: 0, duration: 2, ease: "slow" });
    
            // Apply the multiplier to the score
            var multiplier = parseFloat(scoreName);
            
            var currentScore = this.initialFinalScore * multiplier;
            sceneConfiguration.playerData.playerScore = currentScore;
    
            gsap.fromTo(this.gameScore, { innerText: this.initialFinalScore }, { innerText: currentScore, duration: 0.5, ease: "steps(40)" });
        }

        this.currentMultiplier = scoreName;
    
    }

    showCurrentScore() {
        let gameScore = document.getElementById("gameScore");
        gameScore.innerText = sceneConfiguration.playerScore;
    }
}

export default new Ui();
