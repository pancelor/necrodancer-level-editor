function MouseButtons(evt) {
    var buttons = evt.buttons;
    this.button_count = 0;
    if (buttons >= 4) {
        this.middle = true;
        buttons -= 4;
        this.button_count += 1;
    }
    if (buttons >= 2) {
        this.right = true;
        buttons -= 2;
        this.button_count += 1;
    }
    if (buttons >= 1) {
        this.left = true;
        buttons -= 1;
        this.button_count += 1;
    }
    console.assert(buttons === 0);

    this.visual = "" + bool_to_int(this.left)
                     + bool_to_int(this.middle)
                     + bool_to_int(this.right);
}