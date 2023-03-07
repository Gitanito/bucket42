
function setupHost() {
    dropRegion = document.getElementById("drop-region");


    // open file selector when clicked on the drop region
    var fakeInput = document.createElement("input");
    fakeInput.type = "file";
    fakeInput.accept = "image/*";
    fakeInput.multiple = true;
    dropRegion.addEventListener('click', function() {
        fakeInput.click();
    });

    fakeInput.addEventListener("change", function() {
        var files = fakeInput.files;
        handleFiles(files);
    });

    dropRegion.addEventListener('dragenter', preventDefault, false)
    dropRegion.addEventListener('dragleave', preventDefault, false)
    dropRegion.addEventListener('dragover', preventDefault, false)
    dropRegion.addEventListener('drop', preventDefault, false)
    dropRegion.addEventListener('drop', handleDrop, false);
}

async function receiveLoop(i) {
    if (localconfig.chatrooms.indexOf(i) < 0) {
        //console.log("listening started");
        while (true) {
            try {
                const res = await fetch(localconfig.chatserver + localconfig.tableroom + "-" + i + localconfig.inout[0]);
                let a = await res.text();
                let answer = JSON.parse(a);
                if (localconfig.myrole === "host") {
                    if (answer.audience === "all") {
                        for (let a = 0; a < globalconfig.elm.id.length; a++) {
                            if (globalconfig.elm.id[a] !== i) {
                                s(globalconfig.elm.id[a], answer);
                            }
                        }
                    } else if (answer.audience === "host") {
                    } else {
                        if (answer.audience !== i) {
                            s(answer.audience, answer);
                        }
                    }
                }

                switch (answer.type) {
                    case "message":
                        let mybg = "";
                        let nnn = '<b>host:</b> ';
                        let col = "color: " + getContrastYIQ(globalconfig.elm.color[answer.msg.playerid]) + ";";
                        if (answer.msg.playerid > -1) {
                            mybg = "background-color: " + globalconfig.elm.color[answer.msg.playerid] + ";";
                            nnn = '<b>' + globalconfig.elm.name[answer.msg.playerid] + ':</b> ';
                        }

                        $('#chatline').append('<div class="alert alert-secondary newmessage" role="alert" style="width:100%;' + col + mybg + '">' + nnn + answer.msg.message + '</div>');
                        let p = $('.newmessage');
                        p.show('slide', {direction: "right"}, 500);
                        p.removeClass('newmessage');
                        break;
                    case "init":
                        globalconfig = answer.msg;
                        console.log(globalconfig);
                        localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                        let intFrameWidth = window.innerWidth - parseInt($('#rightlane').css('width'));
                        localconfig.grid_x = Math.floor(intFrameWidth / globalconfig.tableconfig.boxcount_x);
                        localStorage.setItem(localstorage_prefix + '.localconfig', JSON.stringify(localconfig));
                        openSpace();
                        if (globalconfig.tableconfig.activatevideochat) {
                            openVideoChat();
                        }
                        break;
                    case "elements":
                        globalconfig.elm = answer.msg;
                        for (let a = 0; a < globalconfig.elm.id.length; a++) {
                            if ($('#player_' + a).length < 1) {
                                let img = makeImageSpace(a, globalconfig.elm.id[a], globalconfig.elm.pos[a].x, globalconfig.elm.pos[a].y, globalconfig.elm.size[a], globalconfig.elm.color[a], globalconfig.elm.visible[a]);
                                img.src = globalconfig.elm.imgsrc[a];
                            } else {
                                elementChangePosition(a);
                            }
                        }
                        localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                        break;
                    case "elementpositions":
                        globalconfig.elm.pos = answer.msg;
                        for (let a = 0; a < globalconfig.elm.pos.length; a++) {
                            elementChangePosition(a);
                        }
                        localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                        break;
                    case "elementsizes":
                        globalconfig.elm.size = answer.msg;
                        for (let a = 0; a < globalconfig.elm.size.length; a++) {
                            elementChangeSize(a);
                        }
                        localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                        break;
                    case "elementvalues":
                        globalconfig.elm.values = answer.msg;
                        localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                        break;
                    case "elementnames":
                        globalconfig.elm.name = answer.msg;
                        for (let a = 0; a < globalconfig.elm.name.length; a++) {
                            //$('#player_' + a + ' img').css('height', (globalconfig.elm.size[a] * Math.floor(localconfig.grid_x*localconfig.grid_y)) + 'px');
                        }
                        localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                        break;
                    case "elementimages":
                        globalconfig.elm.imgsrc = answer.msg;
                        for (let a = 0; a < globalconfig.elm.imgsrc.length; a++) {
                            $('#player_' + a + ' img').attr('src', globalconfig.elm.imgsrc[a]);
                        }
                        localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                        break;
                    case "elementvisibility":
                        globalconfig.elm.visible = answer.msg;
                        for (let a = 0; a < globalconfig.elm.visible.length; a++) {
                            if (globalconfig.elm.visible[a]) {
                                $('#player_' + a).show();
                            } else {
                                $('#player_' + a).hide();
                            }
                        }
                        localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                        break;
                    case "tableconfig":
                        globalconfig.tableconfig = answer.msg;
                        resizeArea();
                        localconfig.grid_x = Math.floor((window.innerWidth - parseInt($('#rightlane').css('width'))) / globalconfig.tableconfig.boxcount_x);
                        redrawElements();

                        break;
                    case "colors":
                        globalconfig.elm.color = answer.msg;
                        for (let a = 0; a < globalconfig.elm.color.length; a++) {
                            $('#player_' + a + ' img').css('border-color', globalconfig.elm.color[a]);
                        }
                        break;
                    case "changeplayground":
                        $('#newbackgroundurl').val(answer.msg);
                        changeBackground();
                        break;
                    case "videochat":
                        globalconfig.tableconfig.activatevideochat = answer.msg;
                        if (globalconfig.tableconfig.activatevideochat) {
                            openVideoChat();
                        } else {
                            if (jitsiapi != null) {
                                jitsiapi.executeCommand('hangup');
                            }
                            $('#jitsimeet').hide();
                        }
                        break;
                    case "plugin":
                        eval(answer.msg.method);
                        break;
                    case "joinme":
                        localconfig.initedPlayers.push(i);
                        send(i, 'init', globalconfig);
                        break;
                }
            } catch (err) {
                console.error(err);
            }
        }
    }
}
function newInvitation(i)
{
    console.log(localconfig.tableroom + "-" + i);
    receiveLoop(i);
    return i;
}
function cancelInvitation(i)
{
    // TODO: Make Cancelation
    /*
    localconfig.chatrooms.push(i);
    console.log(localconfig.tableroom + "-" + i);
    receiveLoop(i);
    return i;*/
}

