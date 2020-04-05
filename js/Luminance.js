class Luminance {
    constructor(steppedLuminance, levelSets, scale = 1) {
        this.steppedLuminance = steppedLuminance;
        this.levelSets = levelSets;
        this.scale = scale;
        this.levels = [];
    }

    update(potentialField, levelCount = 6, levelSpread = 0.4, levelColors = null, particleRadius = 60) {
        this.levels = [];

        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        for (let x = 0; x < this.steppedLuminance.width; x++) {
            for (let y = 0; y < this.steppedLuminance.height; y++) {
                let info = potentialField.nearestInfo(x / this.scale, y / this.scale);
                if (info.distance < particleRadius) {
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
                p = (p - min) / (max - min);

                let r = 0, g = 0, b = 0;
                if (levelColors) {
                    let index = -1;
                    for (let i = 0; i < levelColors.length; i++) {
                        if (p <= levelColors[i].position) {
                            index = i;
                            break;
                        }
                    }

                    if (index == -1) {
                        let color = levelColors[levelColors.length - 1].color;
                        r = color.r;
                        g = color.g;
                        b = color.b;
                    } else if (index == 0) {
                        let color = levelColors[0].color;
                        r = color.r;
                        g = color.g;
                        b = color.b;
                    } else {
                        let weight = (p - levelColors[index - 1].position) / (levelColors[index].position - levelColors[index - 1].position);
                        r = (weight * levelColors[index].color.r + (1 - weight) * levelColors[index - 1].color.r);
                        g = (weight * levelColors[index].color.g + (1 - weight) * levelColors[index - 1].color.g);
                        b = (weight * levelColors[index].color.b + (1 - weight) * levelColors[index - 1].color.b);
                    }
                } else {
                    let l = 255 * p;
                    r = l;
                    g = l; 
                    b = l;
                }

                r = Math.min(Math.max(r, 0), 255);
                g = Math.min(Math.max(g, 0), 255);
                b = Math.min(Math.max(b, 0), 255);
                let index = x + this.steppedLuminance.width * y;
                this.steppedLuminance.data[4 * index] = r;
                this.steppedLuminance.data[4 * index + 1] = g;
                this.steppedLuminance.data[4 * index + 2] = b;
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
