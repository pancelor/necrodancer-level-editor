var sprite_table = new Map();

const DEFAULT_WIDTH  = 24;
const DEFAULT_HEIGHT = 24;
const ERASER = $('#resources > #custom > #eraser')[0];

function load_sprites(pubsub) {

    function load_item(xml_leaf) {
        var name = _load_sprite_from_xml(xml_leaf);
        var img = insert_sprite_into_DOM("items", "resources/images/items", name, name);
        create_sprite_selector(img, $("#sprite_palette > details > div#items"));
    }

    function load_entity(xml_leaf) {
        var name = _load_sprite_from_xml(
            xml_leaf.getElementsByTagName("spritesheet")[0]
        );
        var type_code = xml_leaf.getAttribute("id"); // e.g. warlocks are id #319 in the necrodancer.exe level editor
        if (type_code) { // If there's no type code, it's impossible to put into a level (e.g. it's a boss)
            var img = insert_sprite_into_DOM("entities", "resources/images/entities", name, type_code);
            create_sprite_selector(img, $("#sprite_palette > details > div#entities"));
        }
    }

    function load_trap(xml_leaf) {
        var name = _load_sprite_from_xml(xml_leaf);
        var img = insert_sprite_into_DOM("traps", "resources/images/traps", name, -1); // TODO: figure out where to get type-codes
        create_sprite_selector(img, $("#sprite_palette > details > div#traps"));
    }

    function load_wall(xml_leaf) {
        var name = _load_sprite_from_xml(xml_leaf);
        var img = insert_sprite_into_DOM("walls", "resources/images/level", name, -1); // TODO: figure out where to get type-codes
        create_sprite_selector(img, $("#sprite_palette > details > div#walls"));
    }

    function insert_sprite_into_DOM(type, folder, name, type_code) {
        // type = items | entities | traps | walls

        var img = $("<img/>", {
            class: 'sprite',
            id: name,
            src: folder + "/" + name + ".png",
            title: name,
            "data-type-code": type_code
        })[0];
        $("#resources > #"+type).append(img);

        return img;
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

    function create_sprite_selector(img, jq_DOM_location) {
        var name = img.id;
        var sdata = sprite_table.get(name);

        var canvas_button = $("<canvas/>", {
            class: 'sprite_holder',
            id: 'canvas_' + name,
        })[0];
        canvas_button.width  = img.width; // can't initialize these earlier b/c jquery would think it's css instead of attributes
        canvas_button.height = img.height;

        jq_DOM_location.append(canvas_button);

        $(canvas_button).on("click", function() {
            pubsub.emit("select_sprite", {sprite: img});
        }).on("dblclick", function() {
            pubsub.emit("request_fill_selection", {sprite: img});
        });

        canvas_button.getContext('2d').drawImage(img,
            0, 0, img.width, img.height,
            0, 0, img.width, img.height);
    }

    function create_eraser_selector(){
        var img = undefined;
        var jq_DOM_location = $("#sprite_palette > details > div#eraser");

        var name = ERASER.id;
        var sdata = {width: ERASER.width, height: ERASER.height};

        var canvas_button = $("<canvas/>", {
            class: 'sprite_holder',
            id: 'canvas_' + name,
        })[0];
        canvas_button.width  = sdata.width; // can't initialize these earlier b/c jquery would think it's css instead of attributes
        canvas_button.height = sdata.height;

        jq_DOM_location.append(canvas_button);

        $(canvas_button).on("click", function() {
            pubsub.emit("select_sprite", {sprite: img});
        }).on("dblclick", function() {
            pubsub.emit("request_fill_selection", {sprite: img});
        });

        canvas_button.getContext('2d').drawImage(ERASER,
            0, 0, sdata.width, sdata.height,
            0, 0, sdata.width, sdata.height);





        sprite_table.set(name, {
            width:  ERASER.width,
            height: ERASER.height,
            dx:     0,
            dy:     0,
        });
    }

    $.get("resources/sprite_data.xml", function(xml) {
            var items    = xml.getElementsByTagName("items")[0];
            var entities = xml.getElementsByTagName("enemies")[0];
            var walls    = xml.getElementsByTagName("walls")[0];
            var traps    = xml.getElementsByTagName("traps")[0];

            console.log("pre-loading")
            _(items.children).each(load_item);
            console.log("items loaded")
            _(entities.children).each(load_entity);
            console.log("entities loaded")
            _(walls.children).each(load_wall);
            console.log("walls loaded")
            _(traps.children).each(load_trap);
            console.log("traps loaded")
            create_eraser_selector();
            console.log("eraser loaded")

            pubsub.emit("sprites_loaded_from_server");
    });
}

function draw_sprite(ctx, img, x, y, alpha) {
    if (img) {
        var sdata = sprite_table.get(img.id);
        draw_with(ctx, {alpha: alpha}, function(ctx){
            ctx.drawImage(img,
                          0, 0,
                          img.width, img.height,
                          x + sdata.dx, y + sdata.dy,
                          img.width, img.height);
        });
    }
}