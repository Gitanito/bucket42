document.addEventListener('keydown', evt => {
    // <shift> + * for everything.
    if (!evt.shiftKey) { return; }

    let p = document.getElementById('camera').components["orbit-controls"];//.getAttribute('orbit-controls');
    console.log(p);

    switch (evt.keyCode) {
        case 49:
            document.getElementById('camera').setAttribute('zoom', 1);
            p.state = p.STATE.ROTATE_TO;
            p.desiredPosition.copy({x:0, y:1, z:.5});
            break;
        case 50:
            document.getElementById('camera').setAttribute('zoom', 1);
            p.state = p.STATE.ROTATE_TO;
            p.desiredPosition.copy({x:0, y:1, z:0});
            break;
        default:
    }

});