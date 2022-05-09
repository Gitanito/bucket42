

localconfig.dicecount = {};
localconfig.diceadd = 0;

function closeDiceModal() {
    $('#dicemodal').modal('hide');
}

function diceThrow() {
    //debugger;
    let log = "";
    let count = 0;
    for (const [key, value] of Object.entries(localconfig.dicecount)) {
        log = log + value + 'D' + key + ' [';
        for(let r = 0; r < value; r++) {
            if (r > 0) log = log + ',';
            let w = Math.floor(Math.random()*key) + 1;
            count += w
            log = log + "<b>"+w+"</b>";
        }
        log = log + ']<br>';
    }

    if (localconfig.diceadd !== 0) {
        log = log + "<b>"+(localconfig.diceadd > 0 ?'+':'') + localconfig.diceadd + '</b><br>';
        count = count + localconfig.diceadd;
    }

    $('#diceout').html("");

    $('#dicemodaltext').html(log + "<h1>"+ count + "</h1>");
    $('#dicemodal').modal('show');
    chatMessage('all',log + "<h1>"+ count + "</h1>");
    localconfig.dicecount = {};
    localconfig.diceadd = 0;
}

$(document).ready(function() {

    $('#rightlane_droparea_bottom').append('<li id="droplet_dice">\n' +
        '                        <div id="diceout"></div>\n' +
        '                        <div id="diceline">\n' +
        '                            <span data-d="4"> 4 </span>|\n' +
        '                            <span data-d="6"> 6 </span>|\n' +
        '                            <span data-d="8"> 8 </span>|\n' +
        '                            <span data-d="10"> 10 </span>|\n' +
        '                            <span data-d="12"> 12 </span>|\n' +
        '                            <span data-d="20"> 20 </span>|\n' +
        '                            <span data-d="100"> 100 </span>|\n' +
        '                            <span data-d="plus"> +1 </span>|\n' +
        '                            <span data-d="minus"> -1 </span>|\n' +
        '                            <span data-d="go"> GO </span>\n' +
        '                        </div>\n' +
        '                    </li>');

    $('body').append('\n' +
        '<div class="modal" tabindex="-1" id="dicemodal">\n' +
        '    <div class="modal-dialog">\n' +
        '        <div class="modal-content">\n' +
        '            <div class="modal-header">\n' +
        '                <h5 class="modal-title">You rolled</h5>\n' +
        '                <button type="button" class="btn-close" data-bs-dismiss="modal" onClick="closeDiceModal();" aria-label="Close"></button>\n' +
        '            </div>\n' +
        '            <div class="modal-body">\n' +
        '                <p id="dicemodaltext"></p>\n' +
        '            </div>\n' +
        '            <div class="modal-footer">\n' +
        '                <button type="button" class="btn btn-primary" onClick="closeDiceModal();">Thanks</button>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '</div>\n');

    $('#diceline span').on('click', function(){
        let line = "";
        let ostr = "";
        let dd = $(this).data("d");
        if (dd === 'go') {
            diceThrow();
        } else {
            if (dd === 'plus') {
                localconfig.diceadd++;
            } else if (dd === 'minus') {
                localconfig.diceadd--;
            } else {
                localconfig.dicecount[dd] = (localconfig.dicecount[dd] || 0) + 1;
            }
            for (const [key, value] of Object.entries(localconfig.dicecount)) {
                if (ostr !== "") ostr = ostr + '+';
                ostr = ostr + `${value}D${key}`;
            }
            if (localconfig.diceadd !== 0) {
                line = '' + (localconfig.diceadd > 0?'+':'') + localconfig.diceadd;
            }

            $('#diceout').html(ostr + line);
        }
        //localconfig.dicelast = dd;
    });
});