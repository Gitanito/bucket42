

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
    //console.log("listening started");
    while(true) {
        try {
            const res = await fetch(localconfig.chatserver + localconfig.tableroom + "-" + i + localconfig.inout[0]);
            let a = await res.text();
            let answer = JSON.parse(a);
            if (localconfig.myrole == "host") {
                if (answer.audience == "all") {
                    for (let a = 0; a < globalconfig.elm.id.length; a++) {
                        if (globalconfig.elm.id[a] != i) {
                            s(globalconfig.elm.id[a], answer);
                        }
                    }
                } else if (answer.audience == "host") {
                } else {
                    if (answer.audience != i) {
                        s(answer.audience, answer);
                    }
                }
            }

            switch (answer.type) {
                case "message":
                    let mybg = "";
                    let nnn = '<b>host:</b> ';
                    let col = "color: "+getContrastYIQ(globalconfig.elm.color[answer.msg.playerid])+";";
                    if (answer.msg.playerid > -1) {
                        mybg = "background-color: " +globalconfig.elm.color[answer.msg.playerid]+ ";";
                        nnn = '<b>'+globalconfig.elm.name[answer.msg.playerid]+':</b> ';
                    }

                    $('#chatline').append('<div class="alert alert-secondary" role="alert" style="width:100%;'+col+mybg+'">'+nnn+answer.msg.message+'</div>');
                    break;
                case "init":
                    globalconfig = answer.msg;
                    console.log(globalconfig);
                    localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                    let intFrameWidth = window.innerWidth;
                    localconfig.grid_x = Math.floor(intFrameWidth / globalconfig.tableconfig.boxcount_x);
                    localconfig.vid = globalconfig.background;
                    localStorage.setItem(localstorage_prefix + '.localconfig', JSON.stringify(localconfig));
                    openSpace();
                    if (globalconfig.tableconfig.activatevideochat) {
                        openVideoChat();
                    }
                    break;
                case "elements":
                    globalconfig.elm = answer.msg;
                    for(let a = 0; a < globalconfig.elm.id.length; a++) {
                        if ($('#player_' + a).length < 1) {
                            let img = makeImageSpace(a, globalconfig.elm.id[a], globalconfig.elm.pos[a].x, globalconfig.elm.pos[a].y, globalconfig.elm.size[a], globalconfig.elm.color[a], globalconfig.elm.visible[a]);
                            img.src = globalconfig.elm.imgsrc[a];
                        } else {
                            //$('#player_' + a).css('top', (globalconfig.elm.pos[a].y * Math.floor(localconfig.grid_x*localconfig.grid_y)) + 'px');
                            //$('#player_' + a).css('left', (globalconfig.elm.pos[a].x * localconfig.grid_x) + 'px');
                            elementChangePosition(a);
                            //$('#player_' + a).css('top', (((localconfig.grid_x*localconfig.grid_y) * globalconfig.elm.pos[a].y) + (globalconfig.tableconfig.gridpos_y * (localconfig.grid_x*localconfig.grid_y))) + 'px');
                            //$('#player_' + a).css('left', ((localconfig.grid_x * globalconfig.elm.pos[a].x) + (globalconfig.tableconfig.gridpos_x * localconfig.grid_x)) + 'px');
                        }
                    }
                    localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                    break;
                case "elementpositions":
                    globalconfig.elm.pos = answer.msg;
                    for(let a = 0; a < globalconfig.elm.pos.length; a++) {
                        //$('#player_' + a).css('top', (globalconfig.elm.pos[a].y * Math.floor(localconfig.grid_x*localconfig.grid_y)) + 'px');
                        //$('#player_' + a).css('left', (globalconfig.elm.pos[a].x * localconfig.grid_x) + 'px');
                        elementChangePosition(a);
                        //$('#player_' + a).css('top', (((localconfig.grid_x*localconfig.grid_y) * globalconfig.elm.pos[a].y) + (globalconfig.tableconfig.gridpos_y * (localconfig.grid_x*localconfig.grid_y))) + 'px');
                        //$('#player_' + a).css('left', ((localconfig.grid_x * globalconfig.elm.pos[a].x) + (globalconfig.tableconfig.gridpos_x * localconfig.grid_x)) + 'px');

                    }
                    localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                    break;
                case "elementsizes":
                    globalconfig.elm.size = answer.msg;
                    for(let a = 0; a < globalconfig.elm.size.length; a++) {
                        elementChangeSize(a);
                        //$('#player_' + a + ' img').css('height', (globalconfig.elm.size[a] * Math.floor(localconfig.grid_x*localconfig.grid_y)) + 'px');
                        //$('#player_' + a + ' img').css('width', (globalconfig.elm.size[a] * localconfig.grid_x) + 'px');
                    }
                    localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                    break;
                case "elementnames":
                    globalconfig.elm.name = answer.msg;
                    for(let a = 0; a < globalconfig.elm.name.length; a++) {
                        //$('#player_' + a + ' img').css('height', (globalconfig.elm.size[a] * Math.floor(localconfig.grid_x*localconfig.grid_y)) + 'px');
                    }
                    localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                    break;
                case "elementimages":
                    globalconfig.elm.imgsrc = answer.msg;
                    for(let a = 0; a < globalconfig.elm.imgsrc.length; a++) {
                        $('#player_' + a + ' img').attr('src', globalconfig.elm.imgsrc[a]);
                    }
                    localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                    break;
                case "elementvisibility":
                    globalconfig.elm.visible = answer.msg;
                    for(let a = 0; a < globalconfig.elm.visible.length; a++) {
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
                    break;
                case "colors":
                    globalconfig.elm.color = answer.msg;
                    for(let a = 0; a < globalconfig.elm.color.length; a++) {
                        $('#player_'+a+' img').css('border-color', globalconfig.elm.color[a]);
                    }
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
                case "joinme":
                    localconfig.initedPlayers.push(i);
                    send(i, 'init', globalconfig);
                    break;
            }
        } catch(err) {
            console.error(err);
        }
    }
}
function newInvitation(i)
{
    localconfig.chatrooms.push(i);
    console.log(localconfig.tableroom + "-" + i);
    receiveLoop(i);
    return i;
}

