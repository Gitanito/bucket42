
let player;
let vid = "";
let colors = [
    "#067BC2", // blue
    "#F37748", // orange
    "#9D8DF1", // lila
    "#ECC30B", // yellow
    "#1CFEBA", // green
    "#613F75", // purple
    "#84BCDA", // lightblue
    "#D56062", // red
    "#0B6E4F", // hunter
    "#FA9F42", // sun
    "#49111C", // darkred
    "#A9927D", // wood
    "#EF798A", // flesh
    "#482728" // brown
];

let fantasy_names = ["Nichye","Ealdrert","Pharder","Olhean","Agnorht","Thelmund","Wulfa","Grewill","Grichye","Arnulf","Wilfre",
    "Ealdwulf","Aerert","Wulfa","Andes","Anthol","Here","Duca","Rarder","Hany","Nichye","Wulfa","Aecthert","Bryany",
    "Hunfre","Ered","Thury","Walda","Aldwith"];

let loadlocalconfig = false;

let localconfig = {};
localconfig.grid_x = 96;
localconfig.grid_y = 1.0;
localconfig.inout = ['in','out'];
localconfig.chatsalt = "/ttninja";
localconfig.chatserver = "https://ppng.io"+localconfig.chatsalt;
localconfig.chatrooms = [];
localconfig.initedPlayers = [];
localconfig.tableroom = 0;
localconfig.myrole = 'none';
localconfig.hostid = '';
localconfig.activeelement = -1;
localconfig.myplayerid = -1;
localconfig.dicecount = 1;
localconfig.dicelast = 0;


let dropRegion = null;
let imagePreviewRegion = null;
let localstorage_prefix = "vttninja";

let globalconfig = {};
globalconfig.background = "";
globalconfig.boxcount_x = 0;
globalconfig.gridpos_x = 0.5;
globalconfig.gridpos_y = 0.4;
globalconfig.chatmessages = [];
globalconfig.elm = {};
globalconfig.elm.id = [];
globalconfig.elm.name = [];
globalconfig.elm.imgsrc = [];
globalconfig.elm.color = [];
globalconfig.elm.pos = [];
globalconfig.elm.isplayer = [];
globalconfig.elm.visible = [];
globalconfig.elm.size = [];

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        videoId: vid,
        playerVars: {
            modestbranding: 0,
            autoplay: 1,
            controls: 1,
            showinfo: 0,
            wmode: 'transparent',
            branding: 0,
            rel: 0,
            autohide: 0,
            origin: window.location.origin
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}
function youtube_parser(url){
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return (match&&match[7].length==11)? match[7] : false;
}

function onPlayerReady(event) {
    event.target.playVideo();
    $('#player').addClass('fullscreen');
    $('#overlay').addClass('fullscreen');
    $('#drop-region').addClass('fullscreen');
}
function onPlayerStateChange(event) {

    var YTP=event.target;
    if(event.data===1){
        var remains=YTP.getDuration() - YTP.getCurrentTime();
        if(this.rewindTO)
            clearTimeout(this.rewindTO);
        this.rewindTO=setTimeout(function(){
            YTP.seekTo(0);
        },(remains-0.1)*1000);
    }
    /*
            if (event.data === YT.PlayerState.ENDED) {
                player.playVideo();
            }*/
}

function preventDefault(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    var dt = e.dataTransfer,
        files = dt.files;

    if (files.length) {

        handleFiles(files);

    } else {

        // check for img
        var html = dt.getData('text/html'),
            match = html && /\bsrc="?([^"\s]+)"?\s*/.exec(html),
            url = match && match[1];



        if (url) {
            uploadImageFromURL(url);
            return;
        }

    }


    function uploadImageFromURL(url) {
        var img = new Image;
        var c = document.createElement("canvas");
        var ctx = c.getContext("2d");

        img.onload = function() {
            c.width = this.naturalWidth;     // update canvas size to match image
            c.height = this.naturalHeight;
            ctx.drawImage(this, 0, 0);       // draw in image
            c.toBlob(function(blob) {        // get content as PNG blob

                // call our main function
                handleFiles( [blob] );

            }, "image/png");
        };
        img.onerror = function() {
            alert("Error in uploading");
        }
        img.crossOrigin = "";              // if from different origin
        img.src = url;
    }

}


function handleFiles(files) {
    for (var i = 0, len = files.length; i < len; i++) {
        if (validateImage(files[i]))
            previewAnduploadImage(files[i]);
    }
}

function validateImage(image) {
    // check the type
    var validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (validTypes.indexOf( image.type ) === -1) {
        alert("Invalid File Type");
        return false;
    }

    // check the size
    var maxSizeInBytes = 10e6; // 10MB
    if (image.size > maxSizeInBytes) {
        alert("File too large");
        return false;
    }
    return true;
}

