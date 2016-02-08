var DEFAULT_WIDTH  = 24;
var DEFAULT_HEIGHT = 24;

var sprite_table = new Map();

function load_sprites(pubsub) {

    function load_entity(xml_leaf) {
        var name = _load_sprite_from_xml(
            xml_leaf.getElementsByTagName("spritesheet")[0]
        );
        var type_code = xml_leaf.getAttribute("id");
        insert_sprite_into_DOM("entities", "resources/images/entities", name, type_code);
        create_button(name);
    }

    function load_item(xml_leaf) {
        var name = _load_sprite_from_xml(
            xml_leaf,
            "resources/images/items"
        );
        insert_sprite_into_DOM("items", "resources/images/items", name, name);
        create_button(name);
    }

    function insert_sprite_into_DOM(type, folder, name, type_code) {
        // type = items | entities | traps | walls
        $("#resources > #"+type).append(
            "<img class='sprite' " +
                "id='" + name + "' " +
                "src='"+folder+"/" + name + ".png' " +
                "title='" + name + "' " +
                "data-type-code='" + type_code + "' " +
                "/>"
        );
    }

    function _load_sprite_from_xml(xml_leaf) {
        var name = _.last(xml_leaf.textContent.split("/")).replace(".png", "").toLowerCase();

        var height   = xml_leaf.getAttribute("imageH") || xml_leaf.getAttribute("frameH") || DEFAULT_WIDTH;
        var width    = xml_leaf.getAttribute("imageW") || xml_leaf.getAttribute("frameW") || DEFAULT_HEIGHT;
        var y_offset = xml_leaf.getAttribute("yOff")   || Math.floor((24-height)/2);
        var x_offset = xml_leaf.getAttribute("xOff")   || Math.floor((24-width)/2);

        sprite_table.set(name, {
            width:  parseInt(width),
            height: parseInt(height),
            dx:     parseInt(x_offset),
            dy:     parseInt(y_offset),
        });

        return name;
    }

    function create_button(name) {
        var sdata = sprite_table.get(name);
        $("#sprite_selection_area").append(
            "<canvas class='sprite_holder' "+
                     "id='canvas_"+name+"' " +
                     "width="+sdata.width+" "+
                     "height="+sdata.height+"></canvas>"
        );

        var img = $(".sprite#"+name)[0];
        $("#canvas_"+name).on("click", function() {
            pubsub.emit("select_sprite", {sprite: img});
        });
        $("#canvas_"+name).on("dblclick", function() {
            pubsub.emit("request_fill_selection_with", {sprite: img});
        });
        var ctx = $("#canvas_"+name)[0].getContext('2d');
        ctx.drawImage(img,
                      0, 0, sdata.width, sdata.height,
                      0, 0, sdata.width, sdata.height);
    }

    $.get("resources/necrodancer.xml", function(xml) {
        var items = xml.getElementsByTagName("items")[0];
        var entities = xml.getElementsByTagName("enemies")[0];
        _.each(items.children, load_item);
        _.each(entities.children, load_entity);

        pubsub.emit("sprites_loaded_from_server");
    });
}

function draw_sprite(ctx, img, x, y, alpha) {
    var sdata = sprite_table.get(img.id);
    if (alpha) {
        var old_alpha = ctx.globalAlpha;
        ctx.globalAlpha = alpha;
    }

    ctx.drawImage(img,
                  0, 0,
                  sdata.width, sdata.height,
                  x + sdata.dx, y + sdata.dy,
                  sdata.width, sdata.height);

    // cleanup
    if (alpha) {
        ctx.globalAlpha = old_alpha;
    }
}