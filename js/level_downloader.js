function download_grid(grid){
    var contents = grid.to_string();
    download_file("lname.xml", contents, "text/xml");
}

// adapted from http://html5-demos.appspot.com/static/a.download.html
function download_file(name, contents, mime_type) {
    mime_type = mime_type || "text/plain";

    var blob = new Blob([contents], {type: mime_type});

    var dlink = document.createElement('a');
    dlink.download = name;
    dlink.href = window.URL.createObjectURL(blob);
    $(dlink).on("click", function(e) {
        // revokeObjectURL needs a delay to work properly
        var that = this;
        setTimeout(function() {
            window.URL.revokeObjectURL(that.href);
        }, 1500);
    });

    dlink.click();
    dlink.remove();
}

