// (function() { // TODO: uncomment to un-global these variables once you don't need them for debugging anymore
    var pubsub = new PubSub();
    var canvas = $('#main_canvas')[0];

    var grid = new Grid(pubsub, canvas.width, canvas.height);

    var input_manager = new InputManager(canvas, grid, pubsub);
    var fps = new FPSManager(pubsub);

    window.onload = function(){
        load_sprites(pubsub);
    };
// })();