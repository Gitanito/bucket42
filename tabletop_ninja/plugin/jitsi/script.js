
globalconfig.tableconfig.jitsiserver = "meet.jit.si";
globalconfig.tableconfig.jitsiroomprefix = "vttninja";

function openVideoChat() {
    $('#jitsimeet').show();
    jitsiapi = new JitsiMeetExternalAPI(globalconfig.tableconfig.jitsiserver,
        {
            roomName: globalconfig.tableconfig.jitsiroomprefix + '-' + localconfig.tableroom,
            width: 400,
            height: 400,
            parentNode: document.querySelector('#jitsimeet'),
            setTileView: true
        }
    );
    if (localconfig.myrole === "host") {
        globalconfig.tableconfig.activatevideochat = true;
        send('all', 'videochat', true);
    }
}

function toggleVideoChat() {
    globalconfig.tableconfig.activatevideochat = !globalconfig.tableconfig.activatevideochat;
    if (globalconfig.tableconfig.activatevideochat) {
        openVideoChat();
    } else {
        if (jitsiapi != null) {
            jitsiapi.executeCommand('hangup');
            jitsiapi = null;
        }
        $('#jitsimeet').hide();
        $('#jitsimeet iframe').remove();
    }
}

$(document).ready(function(){
    $('body').append("<script src='https://meet.jit.si/external_api.js'></script>");
    $('#rightlane_droparea_top').append('\n' +
        '                    <li id="droplet_jitsi">\n' +
        '                        <button type="button" class="btn btn-warning" onClick="toggleVideoChat();">Meet</button>\n' +
        '                        <div id="jitsimeet"></div>\n' +
        '                    </li>\n');

})
