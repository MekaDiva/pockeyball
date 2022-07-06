class Tools {
    constructor() {
        this.clamp = this.clamp.bind(this);
        this.lerp = this.lerp.bind(this);
    }

    // Get a value between two values
    clamp(value, min, max) {
        if (value < min) {
            return min;
        } else if (value > max) {
            return max;
        }

        return value;
    }

    // Get the portion using the value between min and max
    inverseLerp(min, max, value) {
        value = value < min ? min : value;
        value = value > max ? max : value;
        let portion = (value - min) / (max - min);
        return portion;
    }

    // Get the linear interpolation between two value
    lerp(min, max, portion) {
        portion = portion < 0 ? 0 : portion;
        portion = portion > 1 ? 1 : portion;
        let value = min + (max - min) * portion;
        return value;
    }

    // Get the new portion using the old portion
    remapPortion(inputMin, inputMax, inputPortion, outputMin, outputMax) {
        let portion = this.lerp(inputMin, inputMax, inputPortion);
        let outputPortion = this.inverseLerp(outputMin, outputMax, portion);
        return outputPortion;
    }

    // Get the new value using the old value
    remapValue(inputMin, inputMax, inputValue, outputMin, outputMax) {
        let t = this.inverseLerp(inputMin, inputMax, inputValue);
        let outputValue = this.lerp(outputMin, outputMax, t);
        return outputValue;
    }

    // Returns the random number in [minNum,maxNum]
    randomNum(minNum, maxNum) {
        switch (arguments.length) {
            case 1:
                return parseInt(Math.random() * minNum + 1, 10);
                break;
            case 2:
                return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
                break;
            default:
                return 0;
                break;
        }
    }
}

export default new Tools();