function resizeArea() {
    let intFrameWidth =  window.innerWidth - parseInt($('#rightlane').css('width'));
    let intFrameHeight = intFrameWidth * globalconfig.tableconfig.video_aspect_ratio;
    let p1 = $('#player');
    p1.css('width', intFrameWidth + 'px');
    p1.css('height', intFrameHeight + 'px');
    let p2 = $('#blackbackground');
    p2.css('width', '100%');
    p2.css('height', '100%');
    let p3 = $('#overlay');
    p3.css('width', intFrameWidth + 'px');
    p3.css('height', intFrameHeight + 'px');
    let p4 = $('#drop-region');
    p4.css('width', intFrameWidth + 'px');
    p4.css('height', intFrameHeight + 'px');
    let p5 = $('#playercontainer');
    p5.css('width', intFrameWidth + 'px');
    p5.css('height', intFrameHeight + 'px');

}

function openSpace()
{
    if (globalconfig.bg_is_video) {
        createBackground();
    } else {
        var i = new Image();
        i.src = globalconfig.background;
        i.onload = function() {
            globalconfig.tableconfig.video_aspect_ratio = parseInt(this.width) / parseInt(this.height);
            $('#playercontainer').append('<img src="'+globalconfig.background+'" style="width:100%;">');
            resizeArea();
            console.log(globalconfig.tableconfig.video_aspect_ratio);
        }
    }
    redrawLines();
    for (let i = 0; i < globalconfig.elm.id.length; i++) {
        if (globalconfig.elm.id[i] === localconfig.hostid) { localconfig.myplayerid = i; }
        let pl = $('#player_' + i);
        if (pl.length < 1) {
            let img = makeImageSpace(i, globalconfig.elm.id[i], globalconfig.elm.pos[i].x, globalconfig.elm.pos[i].y, globalconfig.elm.size[i], globalconfig.elm.color[i], globalconfig.elm.visible[i]);
            img.src = globalconfig.elm.imgsrc[i];
            if (globalconfig.elm.isplayer[i]) {
                pl.css('z-index', '9000');
            }
        }
    }
    localStorage.setItem(localstorage_prefix + '.localconfig', JSON.stringify(localconfig));
}

