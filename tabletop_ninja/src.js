
let player;
let vid = "";


localconfig.tableroom = generateUniqueId();

function closeInvitationModal() {
    $('#invitationmodal').modal('hide');
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
        if(keycode === '13'){
            globalconfig.elm.name[localconfig.myplayerid] = $('#elementname_edit input').val();
            send('all', 'elementnames', globalconfig.elm.name);
        }
    });

    $('#chatinput input').keypress(function(event){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode === '13'){
            chatMessage('all', $('#chatinput input').val());

        }
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


    // Load Plugins
    for (let p = 0; p < globalconfig.plugins.length; p++) {
        $("body").append('<link rel="stylesheet" href="' + globalconfig.gitcdnurl + globalconfig.plugins[p] + '/style.css">');
        $("body").append('<script src="' + globalconfig.gitcdnurl + globalconfig.plugins[p] + '/script.js"></script>');
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
    $('#headmenu').show();

}

function switchColor(s) {
    globalconfig.elm.color[activeelement] = colors[s];
    $('#player_'+activeelement+' img').css('border-color', globalconfig.elm.color[activeelement]);
    send('all', 'colors', globalconfig.elm.color);
}

function chatMessage(audience, message) {
    send(audience, 'message', {playerid: localconfig.myplayerid, message: message});
    let mybg = "background-color: " +globalconfig.elm.color[localconfig.myplayerid]+ ";";
    let col = "color: "+getContrastYIQ(globalconfig.elm.color[localconfig.myplayerid])+";";
    $('#chatline').append('<div class="alert alert-secondary newmessage" role="alert" style="display:none;width:100%;'+col+mybg+'"><b>me: </b>'+message+'</div>');
    $('#chatinput input').val("");
    $('.newmessage').show('slide', { direction: "right" }, 500);
    $('.newmessage').removeClass('newmessage');
}