function previewAnduploadImage(image) {
    let pcount = $('.element-image img').length;
    let randcol = '#' + generateUniqueId();
    let img = makeImageSpace( pcount, '',1, 1, 1, randcol, 1);
    // read the image...
    var reader = new FileReader();
    reader.onload = function(e) {
        img.src = e.target.result;
        let playerid = generateUniqueId();

        globalconfig.elm.id.push(playerid);
        globalconfig.elm.name.push(fantasy_names[Math.floor(Math.random()*fantasy_names.length)]);
        globalconfig.elm.pos.push({x: 1, y: 1});
        globalconfig.elm.imgsrc.push(img.src);
        globalconfig.elm.color.push(randcol);
        globalconfig.elm.isplayer.push(0);
        globalconfig.elm.visible.push(1);
        globalconfig.elm.size.push(1);
        send('all', 'elements', globalconfig.elm);
        localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
    }
    reader.readAsDataURL(image);
}

function setupHost() {
    if (localconfig.myrole == "host") {
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
}

function makeImageSpace(id, myhostid, posx, posy, size, mycolor, visible)
{
    // container
    var imgView = document.createElement("div");
    imgView.id = 'player_'+id;
    imgView.className = "element-image";
    imgView.style = "position: absolute; top: "+(((localconfig.grid_x*localconfig.grid_y) * posy) + (globalconfig.gridpos_y * (localconfig.grid_x*localconfig.grid_y)))+"px; left: "+((localconfig.grid_x * posx) + (globalconfig.gridpos_x * localconfig.grid_x))+"px;" + (visible?"":(localconfig.myrole=='host'?"opacity:.2;":"display:none;"));
    imagePreviewRegion.appendChild(imgView);

    if (localconfig.myrole == 'host' || myhostid == localconfig.hostid ) {
        $(imgView).draggable({grid: [localconfig.grid_x, Math.floor(localconfig.grid_x*localconfig.grid_y)], stop: function(){
                let i = $(this);
                let ss = i.attr('id').split('_');
                globalconfig.elm.pos[parseInt(ss[1])].x = Math.floor(i.position().left / localconfig.grid_x);
                globalconfig.elm.pos[parseInt(ss[1])].y = Math.floor(i.position().top / Math.floor(localconfig.grid_x*localconfig.grid_y));
                send('all', 'elementpositions', globalconfig.elm.pos);
                localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
            }});
    }

    localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));

    // previewing image
    var img = document.createElement("img");
    img.style = "border: 5px solid " + mycolor + "; width: " + (size * localconfig.grid_x) + "px; height: " + (size * Math.floor(localconfig.grid_x*localconfig.grid_y)) + "px;";
    imgView.appendChild(img);
    return img;
}

function s(address, msg)
{
    //console.log(initedPlayers);
    //console.log(localconfig.chatserver + localconfig.tableroom  + '-' + address + localconfig.inout[1] + " " + JSON.stringify(msg));
    if (localconfig.myrole == "player" || $.inArray(address, localconfig.initedPlayers) !== -1) {
        $.post(localconfig.chatserver + localconfig.tableroom + '-' + address + localconfig.inout[1], JSON.stringify(msg), function (data) {
            //console.log(data);
        });
    }
}

function send(audience, msgtype, obj)
{
    //console.log(obj);
    if (localconfig.myrole == 'host') {
        if (audience == 'all') {
            for (let i = 0; i < globalconfig.elm.id.length; i++) {
                s(globalconfig.elm.id[i], {audience: audience, type: msgtype, msg: obj});
            }
        } else {
            s(audience, {audience: audience, type: msgtype, msg: obj});
        }
    } else {
        s(localconfig.hostid, {audience: audience, type: msgtype, msg: obj});
    }
}

localconfig.tableroom = generateUniqueId();

function generateUniqueId()
{
    return Math.floor(Math.random()*16777215).toString(16);
}

