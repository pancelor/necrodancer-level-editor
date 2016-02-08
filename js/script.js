// (function() { // TODO: uncomment to un-global these variables once you don't need them for debugging anymore
    var pubsub = new PubSub();
    var canvas = $('#main_canvas')[0];

    var sizing_rect = Coord.from_canvas({x: canvas.width, y: canvas.height});
    var grid = new Grid(pubsub, sizing_rect.to_grid_rr(), sizing_rect.to_grid_cc());

    var input_manager = new InputManager(canvas, grid, pubsub);
    var fps = new FPSManager(pubsub);

    $(document).ready(function(){
        load_sprites(pubsub);
    });
// })();