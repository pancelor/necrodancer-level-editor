console.log("CoordSet test suite has started");

(function() {
    var a1 = Coord.from_canvas({x: 10, y: 20});
    var a2 = Coord.from_canvas({x: 10, y: 20});
    var b = Coord.from_canvas({x: 20, y: 10});

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

    console.assert(cs.size() == 1);
    console.assert(cs.has(a1));
    console.assert(cs.has(a2));
    console.assert(!cs.has(b));
    console.assert(cs.has_by_grid(a1));
    console.assert(cs.has_by_grid(a2));

    console.assert(cs.add(b));

    console.assert(cs.size() == 2);
    console.assert(cs.has(a1));
    console.assert(cs.has(a2));
    console.assert(cs.has(b));

    console.assert(cs.delete(a1));

    console.assert(cs.size() == 1);
    console.assert(!cs.has(a1));
    console.assert(!cs.has(a2));
    console.assert(cs.has(b));

    cs.xor(b);

    console.assert(cs.size() == 0);
    console.assert(!cs.has(a1));
    console.assert(!cs.has(a2));
    console.assert(!cs.has(b));

    cs.xor(b);

    console.assert(cs.size() == 1);
    console.assert(!cs.has(a1));
    console.assert(!cs.has(a2));
    console.assert(cs.has(b));

    cs.xor_all([a1, b]);

    console.assert(cs.size() == 1);
    console.assert(cs.has(a1));
    console.assert(cs.has(a2));
    console.assert(!cs.has(b));

    cs.xor_all([a1, a2, b]);

    console.assert(cs.size() == 2);
    console.assert(cs.has(a1));
    console.assert(cs.has(a2));
    console.assert(cs.has(b));

    cs.delete_all([a1, a2, b]);

    console.assert(cs.size() == 0);
    console.assert(!cs.has(a1));
    console.assert(!cs.has(a2));
    console.assert(!cs.has(b));

    cs.add_all([a1, a2, b]);

    console.assert(cs.size() == 2);
    console.assert(cs.has(a1));
    console.assert(cs.has(a2));
    console.assert(cs.has(b));

    cs.clear();

    console.assert(cs.size() == 0);
    console.assert(!cs.has(a1));
    console.assert(!cs.has(a2));
    console.assert(!cs.has(b));
})();

console.log("CoordSet test suite has finished");
