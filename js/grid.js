function Grid(pubsub, row_count, col_count) {
    this.board = this.init_board(row_count, col_count);

    // for undo/redo functionality:
    this.timeline = {past: [], future: []};
    this.current_action_buffer = [];

    pubsub.subscribe("request_paint", this.request_paint.bind(this));
    pubsub.subscribe("request_drag", this.request_drag.bind(this));
    pubsub.subscribe("request_undo", this.request_undo.bind(this));
    pubsub.subscribe("request_redo", this.request_redo.bind(this));
    pubsub.subscribe("start_stroke", this.start_stroke.bind(this));
    pubsub.subscribe("end_stroke", this.end_stroke.bind(this));
    pubsub.subscribe("draw", this.draw.bind(this));
}

// TODO: bounds checking? none on set() ...
Grid.prototype.get = function(coord) {
    return this.board[coord.to_grid_rr()][coord.to_grid_cc()];
}

Grid.prototype.set = function(coord, sprite) {
    var old = this.board[coord.to_grid_rr()][coord.to_grid_cc()];
    this.board[coord.to_grid_rr()][coord.to_grid_cc()] = sprite;
    if (old != sprite) {
        this.current_action_buffer.push({
            coord: coord,
            before: old,
            after: sprite
        });
    }
}

Grid.prototype.request_undo = function() {
    var last_action = this.timeline.past.splice(-1)[0]; // note: this mutates the array as well, splitting off its last element

    var that = this;
    if (last_action) {
        last_action.undo(function(coord, sprite){
            // bypass that.set() to avoid updating the history
            that.board[coord.to_grid_rr()][coord.to_grid_cc()] = sprite;
        });
        this.timeline.future.unshift(last_action);
    }
}

Grid.prototype.request_redo = function() {
    var next_action = this.timeline.future.splice(0, 1)[0]; // note: this mutates the array as well, splitting off its last element

    var that = this;
    if (next_action) {
        next_action.redo(function(coord, sprite){
            // bypass that.set() to avoid updating the history
            that.board[coord.to_grid_rr()][coord.to_grid_cc()] = sprite;
        });
        this.timeline.past.push(next_action);
    }
}

Grid.prototype.flood_select = function(coord) {
    var selection = new CoordSet();
    var sprite = this.get(coord);
    var DIRECTIONS = [
        Coord.from_grid({rr: 0, cc: 1}),
        Coord.from_grid({rr: -1, cc: 0}),
        Coord.from_grid({rr: 0, cc: -1}),
        Coord.from_grid({rr: 1, cc: 0}),
    ];

    var queue = [coord];
    var that = this;
    while (queue.length != 0) {
        var current = queue.pop();
        selection.add(current);

        DIRECTIONS.forEach(function(dir) {
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

Grid.prototype.start_stroke = function(args) {
    this.timeline.future = [];
    this.current_action_buffer = [];
}

Grid.prototype.end_stroke = function(args) {
    this.timeline.past.push(new StrokeRecord(this.current_action_buffer));
}

Grid.prototype.apply_changes = function(changes) {
    var that = this;
    _.each(changes, function(args) {
        that.set(args.coord, args.sprite);
    });
}

Grid.prototype.draw = function(args) {
    var ctx = args.ctx;

    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // vertical lines
    for (var rr = 0; rr <= this.height(); ++rr) {
        ctx.beginPath();
        ctx.moveTo(0, rr*PIX);
        ctx.lineTo(PIX*this.width(), rr*PIX);
        ctx.stroke();
    }
    // horizonal lines
    for (var cc = 0; cc <= this.width(); ++cc) {

        ctx.beginPath();
        ctx.moveTo(cc*PIX, 0);
        ctx.lineTo(cc*PIX, PIX*this.height());
        ctx.stroke();
    }
    // sprites
    for (var rr = 0; rr < this.height(); ++rr) {
        for (var cc = 0; cc < this.width(); ++cc) {
            if (this.board[rr][cc]) {
                draw_sprite(ctx, this.board[rr][cc], cc*PIX, rr*PIX)
                // ctx.drawImage(this.board[rr][cc], cc*PIX, rr*PIX);
            }
        }
    }
}
