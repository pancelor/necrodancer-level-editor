var DEFAULT_WIDTH = "24"; // TODO: is 24 the right defaults here?
var DEFAULT_HEIGHT = "24";

var sprite_table = new Map();

var items;
var enemies;
var x; // debug
$("#necrodancer_xml").load("images/necrodancer.xml", undefined, function(xml) {
    xml = $.parseXML(xml);
    x = xml;
    items = xml.getElementsByTagName("items")[0];
    enemies = xml.getElementsByTagName("enemies")[0];
    _.each(items.children, add_into_sprite_table);
    _.each(enemies.children, function(child) {
        add_into_sprite_table(child.getElementsByTagName("spritesheet")[0]);
    });
    console.log(sprite_table)
    // $("#sprite_holder").css("display", "none"); // TODO: this doesn't work for some reason
});


function add_into_sprite_table(xml_leaf) {
    var name = _.last(xml_leaf.textContent.split("/")).replace(".png", "");

    var height   = xml_leaf.getAttribute("imageH") || xml_leaf.getAttribute("frameH") || DEFAULT_WIDTH;
    var width    = xml_leaf.getAttribute("imageW") || xml_leaf.getAttribute("frameW") || DEFAULT_HEIGHT;
    var y_offset = xml_leaf.getAttribute("yOff")   || "0";
    var x_offset = xml_leaf.getAttribute("xOff")   || "0";

    sprite_table.set(name, {
        width:  parseInt(width),
        height: parseInt(height),
        dx:     parseInt(x_offset),
        dy:     parseInt(y_offset),
    });


    $("#sprite_holder").after(
        "<img class='sprite' id='" + name + "' src='images/" + name + ".png' />");
    // $("#"+name).css("display", "none");
}

function draw_sprite(ctx, x, y, img) {
    var sdata = sprite_table.get(img.id);
    ctx.drawImage(img,
                  0, 0,
                  sdata.width, sdata.height,
                  x + sdata.dx, y + sdata.dy,
                  sdata.width, sdata.height);
}