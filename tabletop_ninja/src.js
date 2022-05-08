
let player;
let vid = "";


localconfig.tableroom = generateUniqueId();

function closeInvitationModal() {
    $('#invitationmodal').modal('hide');
}
function closeDiceModal() {
    $('#dicemodal').modal('hide');
}


$(document).ready(function() {
    imagePreviewRegion = document.getElementById("body");
    const urlParams = new URLSearchParams(window.location.search);
    let tableid = urlParams.get('tid');
    if (tableid && tableid.trim() !== "") {
        $('#invid').val(tableid.trim());
        $('#invitationmodal').modal('show');
        //openTable();
    }

    $("#contextMenu a").on('click', function() {$('#contextMenu').hide();});

    var $contextMenu = $("#contextMenu");

    $("body").on("contextmenu", ".element-image", function(e) {
        activeelement = parseInt($(this).attr('id').split('_')[1]);
        let colorline = "";
        for (let s = 0; s < colors.length; s++) {
            colorline = colorline + ' <span class="colorswitch" onClick="switchColor('+s+')" style="background-color:' + colors[s] + '">&nbsp;&nbsp;&nbsp;&nbsp;</span>&nbsp;';
        }
        $('#colors').html(colorline);

        if (localconfig.myrole === "host") {
            if (globalconfig.elm.isplayer[activeelement] === 1) {
                $('#makeplayer').hide();
                let invite =  localconfig.tableroom + "-" + globalconfig.elm.id[activeelement];
                let url = window.location.href.replaceAll('#','') + "?tid=" + invite;
                //$('#copyurl').html("<a href='" + url + "' target=_blank>" + url + "</a>");
                $('#copyurl').html("<span id='newplayerurl'>" + url + "</span><b><a href='javascript:copyToClipboard(\"#newplayerurl\")'> [COPY] </a></b>");
                $('#copyurl').show();
                $('#copyinvite').html("<span id='newplayerinv'>" + invite + "</span><b><a href='javascript:copyToClipboard(\"#newplayerinv\")'> [COPY] </a></b>");
                $('#copyinvite').show();

                $('#basesize').hide();
                $('#togglevisibility').hide();
                $('#elementname_edit').show();
                $('#cropimage').show();
            } else {
                $('#makeplayer').show();
                $('#copyurl').html();
                $('#copyurl').hide();
                $('#copyinvite').html();
                $('#copyinvite').hide();
                $('#togglevisibility').show();

                $('#basesize').show();
                $('#elementname_edit').show();
                $('#cropimage').show();
            }
            $('#elementname_edit input').val(globalconfig.elm.name[activeelement]);
            $('#colors').show();

        } else {
            if (globalconfig.elm.isplayer[activeelement] === 1 && activeelement === localconfig.myplayerid) {
                $('#elementname_edit').show();
                $('#cropimage').show();

                $('#elementname_edit input').val(globalconfig.elm.name[activeelement]);

                $('#colors').show();
            } else {
                $('#elementname_edit').hide();
                $('#cropimage').hide();
                $('#colors').hide();
            }

            $('#makeplayer').hide();
            $('#copyurl').html();
            $('#copyurl').hide();
            $('#copyinvite').html();
            $('#copyinvite').hide();
            $('#basesize').hide();
            $('#togglevisibility').hide();


        }


        $contextMenu.css({
            display: "block",
            left: e.pageX,
            top: e.pageY
        });
        return false;
    });
/*
    $('body').on('click',function() {
        $contextMenu.hide();
    });
*/


    $('#elementname_edit input').keypress(function(event){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
            globalconfig.elm.name[localconfig.myplayerid] = $('#elementname_edit input').val();
            send('all', 'elementnames', globalconfig.elm.name);
        }
    });

    $('#chatinput input').keypress(function(event){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
            chatMessage($('#chatinput input').val());

        }
    });
    $('#diceline span').on('click', function(){
        let line = "";
        let ostr = "";
        let dd = $(this).data("d");
        if (dd === 'go') {
            throwdice();
        } else {
            if (dd === 'plus') {
                localconfig.diceadd++;
            } else if (dd === 'minus') {
                localconfig.diceadd--;
            } else {
                localconfig.dicecount[dd] = (localconfig.dicecount[dd] || 0) + 1;
            }
            for (const [key, value] of Object.entries(localconfig.dicecount)) {
                if (ostr != "") ostr = ostr + '+';
                ostr = ostr + `${value}D${key}`;
            }
            if (localconfig.diceadd !== 0) {
                line = '' + (localconfig.diceadd > 0?'+':'') + localconfig.diceadd;
            }

            $('#diceout').html(ostr + line);
        }
        //localconfig.dicelast = dd;
    });

    window.addEventListener('resize', function(event) {
        if (tablestarted) {
            localconfig.grid_x = Math.floor(window.innerWidth / globalconfig.tableconfig.boxcount_x);
            resizeArea();
            redrawElements();
            localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
        }
    });

    if (localconfig.myrole === "host") {
        $('#drop-region').bind('mousewheel', function (e) {
            if (e.originalEvent.wheelDelta / 120 > 0) {
                console.log('scrolling up !');
                localconfig.grid_x++;
            } else {
                console.log('scrolling down !');
                localconfig.grid_x--;
            }
            redrawElements();
            globalconfig.tableconfig.boxcount_x = window.innerWidth / localconfig.grid_x;
            localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
            send('all', 'tableconfig', globalconfig.tableconfig);
        });
        $(document).keydown(function (e) {
            switch (e.which) {
                case 37:    //left arrow key
                    globalconfig.tableconfig.gridpos_x -= .01;
                    break;
                case 38:    //up arrow key
                    globalconfig.tableconfig.gridpos_y -= .01;
                    break;
                case 39:    //right arrow key
                    globalconfig.tableconfig.gridpos_x += .01;
                    break;
                case 40:    //bottom arrow key
                    globalconfig.tableconfig.gridpos_y += .01;
                    break;
            }
            redrawElements();
            localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
            send('all', 'tableconfig', globalconfig.tableconfig);
        });
    }
});

function restoreLastSession() {
    globalconfig = JSON.parse(localStorage.getItem(localstorage_prefix + '.globalconfig'));
    localconfig = JSON.parse(localStorage.getItem(localstorage_prefix + '.localconfig'));
    for (let x = 0; x < globalconfig.elm.id.length; x++) {
        receiveLoop(globalconfig.elm.id[x]);
    }
    setupHost();
    openSpace();
    $('#chat').show();
    $('#chatinput').show();
    $('#diceline').show();
    $('#diceout').show();
    $('#headmenu').show();

}

function switchColor(s) {
    globalconfig.elm.color[activeelement] = colors[s];
    $('#player_'+activeelement+' img').css('border-color', globalconfig.elm.color[activeelement]);
    send('all', 'colors', globalconfig.elm.color);
}

function throwdice() {
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
    chatMessage(log + "<h1>"+ count + "</h1>");
    localconfig.dicecount = {}
    localconfig.diceadd = 0;
}
function chatMessage(message) {
    send('all', 'message', {playerid: localconfig.myplayerid, message: message});
    let mybg = "background-color: " +globalconfig.elm.color[localconfig.myplayerid]+ ";";
    let col = "color: "+getContrastYIQ(globalconfig.elm.color[localconfig.myplayerid])+";";
    $('#chatline').append('<div class="alert alert-secondary" role="alert" style="width:100%;'+col+mybg+'"><b>me: </b>'+message+'</div>');
    $('#chatinput input').val("");
}