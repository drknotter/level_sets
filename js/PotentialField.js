MAX_VALUE = 1e2;
PRACTICALLY_ZERO = 1e-5;

class PotentialField {
    constructor(particleRadius) {
        this.particles = [];
        this.particleRadius = particleRadius;
    }

    nearestInfo(x, y) {
        let minimumSquaredDistance = Number.MAX_VALUE;
        let minimumIndex = -1;

        for (let i =0; i < this.particles.length; i++) {
            let squaredDistance = this.particles[i].squaredDistance(x, y);
            if (squaredDistance < minimumSquaredDistance) {
                minimumIndex = i;
                minimumSquaredDistance = squaredDistance;
            }
        }

        return {particle: this.particles[minimumIndex], distance: Math.sqrt(minimumSquaredDistance)};
    }

    potentialAt(x, y) {
        let potential = 0;
        for (let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];
            let r = p.distance(x, y);
            if (r < PRACTICALLY_ZERO) {
                potential += Math.sign(p.charge) * MAX_VALUE;
            } else {
                potential += clamp(p.charge / r, -MAX_VALUE, MAX_VALUE);
            }
            
        }
        return clamp(potential, -MAX_VALUE, MAX_VALUE);
    }

    dPotentialXAt(x, y) {
        let dPotentialX = 0;
        for (let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];
            let r = p.distance(x, y);
            if (r < PRACTICALLY_ZERO) {
                dPotentialX += Math.sign(-p.charge * (x - p.x)) * MAX_VALUE;
            } else {
                dPotentialX += clamp(-p.charge * (x - p.x) / (r * r * r), -MAX_VALUE, MAX_VALUE);
            }
        }
        return clamp(dPotentialX, -MAX_VALUE, MAX_VALUE);
    }

    dPotentialYAt(x, y) {
        let dPotentialY = 0;
        for (let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];
            let r = p.distance(x, y);
            if (r < PRACTICALLY_ZERO) {
                dPotentialY += Math.sign(-p.charge * (y - p.y)) * MAX_VALUE;
            } else {
                dPotentialY += clamp(-p.charge * (y - p.y) / (r * r * r), -MAX_VALUE, MAX_VALUE);
            }
        }
        return clamp(dPotentialY, -MAX_VALUE, MAX_VALUE);
    }
}