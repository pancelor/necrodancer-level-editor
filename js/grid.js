function Grid(pubsub, width, height) {
    // set up position data, then use it to determine how big to make the internal array representation
    this.PIX = 24;
    this.embed_pos = {x: 5, y: 8};

    var sizing_rectangle = Coord.from_canvas({x: width, y: height});
    sizing_rectangle.grid = this;
    this.row_count = sizing_rectangle.to_grid_rr();
    this.col_count = sizing_rectangle.to_grid_cc();
    this.board = {
        env:      this.init_2d_array(this.row_count, this.col_count),
        entities: this.init_2d_array(this.row_count, this.col_count),
    };
    this.layer = "entities"

    this.timeline = new Timeline(pubsub, this);

    pubsub.on("request_paint", this.request_paint.bind(this));
    pubsub.on("request_drag", this.request_drag.bind(this));
    pubsub.on("draw", this.draw.bind(this));
}

Grid.prototype.toggle_layer = function(coord) {
    this.layer = (this.layer === "entities") ? "env" : "entities";
}

Grid.prototype.infer_layer = function(sprite) {
    if (!sprite) {
        return this.layer;
    } else {
        var p_id = $(sprite).parent()[0].id;
        switch (p_id) {
        case "items":
        case "entities":
        case "traps":
            return "entities";
            break;
        case "walls":
            return "env";
            break;
        default:
            console.error("switch fall-through");
            console.log("p_id:");
            console.log(p_id);
        }
    }
}

Grid.prototype.get = function(coord) {
    return this.board[this.layer][coord.to_grid_rr()][coord.to_grid_cc()];
}

Grid.prototype.set = function(coord, sprite) {
    var old = this.get(coord);
    var layer = this.infer_layer(sprite);
    this.raw_set(coord, layer, sprite);
    if (old !== sprite) {
        this.timeline.current_action_buffer.push({
            coord: coord,
            layer: layer,
            before: old,
            after: sprite
        });
    }
}

// only call this method (instead of .set()) if you don't want the changes to be recorded in the timeline
Grid.prototype.raw_set = function(coord, layer, sprite) {
    this.board[layer][coord.to_grid_rr()][coord.to_grid_cc()] = sprite;
}

Grid.prototype.flood_select = function(coord) {
    var selection = new CoordSet();
    var sprite = this.get(coord);
    var DIRECTIONS = [
        Coord.from_grid(coord.grid, {rr: 0, cc: 1}),
        Coord.from_grid(coord.grid, {rr: -1, cc: 0}),
        Coord.from_grid(coord.grid, {rr: 0, cc: -1}),
        Coord.from_grid(coord.grid, {rr: 1, cc: 0}),
    ];

    var queue = [coord];
    var that = this;
    while (queue.length != 0) {
        // console.log(queue.length)
        var current = queue.pop();
        selection.add(current);

        _(DIRECTIONS).each(function(dir) {
            var next = current.plus(dir);
            if (!selection.has(next)
                    && that.inbounds(next)
                    && that.get(next) === sprite) {
                queue.push(next);
            }
        });
    }
    return selection;
}

Grid.prototype.inbounds = function(coord) {
    return (0 <= coord.to_grid_cc() &&
            coord.to_grid_cc() < this.width() &&
            0 <= coord.to_grid_rr() &&
            coord.to_grid_rr() < this.height());
}

Grid.prototype.width = function() {
    return this.col_count;
}

Grid.prototype.height = function() {
    return this.row_count;
}

Grid.prototype.init_2d_array = function(row_count, col_count) {
    brd = new Array();
    for (var i = 0; i < row_count; ++i) {
        brd.push(new Array(col_count));
    }
    return brd;
}

Grid.prototype.to_xml = function() {
    // TODO: this is just proof-of-concept for now
    var result = [];
    _(["env", "entities"]).each(function(layer) {
        for (var rr = 0; rr < this.height(); ++rr) {
            for (var cc = 0; cc < this.width(); ++cc) {
                var sprite = this.board[layer][rr][cc];
                if (sprite) {
                    result.push(
                        '<TODO x="'+cc+'" '
                        +'y="'+rr+'" '
                        +'type="'+sprite.dataset.typeCode+'"></TODO>'
                    );
                }
            }
        }
    });
    return result.join("");
}

// pubsub:

Grid.prototype.request_paint = function(args) {
    var coords = args.coords;
    var sprite = args.sprite;

    var that = this;
    coords.forEach(function(crd){
        if (that.inbounds(crd)) {
            that.set(crd, sprite);
        }
    });
}

Grid.prototype.request_drag = function(args) {
    var delta = args.delta;
    var copy = args.copy;
    var selection = args.selection;

    var sprite;
    var delete_buffer = [];
    var write_buffer = [];

    var that = this;
    selection.forEach(function(coord) { // TODO: copy to buffer first
        sprite = that.get(coord);
        delete_buffer.push({coord: coord, sprite: undefined});

        var new_coord = coord.plus(delta);
        if (that.inbounds(new_coord)) {
            write_buffer.push({coord: new_coord, sprite: sprite});
        }
    });

    if (!copy) {
        this.apply_changes(delete_buffer);
    }
    this.apply_changes(write_buffer);
}

Grid.prototype.apply_changes = function(changes) {
    var that = this;
    _(changes).each(function(args) {
        that.set(args.coord, args.sprite);
    });
}

Grid.prototype.draw = function(args) {
    var ctx = args.ctx;

    // draw grid lines
        // prep
        var old_line_width = ctx.lineWidth;
        ctx.lineWidth = 1;

        var old_line_dash = ctx.getLineDash();
        ctx.setLineDash([4, 4]);

        //draw

        // vertical lines
        for (var rr = 0; rr <= this.height(); ++rr) {
            this.draw_line(ctx,
                           0, rr*this.PIX,
                           this.PIX*this.width(), rr*this.PIX);
        }
        // horizonal lines
        for (var cc = 0; cc <= this.width(); ++cc) {
            this.draw_line(ctx,
                           cc*this.PIX, 0,
                           cc*this.PIX, this.PIX*this.height());
        }

        // cleanup
        ctx.lineWidth = old_line_width;
        ctx.setLineDash(old_line_dash);

    // draw sprites
    for (var rr = 0; rr < this.height(); ++rr) {
        for (var cc = 0; cc < this.width(); ++cc) {
            var coord = Coord.from_grid(this, {rr: rr, cc: cc});
            // TODO: need to change this to some sort of sprite.draw once I add multi-objects
            draw_sprite(ctx, this.get(coord), coord.to_canvas_x(), coord.to_canvas_y());
        }
    }
}

Grid.prototype.draw_line = function(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1 + this.embed_pos.x, y1 + this.embed_pos.y);
    ctx.lineTo(x2 + this.embed_pos.x, y2 + this.embed_pos.y);
    ctx.stroke();
}