function resizeArea() {
    let intFrameWidth = window.innerWidth;
    let intFrameHeight = intFrameWidth * globalconfig.tableconfig.video_aspect_ratio;
    $('#player').css('width', intFrameWidth + 'px');
    $('#player').css('height', intFrameHeight + 'px');
    //$('#blackbackground').addClass('fullscreen');
    $('#blackbackground').css('width', '100%');
    $('#blackbackground').css('height', '100%');
    //$('#overlay').addClass('fullscreen');
    $('#overlay').css('width', intFrameWidth + 'px');
    $('#overlay').css('height', intFrameHeight + 'px');
    //$('#drop-region').addClass('fullscreen');
    $('#drop-region').css('width', intFrameWidth + 'px');
    $('#drop-region').css('height', intFrameHeight + 'px');
}

function openSpace()
{
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    redrawLines();
    for (let i = 0; i < globalconfig.elm.id.length; i++) {
        if (globalconfig.elm.id[i] === localconfig.hostid) { localconfig.myplayerid = i; }

        if ($('#player_' + i).length < 1) {
            let img = makeImageSpace(i, globalconfig.elm.id[i], globalconfig.elm.pos[i].x, globalconfig.elm.pos[i].y, globalconfig.elm.size[i], globalconfig.elm.color[i], globalconfig.elm.visible[i]);
            img.src = globalconfig.elm.imgsrc[i];
            if (globalconfig.elm.isplayer[i]) {
                $('#player_' + i).css('z-index', '9000');
            }
        }
    }
    localStorage.setItem(localstorage_prefix + '.localconfig', JSON.stringify(localconfig));
}

function openTable() {
    let intFrameWidth = window.innerWidth;
    if ($('#invid').val().trim() != "") {
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
    } else if ($('#vidurl').val().trim() != "") {
        globalconfig.tableconfig.boxcount_x = intFrameWidth / localconfig.grid_x;

        localconfig.myrole = 'host';
        setupHost();

        localconfig.vid = youtube_parser($('#vidurl').val());
        $.get({
            url: "https://www.youtube.com/oembed?format=json&url="+encodeURI("https://www.youtube.com/watch?v="+localconfig.vid),
            success: function (data) {
                console.log(data);
                globalconfig.video_aspect_ratio = data.height/data.width;
                console.log(globalconfig.video_aspect_ratio);
            }
        });


        globalconfig.background = localconfig.vid;
        localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
        localStorage.setItem(localstorage_prefix + '.localconfig', JSON.stringify(localconfig));
        openSpace();
    }
    $('#chat').show();
    $('#chatinput').show();
    $('#diceline').show();
    $('#diceout').show();
    $('#headmenu').show();
    tablestarted = true;
}

