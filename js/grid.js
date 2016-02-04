function Grid(pubsub, width, height) {
    this.board = this.init_board(width, height);

    this.setup_subs(pubsub);
};

Grid.pix = 32;

Grid.prototype.setup_subs = function(pubsub) {
    pubsub.subscribe("request_paint", this.request_paint.bind(this));
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
Grid.prototype.request_paint = function(args) {
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
        ctx.moveTo(0, rr*Grid.pix);
        ctx.lineTo(Grid.pix*this.width(), rr*Grid.pix);
        ctx.stroke();
    }
    // horizonal lines
    for (var cc = 0; cc <= this.width(); ++cc) {

        ctx.beginPath();
        ctx.moveTo(cc*Grid.pix, 0);
        ctx.lineTo(cc*Grid.pix, Grid.pix*this.height());
        ctx.stroke();
    }
    // sprites
    for (var rr = 0; rr < this.height(); ++rr) {
        for (var cc = 0; cc < this.width(); ++cc) {
            if (this.board[rr][cc]) {
                ctx.drawImage(this.board[rr][cc], cc*Grid.pix, rr*Grid.pix);
            }
        }
    }
};
