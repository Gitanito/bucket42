
let player;
let vid = "";
let shifted = false;

localconfig.tableroom = generateUniqueId();

function closeInvitationModal() {
    $('#invitationmodal').modal('hide');
}

function closeChangeBgModal() {
    $('#changebgmodal').modal('hide');
}

function changeBG() {
    $('#changebgmodal').modal('show');
}
function changeBackground() {
    //$('#ytifa').remove();
    $('#playercontainer').empty();
    $('#playercontainer').append('<div id="player"></div>');
    setupBackground($('#newbackgroundurl').val().trim());
    if (globalconfig.bg_is_video) {
        createBackground();
        onYouTubeIframeAPIReady();
    } else {
        $('#playercontainer').append('<img src="'+globalconfig.background+'" style="width:100%;">');
    }
    if (localconfig.myrole === "host") {
        send('all', 'changeplayground', (globalconfig.bg_is_video?'https://www.youtube.com/watch?v=':'') + globalconfig.background);
    }
}

function restoreLastSession() {
    globalconfig = JSON.parse(localStorage.getItem(localstorage_prefix + '.globalconfig'));
    localconfig = JSON.parse(localStorage.getItem(localstorage_prefix + '.localconfig'));
    if (localconfig.myrole === "host") {
        $('#vidurl').val("https://www.youtube.com/watch?v="+globalconfig.background);
    } else {
        $('#invid').val(localconfig.tableroom + '-' + localconfig.hostid);
    }
    openTable();
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
    let p = $('.newmessage');
    p.show('slide', { direction: "right" }, 500);
    p.removeClass('newmessage');
}

function toggleGrid() {
    if (localconfig.myrole === "host") {
        globalconfig.tableconfig.grid_visible = !globalconfig.tableconfig.grid_visible;
        if (globalconfig.tableconfig.grid_visible) {
            $('.vline').show();
            $('.hline').show();
        } else {
            $('.vline').hide();
            $('.hline').hide();
        }
        send('all', 'tableconfig', globalconfig.tableconfig);
    }
}

