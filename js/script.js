var pubsub = new PubSub();

var canvas = $('#main_canvas')[0];

var sizing_rect = Coord.from_canvas({x: canvas.width, y: canvas.height});
var grid = new Grid(pubsub, sizing_rect.to_grid_rr(), sizing_rect.to_grid_cc());

var input_manager = new InputManager(canvas, grid, pubsub, $('#red')[0]);
input_manager.register_listeners(canvas);


function request_sprite(sprite) {
    pubsub.emit("request_sprite", {sprite: sprite});
}
$('#red').on("click", function() {
    request_sprite($('#red')[0]);
});
$('#blue').on("click", function() {
    request_sprite($('#blue')[0]);
});
$('#green').on("click", function() {
    request_sprite($('#green')[0]);
});


var fps = new FPSManager(canvas, pubsub);

// disable unwanted events
$('#main_canvas').on('contextmenu', _.constant(false));
$('#main_canvas').on('dblclick',    _.constant(false));
$('#main_canvas').on('dragstart',   _.constant(false));
$('#main_canvas').on('drag',        _.constant(false));
$('#main_canvas').on('dragend',     _.constant(false));
$('#main_canvas').on('mousedown', function(evt) {
    var buttons = new MouseButtons(evt);
    if (buttons.middle) {
        return false
    }
});
