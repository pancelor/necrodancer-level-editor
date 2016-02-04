function Grid(pubsub, width, height) {
    this.board = this.init_board(width, height);
    this.pix = 32;

    this.setup_subs(pubsub);
};

Grid.prototype.setup_subs = function(pubsub) {
    pubsub.subscribe("sprite_placement_attempt", this.sprite_placement_attempt.bind(this));
    pubsub.subscribe("mouse_selection", this.mouse_selection.bind(this));
    pubsub.subscribe("draw", this.draw.bind(this));
};

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
};

// pubsub
Grid.prototype.mouse_selection = function(args) {
    var coord1 = args.coord1;
    var coord2 = args.coord2;

    var grid_rr_1 = Math.min(coord1.to_grid_rr(this), coord2.to_grid_rr(this));
    var grid_cc_1 = Math.min(coord1.to_grid_cc(this), coord2.to_grid_cc(this));
    var grid_rr_2 = Math.max(coord1.to_grid_rr(this), coord2.to_grid_rr(this));
    var grid_cc_2 = Math.max(coord1.to_grid_cc(this), coord2.to_grid_cc(this));

    if (this.inbounds(Coord.from_grid(this, {rr: grid_rr_1, cc: grid_cc_1}))) {
        this.select_rect = {
            c1: Coord.from_grid(
                this,
                {
                    rr: clamp(grid_rr_1, 0, this.height()-1),
                    cc: clamp(grid_cc_1, 0, this.width()-1),
                }
            ),
            c2: Coord.from_grid(
                this,
                {
                    rr: clamp(grid_rr_2, 0, this.height()-1),
                    cc: clamp(grid_cc_2, 0, this.width()-1),
                }
            ),
        };
        // console.log(this.select_rect.c1.to_grid(this));
        // console.log(this.select_rect.c2.to_grid(this));
    }
};

// pubsub
Grid.prototype.sprite_placement_attempt = function(args) {
    var coord = args.coord;
    var sprite = args.sprite;

    if (this.inbounds(coord)) {
        this.board[coord.to_grid_rr(this)][coord.to_grid_cc(this)] = sprite;
    }
};

Grid.prototype.inbounds = function(coord) {
    return (0 <= coord.to_grid_cc(this) &&
            coord.to_grid_cc(this) < this.width() &&
            0 <= coord.to_grid_rr(this) &&
            coord.to_grid_rr(this) < this.height());
};

// pubsub
Grid.prototype.draw = function(args) {
    var ctx = args.ctx;

    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // vertical lines
    for (var rr = 0; rr <= this.height(); ++rr) {
        ctx.beginPath();
        ctx.moveTo(0, rr*this.pix);
        ctx.lineTo(this.pix*this.width(), rr*this.pix);
        ctx.stroke();
    }
    // horizonal lines
    for (var cc = 0; cc <= this.width(); ++cc) {

        ctx.beginPath();
        ctx.moveTo(cc*this.pix, 0);
        ctx.lineTo(cc*this.pix, this.pix*this.height());
        ctx.stroke();
    }
    // sprites
    for (var rr = 0; rr < this.height(); ++rr) {
        for (var cc = 0; cc < this.width(); ++cc) {
            if (this.board[rr][cc]) {
                ctx.drawImage(this.board[rr][cc], cc*this.pix, rr*this.pix);
            }
        }
    }

    // select rect
    if (this.select_rect) {
        draw_rect(ctx,
                  this.select_rect.c1.to_canvas_x(),
                  this.select_rect.c1.to_canvas_y(),
                  this.select_rect.c2.to_canvas_x() + this.pix,
                  this.select_rect.c2.to_canvas_y() + this.pix,
                  "blue",
                  0.2);
    }
};
