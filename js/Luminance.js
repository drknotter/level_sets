class Luminance {
    constructor(steppedLuminance, levelSets, scale = 1) {
        this.steppedLuminance = steppedLuminance;
        this.levelSets = levelSets;
        this.scale = scale;
        this.levels = [];
    }

    update(potentialField, levelCount = 6, levelSpread = 0.4) {
        this.levels = [];

        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        for (let x = 0; x < this.steppedLuminance.width; x++) {
            for (let y = 0; y < this.steppedLuminance.height; y++) {
                let info = potentialField.nearestInfo(x / this.scale, y / this.scale);
                if (info.distance < potentialField.particleRadius) {
                    continue;
                }
                let p = potentialField.potentialAt(x / this.scale, y / this.scale);
                if (p < min) {
                    min = p;
                }
                if (p > max) {
                    max = p;
                }
            }
        }

        let potentialLevels = [];
        let intLevelCount = Math.round(levelCount);
        for (let i = 0; i < intLevelCount; i++) {
            potentialLevels.push((i / intLevelCount) * (max - min) + min);

            let fraction = i / (intLevelCount - 1);
            if (fraction <= 0.5) {
                fraction = 2.0 * fraction;
                fraction = Math.pow(fraction, levelSpread);
                fraction = 0.5 * fraction;
            } else {
                fraction = 2.0 * (1.0 - fraction);
                fraction = Math.pow(fraction, levelSpread);
                fraction = -0.5 * fraction + 1.0;
            }
            this.levels.push(fraction * (max - min) + min);
        }

        for (let x = 0; x < this.steppedLuminance.width; x++) {
            for (let y = 0; y < this.steppedLuminance.height; y++) {
                let p = potentialField.potentialAt(x / this.scale, y / this.scale);
                if (this.levels.length > 0) {
                    let adjustedP = max;
                    for (let i = 0; i < this.levels.length; i++) {
                        if (p <= this.levels[i]) {
                            adjustedP = potentialLevels[i];
                            break;
                        }
                    }
                    p = adjustedP;
                }

                let l = 255 * (p - min) / (max - min);
                l = Math.min(Math.max(l, 0), 255);
                let index = x + this.steppedLuminance.width * y;
                this.steppedLuminance.data[4 * index] = l;
                this.steppedLuminance.data[4 * index + 1] = l;
                this.steppedLuminance.data[4 * index + 2] = l;
                this.steppedLuminance.data[4 * index + 3] = 255;
            }
        }
    }

    draw(context) {
        context.save();
        context.putImageData(this.steppedLuminance, 0, 0);
        context.restore();
    }
};
