function Grid(pubsub, timeline, width, height) {
    // set up position data, then use it to determine how big to make the internal array representation
    this.PIX = 24;
    this.embed_pos = {x: 5, y: 8};

    var sizing_rectangle = Coord.from_canvas({x: width, y: height});
    sizing_rectangle.grid = this;
    var row_count = sizing_rectangle.to_grid_rr();
    var col_count = sizing_rectangle.to_grid_cc();
    this.board = this.init_board(row_count, col_count);

    this.timeline = timeline;

    pubsub.on("request_paint", this.request_paint.bind(this));
    pubsub.on("request_drag", this.request_drag.bind(this));
    pubsub.on("draw", this.draw.bind(this));
}

Grid.prototype.get = function(coord) {
    return this.board[coord.to_grid_rr()][coord.to_grid_cc()];
}

Grid.prototype.set = function(coord, sprite) {
    var old = this.get(coord);
    this.raw_set(coord, sprite);
    if (old !== sprite) {
        this.timeline.current_action_buffer.push({
            coord: coord,
            grid: this,
            before: old,
            after: sprite
        });
    }
}

Grid.prototype.raw_set = function(coord, sprite) {
    this.board[coord.to_grid_rr()][coord.to_grid_cc()] = sprite;
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
    return this.board[0].length;
}

Grid.prototype.height = function() {
    return this.board.length;
}

Grid.prototype.init_board = function(row_count, col_count) {
    brd = new Array();
    for (var i = 0; i < row_count; ++i) {
        brd.push(new Array(col_count));
    }
    return brd;
}

Grid.prototype.to_xml = function() {
    // TODO: this is just proof-of-concept for now
    var result = [];
    for (var rr = 0; rr < this.height(); ++rr) {
        for (var cc = 0; cc < this.width(); ++cc) {
            var sprite = this.board[rr][cc];
            if (sprite) {
                result.push(
                    '<TODO x="'+cc+'" '
                    +'y="'+rr+'" '
                    +'type="'+sprite.dataset.typeCode+'"></TODO>'
                );
            }
        }
    }
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
            draw_sprite(ctx, this.get(coord), coord.to_canvas_x(), coord.to_canvas_y())
        }
    }
}

Grid.prototype.draw_line = function(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1 + this.embed_pos.x, y1 + this.embed_pos.y);
    ctx.lineTo(x2 + this.embed_pos.x, y2 + this.embed_pos.y);
    ctx.stroke();
}
