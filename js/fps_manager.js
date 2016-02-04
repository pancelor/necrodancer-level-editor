function FPSManager(canvas, pubsub) {
    this.canvas = canvas;
    this.pubsub = pubsub;

    requestAnimationFrame(this.draw.bind(this));
}

FPSManager.prototype.draw = function() {
    var ctx = canvas.getContext('2d');

    ctx.clear();
    this.pubsub.emit("draw", {ctx: ctx});

    requestAnimationFrame(this.draw.bind(this));
};
