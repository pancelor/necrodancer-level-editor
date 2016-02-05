var pubsub = new PubSub();

var canvas = $('#main_canvas')[0];
$('#main_canvas').on('contextmenu', function(e){ return false; }); // disable right-click
var grid = new Grid(pubsub, 16, 10);

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
