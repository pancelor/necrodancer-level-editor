function FPSManager(canvas, pubsub) {
    this.canvas = canvas;
    this.pubsub = pubsub;

    requestAnimationFrame(this.tick.bind(this));
}

FPSManager.prototype.tick = function() {
    var ctx = canvas.getContext('2d');

    ctx.clear();
    this.pubsub.emit("draw", {ctx: ctx});

    requestAnimationFrame(this.tick.bind(this));
}
