function FPSManager(canvas, pubsub) {
    this.canvas = canvas;
    this.pubsub = pubsub;

    this.start(); // TODO: don't start until after the sprite_loader finishes
}

FPSManager.prototype.start = function() {
    requestAnimationFrame(this.tick.bind(this));
}

FPSManager.prototype.tick = function() {
    var ctx = canvas.getContext('2d');

    ctx.clear();
    this.pubsub.emit("draw", {ctx: ctx});

    requestAnimationFrame(this.tick.bind(this));



    draw_sprite(ctx, 24, 24, $("#bat")[0]); // TODO: working here



}