function elementChangeSize(elmnr) {
    $('#player_' + elmnr + ' img').css('height', (globalconfig.elm.size[elmnr] * Math.floor(localconfig.grid_x*localconfig.grid_y)) + 'px');
    $('#player_' + elmnr + ' img').css('width', (globalconfig.elm.size[elmnr] * localconfig.grid_x) + 'px');
}
function elementChangePosition(elmnr) {
    $('#player_' + elmnr).css('top', (((localconfig.grid_x*localconfig.grid_y) * globalconfig.elm.pos[elmnr].y) + (globalconfig.tableconfig.gridpos_y * (localconfig.grid_x*localconfig.grid_y))) + 'px');
    $('#player_' + elmnr).css('left', ((localconfig.grid_x * globalconfig.elm.pos[elmnr].x) + (globalconfig.tableconfig.gridpos_x * localconfig.grid_x)) + 'px');
}

function makePlayer() {
    if (activeelement > -1) {
        if (typeof globalconfig.elm.id[activeelement] != "undefined") {
            globalconfig.elm.isplayer[activeelement] = 1;
            newInvitation(globalconfig.elm.id[activeelement]);
            globalconfig.elm.size[activeelement] = 1;
            globalconfig.elm.visible[activeelement] = 1;

            elementChangeSize(activeelement);
            //$('#player_' + activeelement + ' img').css('height', (globalconfig.elm.size[activeelement] * Math.floor(localconfig.grid_x*localconfig.grid_y)) + 'px');
            //$('#player_' + activeelement + ' img').css('width', (globalconfig.elm.size[activeelement] * localconfig.grid_x) + 'px');
            $('#player_' + activeelement ).css('opacity', '1');
            $('#player_' + activeelement ).css('z-index', '9000');

            send('all', 'elements', globalconfig.elm);
            localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
        }
    }
}
function makeSize(size) {
    if (activeelement > -1) {
        if (typeof globalconfig.elm.id[activeelement] != "undefined") {
            globalconfig.elm.size[activeelement] = size;
            elementChangeSize(activeelement);
            //$('#player_' + activeelement + ' img').css('height', (globalconfig.elm.size[activeelement] * Math.floor(localconfig.grid_x*localconfig.grid_y)) + 'px');
            //$('#player_' + activeelement + ' img').css('width', (globalconfig.elm.size[activeelement] * localconfig.grid_x) + 'px');
            send('all', 'elementsizes', globalconfig.elm.size);
            localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
        }
    }
}

function toggleVisibility() {
    if (activeelement > -1) {
        if (typeof globalconfig.elm.id[activeelement] != "undefined") {
            if (globalconfig.elm.visible[activeelement] == 1) {
                globalconfig.elm.visible[activeelement] = 0;
                if (localconfig.myrole == "host") {
                    $('#player_' + activeelement ).css('opacity', '.2');
                } else {
                    $('#player_' + activeelement ).hide();
                }
            } else {
                globalconfig.elm.visible[activeelement] = 1;
                $('#player_' + activeelement ).css('opacity', '1');
                $('#player_' + activeelement ).show();
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
        //$('#player_' + i).css('top', (((localconfig.grid_x*localconfig.grid_y) * globalconfig.elm.pos[i].y) + (globalconfig.tableconfig.gridpos_y * (localconfig.grid_x*localconfig.grid_y))) + 'px');
        //$('#player_' + i).css('left', ((localconfig.grid_x * globalconfig.elm.pos[i].x) + (globalconfig.tableconfig.gridpos_x * localconfig.grid_x)) + 'px');
        elementChangeSize(i);
        //$('#player_' + i + ' img').css('height', (globalconfig.elm.size[i] * Math.floor(localconfig.grid_x*localconfig.grid_y)) + 'px');
        //$('#player_' + i + ' img').css('width', (globalconfig.elm.size[i] * localconfig.grid_x) + 'px');
        $('#player_' + i).draggable({grid: [localconfig.grid_x, Math.floor(localconfig.grid_x*localconfig.grid_y)], stop: function(){
                let i = $(this);
                let ss = i.attr('id').split('_');
                globalconfig.elm.pos[parseInt(ss[1])].x = Math.floor(i.position().left / localconfig.grid_x);
                globalconfig.elm.pos[parseInt(ss[1])].y = Math.floor(i.position().top / Math.floor(localconfig.grid_x*localconfig.grid_y));
                send('all', 'elementpositions', globalconfig.elm.pos);
                localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
            }});
    }
}

function redrawLines() {
    $('.vline').remove();
    $('.hline').remove();
    for(let r = 0; r < 50; r++) {
        $('#overlay').append('<div class="vline" style="top: 0; left: ' + ((localconfig.grid_x * r) + (globalconfig.tableconfig.gridpos_x * localconfig.grid_x)) + 'px"></div>');
        $('#overlay').append('<div class="hline" style="top: ' + (((localconfig.grid_x*localconfig.grid_y) * r) + (globalconfig.tableconfig.gridpos_y * (localconfig.grid_x*localconfig.grid_y))) + 'px"></div>');
    }
}