function toggleGridBW() {
    if (localconfig.myrole === "host") {
        globalconfig.tableconfig.grid_black = !globalconfig.tableconfig.grid_black;
        if (globalconfig.tableconfig.grid_black) {
            $('.vline').css('border-color', 'black');
            $('.hline').css('border-color', 'black');
        } else {
            $('.vline').css('border-color', 'white');
            $('.hline').css('border-color', 'white');
        }
        send('all', 'tableconfig', globalconfig.tableconfig);
    }
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

    $('#elementval_str_edit').on('mouseup keyup', function() { globalconfig.elm.values[activeelement].str = $(this).val(); send('all', 'elementvalues', globalconfig.elm.values);});
    $('#elementval_dex_edit').on('mouseup keyup', function() { globalconfig.elm.values[activeelement].dex = $(this).val(); send('all', 'elementvalues', globalconfig.elm.values);});
    $('#elementval_con_edit').on('mouseup keyup', function() { globalconfig.elm.values[activeelement].con = $(this).val(); send('all', 'elementvalues', globalconfig.elm.values);});
    $('#elementval_int_edit').on('mouseup keyup', function() { globalconfig.elm.values[activeelement].int = $(this).val(); send('all', 'elementvalues', globalconfig.elm.values);});
    $('#elementval_wis_edit').on('mouseup keyup', function() { globalconfig.elm.values[activeelement].wis = $(this).val(); send('all', 'elementvalues', globalconfig.elm.values);});
    $('#elementval_cha_edit').on('mouseup keyup', function() { globalconfig.elm.values[activeelement].cha = $(this).val(); send('all', 'elementvalues', globalconfig.elm.values);});
    $('#elementval_div_edit').on('mouseup keyup', function() { globalconfig.elm.values[activeelement].div = $(this).val(); send('all', 'elementvalues', globalconfig.elm.values);});
    $('#elementval_san_edit').on('mouseup keyup', function() { globalconfig.elm.values[activeelement].san = $(this).val(); send('all', 'elementvalues', globalconfig.elm.values);});


    $("#contextMenu a").on('click', function() {$('#contextMenu').hide();});

    var $contextMenu = $("#contextMenu");

    $("body").on("contextmenu", ".element-image", function(e) {
        $('.menuelement').hide();

        activeelement = parseInt($(this).attr('id').split('_')[1]);
        let colorline = "";
        for (let s = 0; s < colors.length; s++) {
            let r = (!s?"X":"");
            colorline = colorline + ' <span class="colorswitch" onClick="switchColor('+s+')" style="background-color:' + colors[s] + '">&nbsp;&nbsp;' + r + '&nbsp;&nbsp;</span>&nbsp;';
        }
        $('#colors').html(colorline);

        let invite =  localconfig.tableroom + "-" + globalconfig.elm.id[activeelement];
        $('#copyinvite').html("<span id='newplayerinv'>" + invite + "</span><b><a href='javascript:copyToClipboard(\"#newplayerinv\")'> [COPY] </a></b>");
        let url = window.location.href.replaceAll('#','') + "?tid=" + invite;
        $('#copyurl').html("<span id='newplayerurl'>" + url + "</span><b><a href='javascript:copyToClipboard(\"#newplayerurl\")'> [COPY] </a></b>");


        $('#elementval_str_edit').val(globalconfig.elm.values[activeelement].str);
        $('#elementval_dex_edit').val(globalconfig.elm.values[activeelement].dex);
        $('#elementval_con_edit').val(globalconfig.elm.values[activeelement].con);
        $('#elementval_int_edit').val(globalconfig.elm.values[activeelement].int);
        $('#elementval_wis_edit').val(globalconfig.elm.values[activeelement].wis);
        $('#elementval_cha_edit').val(globalconfig.elm.values[activeelement].cha);
        $('#elementval_div_edit').val(globalconfig.elm.values[activeelement].div);
        $('#elementval_san_edit').val(globalconfig.elm.values[activeelement].san);

        $('#elementval_str_show').html(globalconfig.elm.values[activeelement].str);
        $('#elementval_dex_show').html(globalconfig.elm.values[activeelement].dex);
        $('#elementval_con_show').html(globalconfig.elm.values[activeelement].con);
        $('#elementval_int_show').html(globalconfig.elm.values[activeelement].int);
        $('#elementval_wis_show').html(globalconfig.elm.values[activeelement].wis);
        $('#elementval_cha_show').html(globalconfig.elm.values[activeelement].cha);
        $('#elementval_div_show').html(globalconfig.elm.values[activeelement].div);
        $('#elementval_san_show').html(globalconfig.elm.values[activeelement].san);

        $('#elementname_edit input').val(globalconfig.elm.name[activeelement]);
        $('#elementname_show').html(globalconfig.elm.name[activeelement]);
        $('#togglevisibility').prop('checked', globalconfig.elm.visible[activeelement] === 1);

        $('.menuitemtype').removeClass('active');

        switch ( globalconfig.elm.type[activeelement]) {
            case 'item':
                $('#makeItAnItem').addClass('active');
                break;
            case 'player':
                $('#makeItAPlayer').addClass('active');
                break;
            case 'npc':
                $('#makeItANpc').addClass('active');
                break;
        }

        if (localconfig.myrole === "host") {
            $('.menuhost').show();
            if (globalconfig.elm.isplayer[activeelement] === 1) {
                $('.menuifplayer').show();
            }
        } else {
            if (globalconfig.elm.isplayer[activeelement] === 1) {
                $('.menuplayer').show();
            } else {
                $('.menunpc').show();
            }
            $('.menuitem').show();
        }
        /*

        if (localconfig.myrole === "host") {
            if (globalconfig.elm.isplayer[activeelement] === 1) {
                $('#makeplayer').hide();
                //$('#copyurl').html("<a href='" + url + "' target=_blank>" + url + "</a>");
                $('#copyurl').show();
                $('#copyinvite').show();

                $('#basesize').hide();
                $('#togglevisibility').hide();
                $('#elementname_show').hide();
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
                $('#elementname_show').hide();
                $('#elementname_edit').show();
                $('#cropimage').show();
            }

            $('#values_input').show();
            $('#values_output').hide();
            $('#colors').show();

        } else {
            if (globalconfig.elm.isplayer[activeelement] === 1 && activeelement === localconfig.myplayerid) {
                $('#elementname_edit').show();
                $('#cropimage').show();

                $('#elementname_show').hide();
                $('#elementname_edit input').val(globalconfig.elm.name[activeelement]);

                $('#colors').show();
                $('#elementval_str_edit').val(globalconfig.elm.values[activeelement].str);
                $('#elementval_dex_edit').val(globalconfig.elm.values[activeelement].dex);
                $('#elementval_con_edit').val(globalconfig.elm.values[activeelement].con);
                $('#elementval_int_edit').val(globalconfig.elm.values[activeelement].int);
                $('#elementval_wis_edit').val(globalconfig.elm.values[activeelement].wis);
                $('#elementval_cha_edit').val(globalconfig.elm.values[activeelement].cha);
                $('#elementval_div_edit').val(globalconfig.elm.values[activeelement].div);
                $('#elementval_san_edit').val(globalconfig.elm.values[activeelement].san);

                $('#values_input').show();
                $('#values_output').hide();
            } else {
                $('#elementname_show').show();
                $('#elementname_edit').hide();
                $('#cropimage').hide();
                $('#colors').hide();
                $('#values_input').hide();
                $('#values_output').html(
                    "Str: " + globalconfig.elm.values[activeelement].str + ', '
                    + "Dex: " + globalconfig.elm.values[activeelement].dex + ', '
                    + "Con: " + globalconfig.elm.values[activeelement].con + ', '
                    + "Int: " + globalconfig.elm.values[activeelement].int + ', '
                    + "Wis: " + globalconfig.elm.values[activeelement].wis + ', '
                    + "Cha: " + globalconfig.elm.values[activeelement].cha + ', '
                    + "Div: " + globalconfig.elm.values[activeelement].div + ', '
                    + "San: " + globalconfig.elm.values[activeelement].san + ', '
                );
                $('#values_output').show();
            }

            $('#makeplayer').hide();
            $('#copyurl').html();
            $('#copyurl').hide();
            $('#copyinvite').html();
            $('#copyinvite').hide();
            $('#basesize').hide();
            $('#togglevisibility').hide();
        }

*/
        $contextMenu.css({
            display: "block",
            left: e.pageX - 15,
            top: e.pageY - 15
        });
        return false;
    });

    $('#contextMenu').mouseleave(function(){$('#contextMenu').hide();});

    $('#elementname_edit input').keypress(function(event){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode === 13){
            globalconfig.elm.name[localconfig.myplayerid] = $('#elementname_edit input').val();
            send('all', 'elementnames', globalconfig.elm.name);
        }
    });

    $('#chatinput input').keypress(function(event){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode === 13){
            chatMessage('all', $('#chatinput input').val());
        }
    });

    window.addEventListener('resize', function(event) {
        if (tablestarted) {
            localconfig.grid_x = Math.floor((window.innerWidth - parseInt($('#rightlane').css('width'))) / globalconfig.tableconfig.boxcount_x);
            resizeArea();
            redrawElements();
            localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
        }
    });

    $('#drop-region').bind('mousewheel', function (e) {
        if (localconfig.myrole === "host") {
            if (e.originalEvent.wheelDelta / 120 > 0) {
                console.log('scrolling up !');
                localconfig.grid_x++;
            } else {
                console.log('scrolling down !');
                localconfig.grid_x--;
            }
            redrawElements();
            globalconfig.tableconfig.boxcount_x = (window.innerWidth - parseInt($('#rightlane').css('width'))) / localconfig.grid_x;
            localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
            send('all', 'tableconfig', globalconfig.tableconfig);
        }
    });

    $(document).keydown(function (e) {
        if (localconfig.myrole === "host") {
            switch (e.which) {
                case 37:    //left arrow key
                    globalconfig.tableconfig.gridpos_x -= .01;
                    redrawElements();
                    localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                    send('all', 'tableconfig', globalconfig.tableconfig);
                    break;
                case 38:    //up arrow key
                    globalconfig.tableconfig.gridpos_y -= .01;
                    redrawElements();
                    localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                    send('all', 'tableconfig', globalconfig.tableconfig);
                    break;
                case 39:    //right arrow key
                    globalconfig.tableconfig.gridpos_x += .01;
                    redrawElements();
                    localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                    send('all', 'tableconfig', globalconfig.tableconfig);
                    break;
                case 40:    //bottom arrow key
                    globalconfig.tableconfig.gridpos_y += .01;
                    redrawElements();
                    localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                    send('all', 'tableconfig', globalconfig.tableconfig);
                    break;
            }
        }
    });

    //$(document).on('keyup keydown', function(e){shifted = e.shiftKey; console.log(shifted)} );

    // Load Plugins
    for (let p = 0; p < globalconfig.plugins.length; p++) {
        let w = $("body");
        w.append('<link rel="stylesheet" href="' + globalconfig.gitcdnurl + globalconfig.plugins[p] + '/style.css">');
        w.append('<script src="' + globalconfig.gitcdnurl + globalconfig.plugins[p] + '/script.js"></script>');
    }

    /*
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })
     */
});
