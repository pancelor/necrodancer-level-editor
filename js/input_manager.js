function InputManager(canvas, pubsub, default_sprite) {
    this.canvas = canvas;
    this.pubsub = pubsub;

    this.sprite = default_sprite;
    this.mouse_pos = Coord.from_mouse(canvas, {x: 0, y: 0});

    this.moving = false;
    this.selecting = false;

    this.pubsub.subscribe("draw", this.draw.bind(this));
    this.pubsub.subscribe("sprite_selected", this.choose_sprite.bind(this));
};

InputManager.prototype.register_listeners = function(canvas) {
    canvas.addEventListener("mousemove", this.mousemove.bind(this));
    canvas.addEventListener("click", this.click.bind(this));
    canvas.addEventListener("mousedown", this.mousedown.bind(this));
    canvas.addEventListener("mouseup", this.mouseup.bind(this));
};

InputManager.prototype.mousemove = function(evt) {
    evt.preventDefault();
    this.mouse_pos = Coord.from_mouse(this.canvas, evt);
};

InputManager.prototype.click = function(evt) {
    evt.preventDefault();
    switch (this.current_tool()) {
    case "place":
        this.pubsub.emit("sprite_placement_attempt",
                         {coord: Coord.from_mouse(this.canvas, evt),
                          sprite: this.sprite});
        break;
    case "select":
        break;
    case "move":
        break;
    default:
        console.error("switch fall-through");
    }
};

InputManager.prototype.mousedown = function(evt) {
    evt.preventDefault();
    switch (this.current_tool()) {
    case "place":
        break;
    case "select":
        this.selecting = true;
        this.select_origin = Coord.from_mouse(this.canvas, evt);
        break;
    case "move":
        console.warn("moving is unimplemented");
        break;
    default:
        console.error("switch fall-through");
    }
};

InputManager.prototype.mouseup = function(evt) {
    evt.preventDefault();
    switch (this.current_tool()) {
    case "place":
        break;
    case "select":
        if (this.selecting){
            this.selecting = false;
            this.pubsub.emit("mouse_selection",
                             {coord1: this.select_origin,
                              coord2: this.mouse_pos});
        }
        break;
    case "move":
        console.warn("moving is unimplemented");
        break;
    default:
        console.error("switch fall-through");
    }
};

InputManager.prototype.current_tool = function() {
    return $("input[name=tool_select]:checked").val();
};

// pubsub
InputManager.prototype.choose_sprite = function(args) {
    var sprite = args.sprite;

    this.sprite = sprite;
};

// pubsub
InputManager.prototype.draw = function(args) {
    var ctx = args.ctx;

    switch (this.current_tool()) {
    case "place":
        draw_centered(ctx, this.sprite, this.mouse_pos.to_canvas());
        break;
    case "select":
        break;
    case "move":
        draw_centered(ctx, $("img#move_cursor")[0], this.mouse_pos.to_canvas());
        break;
    default:
        console.error("switch fall-through");
    }
    if (this.moving) {
        console.warn("move tool is unimplemented");
    }
    if (this.selecting) {
        draw_rect(ctx,
                  this.select_origin.to_canvas_x(),
                  this.select_origin.to_canvas_y(),
                  this.mouse_pos.to_canvas_x(),
                  this.mouse_pos.to_canvas_y(),
                  "blue",
                  0.2);
    }
};