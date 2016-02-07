var pubsub = new PubSub();

var canvas = $('#main_canvas')[0];

var sizing_rect = Coord.from_canvas({x: canvas.width, y: canvas.height});
var grid = new Grid(pubsub, sizing_rect.to_grid_rr(), sizing_rect.to_grid_cc());

var input_manager = new InputManager(canvas, grid, pubsub, $('#red')[0]);
input_manager.register_listeners(canvas);

var fps = new FPSManager(canvas, pubsub);

load_sprites(pubsub);

// $("#sprite_search_bar").on("search", function(evt) {
//     console.log("search");
//     console.log(evt);
// })

$("#sprite_search_bar").on("keyup", function(evt) {
    var search_string = this.value;
    var results = _.partition($(".sprite_canvas"), function(spr){
        return fuzzy_match(spr.id, search_string);
    });
    $(results[0]).show();
    $(results[1]).hide();
})