function openTable() {
    if ($('#invid').val().trim() === "" && $('#vidurl').val().trim() === "") return;

    $('.only').hide();
    window.scrollTo(0,0);
    $('body').css('overflow', 'hidden');
    $('#rightlane').show();

    let intFrameWidth = window.innerWidth - parseInt($('#rightlane').css('width'));
    if ($('#invid').val().trim() !== "") {
        let x = $('#invid').val().trim().split('-');
        localconfig.grid_x = Math.floor(intFrameWidth / 15);
        localconfig.tableroom = x[0];
        localconfig.chatrooms.push(x[1]);
        localconfig.myrole = 'player';
        localconfig.hostid = x[1];
        localconfig.inout = ['out','in']; // change channels if you are a player
        receiveLoop(x[1]);
        send(x[1], 'joinme', {});
        localStorage.setItem(localstorage_prefix + '.localconfig', JSON.stringify(localconfig));
        setupHost();
        $('.player').show();
    } else if ($('#vidurl').val().trim() !== "") {
        if (!isValidHttpUrl($('#vidurl').val().trim())) return;
        globalconfig.tableconfig.boxcount_x = intFrameWidth / localconfig.grid_x;
        localconfig.myrole = 'host';
        setupHost();


        $('#newbackgroundurl').val($('#vidurl').val().trim());

        setupBackground($('#vidurl').val().trim());

        localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
        localStorage.setItem(localstorage_prefix + '.localconfig', JSON.stringify(localconfig));
        openSpace();
        $('.host').show();
    }


    $( "#rightlane_droparea_top, #rightlane_droparea_bottom" ).sortable({
        connectWith: ".connectedSortable"
    }).disableSelection();


    $('#headmenu').show();
    tablestarted = true;
}

function elementChangeSize(elmnr) {
    let p = $('#player_' + elmnr + ' img');
    p.css('height', (globalconfig.elm.size[elmnr] * Math.floor(localconfig.grid_x*localconfig.grid_y)) + 'px');
    p.css('width', (globalconfig.elm.size[elmnr] * localconfig.grid_x) + 'px');
}
function elementChangePosition(elmnr) {
    let p = $('#player_' + elmnr);
    p.css('top', (((localconfig.grid_x*localconfig.grid_y) * globalconfig.elm.pos[elmnr].y) + (globalconfig.tableconfig.gridpos_y * (localconfig.grid_x*localconfig.grid_y))) + 'px');
    p.css('left', ((localconfig.grid_x * globalconfig.elm.pos[elmnr].x) + (globalconfig.tableconfig.gridpos_x * localconfig.grid_x)) + 'px');
}

