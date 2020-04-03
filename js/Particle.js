class Particle {
    constructor(x, y, charge) {
        this.x = x;
        this.y = y; 
        this.charge = charge;
    }

    distance(cx, cy) {
        return Math.sqrt(this.squaredDistance(cx, cy));
    }

    squaredDistance(cx, cy) {
        return (cx - this.x) * (cx - this.x) + (cy - this.y) * (cy - this.y);
    }

    draw(context) {
        context.save();
        context.strokeStyle = '#518aed';
        context.lineWidth = 3;
        context.beginPath();
        context.ellipse(this.x, this.y, 10, 10, 0, 0, 2 * Math.PI);
        context.stroke();
        context.restore();
    }
}