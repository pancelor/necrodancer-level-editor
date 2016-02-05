function Grid(pubsub, width, height) {
    this.board = this.init_board(width, height);

    pubsub.subscribe("request_paint", this.request_paint.bind(this));
    pubsub.subscribe("request_drag", this.request_drag.bind(this));
    pubsub.subscribe("draw", this.draw.bind(this));
}

// TODO: bounds checking? none on set() ...
Grid.prototype.get = function(coord) {
    return this.board[coord.to_grid_rr()][coord.to_grid_cc()];
}

Grid.prototype.set = function(coord, sprite) {
    this.board[coord.to_grid_rr()][coord.to_grid_cc()] = sprite;
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

Grid.prototype.init_board = function(width, height) {
    brd = new Array();
    for (var i = 0; i < height; ++i) {
        brd.push(new Array(width));
    }
    return brd;
}

// pubsub:

Grid.prototype.request_paint = function(args) {
    var coord = args.coord;
    var sprite = args.sprite;

    if (this.inbounds(coord)) {
        this.set(coord, sprite);
    }
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
                ctx.drawImage(this.board[rr][cc], cc*PIX, rr*PIX);
            }
        }
    }
}
