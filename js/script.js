var canvas = $('#main_canvas')[0];
var ctx = canvas.getContext('2d');

var mouse_manager = new MouseManager(canvas, $('#red')[0]);
var grid = new Grid(canvas, 8, 5);

canvas.addEventListener("mousemove", function(evt) {
    mouse_manager.mousemove(Coord.from_mouse(canvas, evt));
});

canvas.addEventListener("click", function(evt) {
    mouse_manager.click(Coord.from_mouse(canvas, evt), grid);
});

canvas.addEventListener("mousedown", function(evt) {
    mouse_manager.mousedown(Coord.from_mouse(canvas, evt), grid);
});

canvas.addEventListener("mouseup", function(evt) {
    mouse_manager.mouseup(Coord.from_mouse(canvas, evt), grid);
});

function make_me_active() {
    mouse_manager.set_contents(this);
}

$('#red').on("click", make_me_active);
$('#blue').on("click", make_me_active);
$('#green').on("click", make_me_active);
