// (function() { // TODO: uncomment to un-global these variables once you don't need them for debugging anymore
    var pubsub = new PubSub();
    var canvas = $('#main_canvas')[0];

    var timeline = new Timeline();
    var grid = new Grid(pubsub, timeline, canvas.width, canvas.height);

    var input_manager = new InputManager(canvas, grid, pubsub);
    var fps = new FPSManager(pubsub);

    $(document).ready(function(){
        load_sprites(pubsub);
    });
// })();