async function receiveLoop(i) {
    //console.log("listening started");
    while(true) {
        try {
            // Get peer's response
            const res = await fetch(localconfig.chatserver + localconfig.tableroom + "-" + i + localconfig.inout[0]);
            // Create talk element
            //const talk = document.createElement('div');
            // Set peer's message
            //talk.innerText = await res.text();
            // Add peer's message
            //talks.appendChild(talk);
            let a = await res.text();
            let answer = JSON.parse(a);
            //console.log(answer);

            if (localconfig.myrole == "host") {
                if (answer.audience == "all") {
                    for (let a = 0; a < globalconfig.elm.id.length; a++) {
                        //console.log(globalconfig.elm[a].id + "!=" + i);
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
                    localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                    let intFrameWidth = window.innerWidth;
                    localconfig.grid_x = Math.floor(intFrameWidth / globalconfig.boxcount_x);
                    openSpace();
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
                            $('#player_' + a).css('top', (((localconfig.grid_x*localconfig.grid_y) * globalconfig.elm.pos[a].y) + (globalconfig.gridpos_y * (localconfig.grid_x*localconfig.grid_y))) + 'px');
                            $('#player_' + a).css('left', ((localconfig.grid_x * globalconfig.elm.pos[a].x) + (globalconfig.gridpos_x * localconfig.grid_x)) + 'px');
                        }
                    }
                    localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                    break;
                case "elementpositions":
                    globalconfig.elm.pos = answer.msg;
                    for(let a = 0; a < globalconfig.elm.pos.length; a++) {
                        //$('#player_' + a).css('top', (globalconfig.elm.pos[a].y * Math.floor(localconfig.grid_x*localconfig.grid_y)) + 'px');
                        //$('#player_' + a).css('left', (globalconfig.elm.pos[a].x * localconfig.grid_x) + 'px');
                        $('#player_' + a).css('top', (((localconfig.grid_x*localconfig.grid_y) * globalconfig.elm.pos[a].y) + (globalconfig.gridpos_y * (localconfig.grid_x*localconfig.grid_y))) + 'px');
                        $('#player_' + a).css('left', ((localconfig.grid_x * globalconfig.elm.pos[a].x) + (globalconfig.gridpos_x * localconfig.grid_x)) + 'px');

                    }
                    localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
                    break;
                case "elementsizes":
                    globalconfig.elm.size = answer.msg;
                    for(let a = 0; a < globalconfig.elm.size.length; a++) {
                        $('#player_' + a + ' img').css('height', (globalconfig.elm.size[a] * Math.floor(localconfig.grid_x*localconfig.grid_y)) + 'px');
                        $('#player_' + a + ' img').css('width', (globalconfig.elm.size[a] * localconfig.grid_x) + 'px');
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

function openSpace()
{
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    $('.vline').remove();
    $('.hline').remove();
    for(let r = 0; r < 50; r++) {
        $('#overlay').append('<div class="vline" style="top: 0; left: ' + ((localconfig.grid_x * r) + (globalconfig.gridpos_x * localconfig.grid_x)) + 'px"></div>');
        $('#overlay').append('<div class="hline" style="top: ' + (((localconfig.grid_x*localconfig.grid_y) * r) + (globalconfig.gridpos_y * (localconfig.grid_x*localconfig.grid_y))) + 'px"></div>');
    }
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
    } else if ($('#vidurl').val().trim() != "") {
        globalconfig.boxcount_x = Math.floor(intFrameWidth / localconfig.grid_x);

        localconfig.myrole = 'host';
        setupHost();

        localconfig.vid = youtube_parser($('#vidurl').val());
        globalconfig.background = vid;
        localStorage.setItem(localstorage_prefix + '.globalconfig', JSON.stringify(globalconfig));
        localStorage.setItem(localstorage_prefix + '.localconfig', JSON.stringify(localconfig));
        openSpace();
    }
    $('#chat').show();
    $('#chatinput').show();
    $('#diceline').show();
}
function makePlayer() {
    if (activeelement > -1) {
        if (typeof globalconfig.elm.id[activeelement] != "undefined") {
            globalconfig.elm.isplayer[activeelement] = 1;
            newInvitation(globalconfig.elm.id[activeelement]);
            globalconfig.elm.size[activeelement] = 1;
            globalconfig.elm.visible[activeelement] = 1;

            $('#player_' + activeelement + ' img').css('height', (globalconfig.elm.size[activeelement] * Math.floor(localconfig.grid_x*localconfig.grid_y)) + 'px');
            $('#player_' + activeelement + ' img').css('width', (globalconfig.elm.size[activeelement] * localconfig.grid_x) + 'px');
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
            $('#player_' + activeelement + ' img').css('height', (globalconfig.elm.size[activeelement] * Math.floor(localconfig.grid_x*localconfig.grid_y)) + 'px');
            $('#player_' + activeelement + ' img').css('width', (globalconfig.elm.size[activeelement] * localconfig.grid_x) + 'px');
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



$(document).ready(function() {
    imagePreviewRegion = document.getElementById("body");
    const urlParams = new URLSearchParams(window.location.search);
    let tableid = urlParams.get('tid');
    if (tableid && tableid.trim() != "") {
        $('#invid').val(tableid.trim());
        openTable();
    }

    var $contextMenu = $("#contextMenu");

    $("body").on("contextmenu", ".element-image", function(e) {
        activeelement = parseInt($(this).attr('id').split('_')[1]);

        if (localconfig.myrole == "host") {
            if (globalconfig.elm.isplayer[activeelement] == 1) {
                $('#makeplayer').hide();
                let invite =  localconfig.tableroom + "-" + globalconfig.elm.id[activeelement];
                let url = window.location.href.replaceAll('#','') + "?tid=" + invite;
                //$('#copyurl').html("<a href='" + url + "' target=_blank>" + url + "</a>");
                $('#copyurl').html("<span id='newplayerurl'>" + url + "</span><span onClick='copyToClipboard(\"#newplayerurl\")' style='cursor:pointer;'><b> [COPY]</b></a>");
                $('#copyurl').show();
                $('#copyinvite').html("<span id='newplayerinv'>" + invite + "</span><span onClick='copyToClipboard(\"#newplayerinv\")' style='cursor:pointer;'><b> [COPY]</b></a>");
                $('#copyinvite').show();

                $('#basesize').hide();
                $('#togglevisibility').hide();
                $('#elementname_edit').show();
            } else {
                $('#makeplayer').show();
                $('#copyurl').html();
                $('#copyurl').hide();
                $('#copyinvite').html();
                $('#copyinvite').hide();
                $('#togglevisibility').show();

                $('#basesize').show();
                $('#elementname_edit').show();

            }
            $('#elementname_edit input').val(globalconfig.elm.name[activeelement]);

        } else {
            if (globalconfig.elm.isplayer[activeelement] == 1 && activeelement == localconfig.myplayerid) {
                $('#elementname_edit').show();
            } else {
                $('#elementname_edit').hide();
            }
            $('#makeplayer').hide();
            $('#copyurl').html();
            $('#copyurl').hide();
            $('#copyinvite').html();
            $('#copyinvite').hide();
            $('#basesize').hide();
            $('#togglevisibility').hide();

            $('#elementname_edit input').val(globalconfig.elm.name[activeelement]);

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
            send('all', 'message', {playerid: localconfig.myplayerid, message: $('#chatinput input').val()});
            let mybg = "background-color: " +globalconfig.elm.color[localconfig.myplayerid]+ ";";
            let col = "color: "+getContrastYIQ(globalconfig.elm.color[localconfig.myplayerid])+";";
            $('#chatline').append('<div class="alert alert-secondary" role="alert" style="width:100%;'+col+mybg+'"><b>me: </b>'+$('#chatinput input').val()+'</div>');

            $('#chatinput input').val("");
        }
    });
    $('#diceline span').on('click', function(){
        let line = "";
        let dd = $(this).html().trim();
        if (dd == localconfig.dicelast) {
            localconfig.dicecount++;
        } else {

        }
        $('#chatinput input').val(localconfig.dicecount + 'd' + dd);

        localconfig.dicelast = dd;
    });

    window.addEventListener('resize', function(event) {
        if (localconfig.myrole != "host") {
            let intFrameWidth = window.innerWidth;
            localconfig.grid_x = Math.floor(intFrameWidth / globalconfig.boxcount_x);
            $('.vline').remove();
            $('.hline').remove();
            for(let r = 0; r < 50; r++) {
                $('#overlay').append('<div class="vline" style="top: 0; left: ' + ((localconfig.grid_x * r) + (globalconfig.gridpos_x * localconfig.grid_x)) + 'px"></div>');
                $('#overlay').append('<div class="hline" style="top: ' + (((localconfig.grid_x*localconfig.grid_y) * r) + (globalconfig.gridpos_y * (localconfig.grid_x*localconfig.grid_y))) + 'px"></div>');
            }
            for (let i = 0; i < globalconfig.elm.id.length; i++) {
                $('#player_' + i).css('top', (((localconfig.grid_x*localconfig.grid_y) * globalconfig.elm.pos[i].y) + (globalconfig.gridpos_y * (localconfig.grid_x*localconfig.grid_y))) + 'px');
                $('#player_' + i).css('left', ((localconfig.grid_x * globalconfig.elm.pos[i].x) + (globalconfig.gridpos_x * localconfig.grid_x)) + 'px');
                $('#player_' + i + ' img').css('height', (globalconfig.elm.size[i] * Math.floor(localconfig.grid_x*localconfig.grid_y)) + 'px');
                $('#player_' + i + ' img').css('width', (globalconfig.elm.size[i] * localconfig.grid_x) + 'px');
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
    });

});

function copyToClipboard(element) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val($(element).text()).select();
    document.execCommand("copy");
    $temp.remove();
}
function getContrastYIQ(hexcolor) {
    if (typeof hexcolor !== 'undefined') {
        hexcolor = hexcolor.replace("#", "");
        var r = parseInt(hexcolor.substr(0, 2), 16);
        var g = parseInt(hexcolor.substr(2, 2), 16);
        var b = parseInt(hexcolor.substr(4, 2), 16);
        var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? 'black' : 'white';
    } else {
        return "black";
    }
}
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

}