function makeItAPlayer() {
    if (activeelement > -1) {
        if (typeof globalconfig.elm.id[activeelement] != "undefined") {
            globalconfig.elm.isplayer[activeelement] = 1;
            newInvitation(globalconfig.elm.id[activeelement]);
            globalconfig.elm.size[activeelement] = 1;
            globalconfig.elm.visible[activeelement] = 1;
            globalconfig.elm.type[activeelement] = 'player';

            elementChangeSize(activeelement);
            let p = $('#player_' + activeelement );
            p.css('opacity', '1');
            p.css('z-index', '9000');
            $('#player_' + activeelement + ' img' ).css('border', '5px solid ' + globalconfig.elm.color[activeelement]);
            $('#player_' + activeelement + ' img' ).css('border-radius', '50%');

            send('all', 'elements', globalconfig.elm);
            localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
            $('.menuitemtype').removeClass('active');
            $('.menuitemtypeplayer').addClass('active');
        }
    }
}
function makeItANpc() {
    if (activeelement > -1) {
        if (typeof globalconfig.elm.id[activeelement] != "undefined") {
            globalconfig.elm.isplayer[activeelement] = 0;
            cancelInvitation(globalconfig.elm.id[activeelement]);
            globalconfig.elm.size[activeelement] = 1;
            globalconfig.elm.visible[activeelement] = 0;
            globalconfig.elm.type[activeelement] = 'npc';

            elementChangeSize(activeelement);
            let p = $('#player_' + activeelement );
            p.css('opacity', '.5');
            p.css('z-index', '1000');
            $('#player_' + activeelement + ' img' ).css('border', '5px solid ' + globalconfig.elm.color[activeelement]);
            $('#player_' + activeelement + ' img' ).css('border-radius', '50%');

            send('all', 'elements', globalconfig.elm);
            localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
            $('.menuitemtype').removeClass('active');
            $('.menuitemtypenpc').addClass('active');
        }
    }
}
function makeItAnItem() {
    if (activeelement > -1) {
        if (typeof globalconfig.elm.id[activeelement] != "undefined") {
            globalconfig.elm.isplayer[activeelement] = 0;
            cancelInvitation(globalconfig.elm.id[activeelement]);
            globalconfig.elm.size[activeelement] = 1;
            globalconfig.elm.visible[activeelement] = 0;
            globalconfig.elm.type[activeelement] = 'item';

            elementChangeSize(activeelement);
            let p = $('#player_' + activeelement );
            p.css('opacity', '.5');
            p.css('z-index', '1000');
            $('#player_' + activeelement + ' img' ).css('border', 'none');
            $('#player_' + activeelement + ' img' ).css('border-radius', '0%');

            send('all', 'elements', globalconfig.elm);
            localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
            $('.menuitemtype').removeClass('active');
            $('.menuitemtypeitem').addClass('active');
        }
    }
}
function makeSize(size) {
    if (activeelement > -1) {
        if (typeof globalconfig.elm.id[activeelement] != "undefined") {
            globalconfig.elm.size[activeelement] = size;
            elementChangeSize(activeelement);
            send('all', 'elementsizes', globalconfig.elm.size);
            localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
        }
    }
}

function toggleVisibility() {
    if (activeelement > -1) {
        if (typeof globalconfig.elm.id[activeelement] != "undefined") {
            if (globalconfig.elm.visible[activeelement] === 1) {
                globalconfig.elm.visible[activeelement] = 0;
                if (localconfig.myrole === "host") {
                    $('#player_' + activeelement ).css('opacity', '.5');
                } else {
                    $('#player_' + activeelement ).hide();
                }
            } else {
                globalconfig.elm.visible[activeelement] = 1;
                let p = $('#player_' + activeelement );
                p.css('opacity', '1');
                p.show();
            }
            send('all', 'elementvisibility', globalconfig.elm.visible);
            localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
        }
    }
}

function redrawElements() {
    redrawLines();
    for (let i = 0; i < globalconfig.elm.id.length; i++) {
        elementChangePosition(i);
        elementChangeSize(i);
        if (localconfig.myrole === 'host' || i === localconfig.myplayerid ) {
            $('#player_' + i).draggable({
                grid: [localconfig.grid_x, Math.floor(localconfig.grid_x * localconfig.grid_y)], stop: function () {
                    let i = $(this);
                    let ss = i.attr('id').split('_');
                    globalconfig.elm.pos[parseInt(ss[1])].x = Math.floor(i.position().left / localconfig.grid_x);
                    globalconfig.elm.pos[parseInt(ss[1])].y = Math.floor(i.position().top / Math.floor(localconfig.grid_x * localconfig.grid_y));
                    send('all', 'elementpositions', globalconfig.elm.pos);
                    localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                }
            });
        }
    }
}

function redrawLines() {
    $('.vline').remove();
    $('.hline').remove();
    for(let r = 0; r < 50; r++) {
        let p = $('#overlay');
        p.append('<div class="vline" style="border-color:'+(globalconfig.tableconfig.grid_black?'black':'white')+';display:'+(globalconfig.tableconfig.grid_visible?'block':'none')+';top: 0; left: ' + ((localconfig.grid_x * r) + (globalconfig.tableconfig.gridpos_x * localconfig.grid_x)) + 'px"></div>');
        p.append('<div class="hline" style="border-color:'+(globalconfig.tableconfig.grid_black?'black':'white')+';display:'+(globalconfig.tableconfig.grid_visible?'block':'none')+';top: ' + (((localconfig.grid_x*localconfig.grid_y) * r) + (globalconfig.tableconfig.gridpos_y * (localconfig.grid_x*localconfig.grid_y))) + 'px"></div>');
    }
}