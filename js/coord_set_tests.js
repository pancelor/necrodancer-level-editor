console.log("CoordSet test suite has started");

(function(enable_logging) {
    var my_log = function(msg) {
        if (enable_logging) {
            console.log(msg);
        }
    };

    var a1 = Coord.from_canvas({x: 10, y: 20});
    var a2 = Coord.from_canvas({x: 10, y: 20});
    var b = Coord.from_canvas({x: 20, y: 10});

    var grid = {PIX: 32, embed_pos: {x: 0, y: 0}};
    a1.grid = grid;
    a2.grid = grid;
    b.grid = grid;

    console.assert(a1.equals(a1));
    console.assert(a1.equals(a2));
    console.assert(!a1.equals(b));
    console.assert(a2.equals(a1));
    console.assert(a2.equals(a2));
    console.assert(!a2.equals(b));
    console.assert(!b.equals(a1));
    console.assert(!b.equals(a2));
    console.assert(b.equals(b));

    var cs = new CoordSet([a1, a2]);
    my_log(cs.elements)

    console.assert(cs.size() == 1);
    console.assert(cs.has(a1));
    console.assert(cs.has(a2));
    console.assert(!cs.has(b));
    console.assert(cs.has_by_grid(a1));
    console.assert(cs.has_by_grid(a2));

    console.assert(cs.add(b));
    my_log(cs.elements)

    console.assert(cs.size() == 2);
    console.assert(cs.has(a1));
    console.assert(cs.has(a2));
    console.assert(cs.has(b));

    console.assert(cs.delete(a1));
    my_log(cs.elements)

    console.assert(cs.size() == 1);
    console.assert(!cs.has(a1));
    console.assert(!cs.has(a2));
    console.assert(cs.has(b));

    cs.xor(b);
    my_log(cs.elements)

    console.assert(cs.size() == 0);
    console.assert(!cs.has(a1));
    console.assert(!cs.has(a2));
    console.assert(!cs.has(b));

    cs.xor(b);
    my_log(cs.elements)

    console.assert(cs.size() == 1);
    console.assert(!cs.has(a1));
    console.assert(!cs.has(a2));
    console.assert(cs.has(b));

    cs.xor_all([a1, b]);
    my_log(cs.elements)

    console.assert(cs.size() == 1);
    console.assert(cs.has(a1));
    console.assert(cs.has(a2));
    console.assert(!cs.has(b));

    cs.xor_all([a1, a2, b]);
    my_log(cs.elements)

    console.assert(cs.size() == 2);
    console.assert(cs.has(a1));
    console.assert(cs.has(a2));
    console.assert(cs.has(b));

    cs.delete_all([a1, a2, b]);
    my_log(cs.elements)

    console.assert(cs.size() == 0);
    console.assert(!cs.has(a1));
    console.assert(!cs.has(a2));
    console.assert(!cs.has(b));

    cs.add_all([a1, a2, b]);
    my_log(cs.elements)

    console.assert(cs.size() == 2);
    console.assert(cs.has(a1));
    console.assert(cs.has(a2));
    console.assert(cs.has(b));

    cs.clear();
    my_log(cs.elements)

    console.assert(cs.size() == 0);
    console.assert(!cs.has(a1));
    console.assert(!cs.has(a2));
    console.assert(!cs.has(b));

    cs.xor_all([a1, b]);
    my_log(cs.elements)

    console.assert(cs.size() == 2);
    console.assert(cs.has(a1));
    console.assert(cs.has(a2));
    console.assert(cs.has(b));
})(false);

console.log("CoordSet test suite has finished");
