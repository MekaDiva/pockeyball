import * as THREE from "three";
import Game, { sceneConfiguration } from "../game";

const add240PointsImgPath = process.env.PUBLIC_URL + "/img/240.png";
const score2ImgPath = process.env.PUBLIC_URL + "/img/2.png";
const score5ImgPath = process.env.PUBLIC_URL + "/img/5.png";
const score11ImgPath = process.env.PUBLIC_URL + "/img/11.png";
const score20ImgPath = process.env.PUBLIC_URL + "/img/20.png";

class Ui extends THREE.EventDispatcher {
    constructor() {
        super();

        this.init = this.init.bind(this);
        this.toggleResetButton = this.toggleResetButton.bind(this);
        this.toggleAlert = this.toggleAlert.bind(this);

        // The reset button
        this.resetButton = null;

        // The alert message
        this.alert = null;
    }

    init() {
        // Disable the selection of the text field
        function disableselect(e) {return false};
        document.onselectstart = disableselect;

        // Add score
        let gameScore = document.createElement("p");
        gameScore.id = "gameScore";
        gameScore.innerText = "0";
        gameScore.style.fontSize = "40px";
        gameScore.style.color = "white";
        gameScore.style.position = "absolute";
        gameScore.style.textAlign = "center";
        gameScore.style.left = "calc(50% - 100px)";
        gameScore.style.top = "calc(10%)";
        gameScore.style.width = "200px";
        gameScore.style.height = "30px";
        gameScore.style.cursor = "default";
        gameScore.style.fontFamily = "TappedDefault";

        document.body.appendChild(gameScore);
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

    toggleAlert(isActive, text = "Alert") {
        console.log("toggleAlert");
        if (isActive) {
            // Add reset button
            let alert = document.createElement("p");
            alert.id = "alert";
            alert.innerText = text;
            alert.style.fontSize = "50px";
            alert.style.color = "black";
            alert.style.textAlign = "center";
            alert.style.position = "absolute";
            alert.style.left = "calc(50% - 250px)";
            alert.style.top = "calc(50% - 50px)";
            alert.style.width = "500px";
            alert.style.height = "100px";

            document.body.appendChild(alert);
        } else {
            document.getElementById("alert").remove();
        }
    }

    showCurrentScore() {
        let gameScore = document.getElementById("gameScore");
        gameScore.innerText = sceneConfiguration.playerScore;
    }
}

export default new Ui();
