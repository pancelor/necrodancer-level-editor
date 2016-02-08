function FPSManager(pubsub) {
    this.pubsub = pubsub;

    pubsub.on("sprites_loaded_from_server", this.sprites_loaded_from_server.bind(this));
    // this.start(); // TODO: don't start until after the sprite_loader finishes
}

FPSManager.prototype.sprites_loaded_from_server = function() {
    requestAnimationFrame(this.tick.bind(this));
}

FPSManager.prototype.tick = function() {
    var ctx = $("#main_canvas")[0].getContext('2d');

    ctx.clear();
    this.pubsub.emit("draw", {ctx: ctx});

    requestAnimationFrame(this.tick.bind(this));
}
