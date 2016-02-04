var pubsub = new PubSub();

var canvas = $('#main_canvas')[0];
var grid = new Grid(pubsub, 8, 5);

var input_manager = new InputManager(canvas, pubsub, $('#red')[0]);
input_manager.register_listeners(canvas);


function choose_sprite(sprite) {
    pubsub.emit("choose_sprite",
                input_manager.set_contents.bind(sprite));
}

$('#red').on("click", choose_sprite.bind(this));
$('#blue').on("click", choose_sprite.bind(this));
$('#green').on("click", choose_sprite.bind(this));


var fps = new FPSManager(canvas, pubsub);

