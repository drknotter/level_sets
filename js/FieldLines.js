class FieldLine {
    constructor(x, y, maxLength) {
        this.x = x;
        this.y = y;
        this.maxLength = maxLength;

        this.points = [];
        this.endParticles = [null, null];
    }

    nearestInfo(x, y) {
        let minimumDistance = Number.POSITIVE_INFINITY;
        let info = null;
        for (let i = 0; i < this.points.length; i += 20) {
            let dx = this.points[i].x - x;
            let dy = this.points[i].y - y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < minimumDistance) {
                minimumDistance = distance;
                info = {distance: distance, fieldLine: this, x: this.points[i].x, y: this.points[i].y};
            }
        }
        return info
    }

    update(potentialField) {
        this.points = [{x: this.x, y: this.y}];
        this.endParticles = [null, null];

        let lastAddedIndex = 0;
        while (this.points.length < this.maxLength && (this.endParticles[0] == null || this.endParticles[1] == null)) {
            let didAddPoints = false;
            for (let direction = 0; direction < 2; direction++) {
                if (this.endParticles[direction]) {
                    continue;
                }
                let x = this.points[direction == 0 ? 0 : this.points.length - 1].x;
                let y = this.points[direction == 0 ? 0 : this.points.length - 1].y;
                let info = potentialField.nearestInfo(x, y);
                if (info.distance <= 3) {
                    if ((direction == 0 && info.particle.charge <= 0)
                        || (direction == 1 && info.particle.charge > 0)) {
                        this.endParticles[direction] = info.particle;
                        continue;
                    }
                }
                let dPotentialX = potentialField.dPotentialXAt(x, y);
                let dPotentialY = potentialField.dPotentialYAt(x, y);
                let steepness = Math.sqrt(dPotentialX * dPotentialX + dPotentialY * dPotentialY);

                if (steepness < PRACTICALLY_ZERO || !steepness) {
                    continue;
                }

                x += (direction == 0 ? -1 : 1) * dPotentialX / steepness;
                y += (direction == 0 ? -1 : 1) * dPotentialY / steepness;
                if (direction == 0) {
                    this.points.unshift({x: x, y: y})
                    lastAddedIndex = 0;
                } else {
                    this.points.push({x: x, y: y})
                    lastAddedIndex = this.points.length - 1;
                }
                didAddPoints = true;
            }
            if (!didAddPoints) {
                break;
            }
        }
    }

    draw(context, isSelected = false) {
        context.save();
        context.strokeStyle = isSelected ? '#39ed8d' : '#51ceed';
        context.fillStyle = isSelected ? '#39ed8d' : '#51ceed';
        context.lineWidth = 3;
        context.lineCap = 'round';
        let seedRadius = isSelected ? 10 : 3;

        context.beginPath();
        if (this.points.length > 0) {
            context.moveTo(this.points[0].x, this.points[0].y);
            for (let j = 1; j < this.points.length; j++) {
                context.lineTo(this.points[j].x, this.points[j].y);
            }
        }
        context.stroke();
        context.restore();
    }
}

class FieldLines {
    constructor(maxLength) {
        this.maxLength = maxLength;
        this.fieldLines = [];
    }

    newFieldLine(x, y) {
        this.fieldLines.push(new FieldLine(x, y, this.maxLength));
    }

    nearestInfo(x, y) {
        let minimumDistance = Number.POSITIVE_INFINITY;
        let info = {distance: minimumDistance};
        for (let i = 0; i < this.fieldLines.length; i++) {
            let lineInfo = this.fieldLines[i].nearestInfo(x, y);
            if (lineInfo.distance < minimumDistance) {
                minimumDistance = lineInfo.distance;
                info = lineInfo;
            }
        }
        return info;
    }

    update(potentialField) {
        for (let i = 0; i < this.fieldLines.length; i++) {
            this.fieldLines[i].update(potentialField);
        }
    }

    draw(context, drawTriangluation) {
        for (let i = 0; i < this.fieldLines.length; i++) {
            this.fieldLines[i].draw(context);
        }
    }

    drawTriangulation(context, potentialField, levels) {
        let intersections = [];
        for (let i = 0; i < this.fieldLines.length; i++) {
            let point = this.fieldLines[i].points[0];
            let potential = potentialField.potentialAt(point.x, point.y);

            let levelIndex = 0;
            for (let j = 1; j < levels.length; j++) {
                if (levels[j] > potential) {
                    levelIndex = j - 1;
                    break;
                }
            }

            for (let j = 1; j < this.fieldLines[i].points.length; j++) {
                point = this.fieldLines[i].points[j];
                potential = potentialField.potentialAt(point.x, point.y);
                if (potential >= levels[levelIndex]) {
                    intersections.push(point);
                    levelIndex++;
                    if (levelIndex >= levels.length) {
                        break;
                    }
                }
            }
        }

        let delaunator = DelaunatorModule.Delaunator.from(intersections, function(n) {return n.x;}, function(n) {return n.y;});

        context.beginPath();
        for (let i = 0; i < delaunator.triangles.length / 3; i++) {
            let p = intersections[delaunator.triangles[i * 3]];
            context.moveTo(p.x, p.y);
            for (let j = 1; j < 3; j++) {
                p = intersections[delaunator.triangles[i * 3 + j]];
                context.lineTo(p.x, p.y);
            }
            p = intersections[delaunator.triangles[i * 3]];
            context.lineTo(p.x, p.y);
        }
        context.stroke();


        context.save();
        context.fillStyle = '#000000';
        for (let i = 0; i < intersections.length; i++) {
            context.beginPath();
            context.ellipse(intersections[i].x, intersections[i].y, 3, 3, 0, 0, 2 * Math.PI);
            context.fill();
        }
        context.restore();
    }
}