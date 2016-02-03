function Grid(canvas, width, height) {
    this.canvas = canvas;
    this.board = this.init_board(width, height);
    this.pix = 32;

    this.setup();
};

Grid.prototype.setup = function() {
    requestAnimationFrame(this.render.bind(this));
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

Grid.prototype.select = function(coord1, coord2) {
    var grid_rr_low = clamp(Math.min(coord1.to_grid_rr(this), coord2.to_grid_rr(this)), 0, this.height()-1);
    var grid_cc_low = clamp(Math.min(coord1.to_grid_cc(this), coord2.to_grid_cc(this)), 0, this.width()-1);
    var grid_rr_high = clamp(Math.max(coord1.to_grid_rr(this), coord2.to_grid_rr(this)), 0, this.height()-1);
    var grid_cc_high = clamp(Math.max(coord1.to_grid_cc(this), coord2.to_grid_cc(this)), 0, this.width()-1);

    this.select_rect = {
        c1: Coord.from_grid(this.canvas, this, {rr: grid_rr_low, cc: grid_cc_low}),
        c2: Coord.from_grid(this.canvas, this, {rr: grid_rr_high, cc: grid_cc_high}),
    };
};

Grid.prototype.place_at_click = function(coord, sprite) {
    if (this.inbounds(coord)) {
        this.board[grid_y][grid_x] = sprite;
    }
};

Grid.prototype.inbounds = function(coord) {
    return (0 <= coord.to_grid_cc(this) &&
            coord.to_grid_cc(this) < this.width() &&
            0 <= coord.to_grid_rr(this) &&
            coord.to_grid_rr(this) < this.height());
};

Grid.prototype.render = function() {
    var ctx = this.canvas.getContext('2d');
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
        var one_past_c2 = Coord.from_grid(
            this.canvas,
            this,
            {rr: this.select_rect.c2.to_grid_rr(this) + 1,
             cc: this.select_rect.c2.to_grid_cc(this) + 1})
        draw_rect(ctx,
                  this.select_rect.c1.to_canvas_x(),
                  this.select_rect.c1.to_canvas_y(),
                  one_past_c2.to_canvas_x(),
                  one_past_c2.to_canvas_y(),
                  "blue",
                  0.2);
        // for (var rr = this.select_rect.y1; rr < this.select_rect.y2; ++rr) {
        //     for (var cc = this.select_rect.x1; cc < this.select_rect.x2; ++cc) {
        //         draw_rect();
        //     }
        // }
    }
    requestAnimationFrame(this.render.bind(this));
};
