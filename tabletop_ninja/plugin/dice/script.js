

localconfig.dicecount = {};
localconfig.diceadd = 0;

let dicereturns = {};

function closeDiceModal() {
    $('#dicemodal').modal('hide');
}
function closeRImodal() {
    $('#rimodal').modal('hide');
}
function openRImodal() {
    $('#rimodal').modal('show');
}
function closeCRImodal() {
    $('#crimodal').modal('hide');
}

function diceCalc() {
    let log = "";
    let count = 0;
    for (const [key, value] of Object.entries(localconfig.dicecount)) {
        if (count !== 0) log = log + '<b>+</b>';
        log = log + value + 'D' + key + ' [';
        for(let r = 0; r < value; r++) {
            if (r > 0) log = log + ',';
            let w = Math.floor(Math.random()*key) + 1;
            count += w
            log = log + "<b>"+w+"</b>";
        }
        log = log + '] ';
    }

    if (localconfig.diceadd !== 0) {
        log = log + " <b>+</b> [<b>"+(localconfig.diceadd > 0 ?'+':'') + localconfig.diceadd + '</b>] ';
        count = count + localconfig.diceadd;
    }
    return {count: count, log: log};
}

function diceThrow() {
    //debugger;

    let roll = diceCalc();
    $('#diceout').html("");

    $('#dicemodaltext').html(roll.log + "<h1>"+ roll.count + "</h1>");
    $('#dicemodal').modal('show');
    chatMessage('all',roll.log + "<h1>"+ roll.count + "</h1>");
    localconfig.dicecount = {};
    localconfig.diceadd = 0;
}

function rollRI() {
    localconfig.dicecount['20'] = 1;
    localconfig.diceadd = parseInt($('#rimodaltext').val());
    let roll = diceCalc();
    send('host', 'plugin', {method: 'returnRI('+roll.count+','+localconfig.myplayerid+')'});
    chatMessage('all',roll.log + "<h1>"+ roll.count + "</h1>");
    closeRImodal();
}

function inviteRI() {
    dicereturns = {};
    $('#crimodaltext').html('');
    $('#crimodal').modal('show');
    send('all', 'plugin', {method: 'openRImodal()'});
    console.log("jojo");
}

function returnRI(count,playerid) {
    dicereturns[globalconfig.elm.name[playerid]] = count;
    let keysSorted = Object.keys(dicereturns).sort(function(a,b){return dicereturns[a]-dicereturns[b]})
    let list = "";
    for (const [key, value] of Object.entries(keysSorted)) {
        list = '<b>' + value + ': </b>' + dicereturns[value] + '<br>' + list;
    }
    $('#crimodaltext').html(list);

}

$(document).ready(function() {

    $('#droplet_controls').append('<button type="button" class="btn btn-warning host only" onClick="inviteRI();">Claim Initative Roll</button>');
    $('#rightlane_droparea_bottom').append('<li id="droplet_dice">\n' +
        '                        <div id="diceout"></div>\n' +
        '                        <div id="diceline">\n' +
        '                            <div data-d="4" class="dice4">4</div>\n' +
        '                            <div data-d="6" class="dice6">6</div>\n' +
        '                            <div data-d="8" class="dice8">8</div>\n' +
        '                            <div data-d="10" class="dice10">10</div>\n' +
        '                            <div data-d="12" class="dice12">12</div>\n' +
        '                            <div data-d="20" class="dice20">20</div>\n' +
        '                            <div data-d="100" class="dice100">100</div>\n' +
        '                            <div data-d="plus" class="diceplus">+1</div>\n' +
        '                            <div data-d="minus" class="diceminus">-1</div>\n' +
        '                            <div data-d="go" class="dicego">GO</div>\n' +
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
        '</div>\n' +
        '<div class="modal" tabindex="-1" id="rimodal">\n' +
        '    <div class="modal-dialog">\n' +
        '        <div class="modal-content">\n' +
        '            <div class="modal-header">\n' +
        '                <h5 class="modal-title">Please Roll for Initiative</h5>\n' +
        '                <button type="button" class="btn-close" data-bs-dismiss="modal" onClick="closeRImodal();" aria-label="Close"></button>\n' +
        '            </div>\n' +
        '            <div class="modal-body">\n' +
        '                <h2>Please add your Initiative Modifier</h2><input id="rimodaltext" value="0">\n' +
        '            </div>\n' +
        '            <div class="modal-footer">\n' +
        '                <button type="button" class="btn btn-primary" onClick="rollRI();">Roll NOW</button>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '</div>\n' +
        '<div class="modal" tabindex="-1" id="crimodal">\n' +
        '    <div class="modal-dialog">\n' +
        '        <div class="modal-content">\n' +
        '            <div class="modal-header">\n' +
        '                <h5 class="modal-title">Claim for Initiative</h5>\n' +
        '                <button type="button" class="btn-close" data-bs-dismiss="modal" onClick="closeCRImodal();" aria-label="Close"></button>\n' +
        '            </div>\n' +
        '            <div class="modal-body">\n' +
        '                <h2>Your Players will roll.</h2><p id="crimodaltext"></p>\n' +
        '            </div>\n' +
        '            <div class="modal-footer">\n' +
        '                <button type="button" class="btn btn-primary" onClick="closeCRImodal();">Close</button>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '</div>\n');

    $('#diceline div').on('click', function(){
        let line = "";
        let ostr = "";
        let dd = $(this).data("d");
        if (dd === 'go') {
            if (Object.keys(localconfig.dicecount).length > 0) {
                diceThrow();
            }
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