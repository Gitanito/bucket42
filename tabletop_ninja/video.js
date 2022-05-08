
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        videoId: localconfig.vid,
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
function youtube_parser(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return (match&&match[7].length==11)? match[7] : false;
}

function onPlayerReady(event) {
    resizeArea();
    event.target.playVideo();

}
function onPlayerStateChange(event) {
    var YTP=event.target;
    if(event.data===1){
        YTP.setPlaybackQuality("default");
        var remains=YTP.getDuration() - YTP.getCurrentTime();
        if(this.rewindTO)
            clearTimeout(this.rewindTO);
        this.rewindTO=setTimeout(function(){
            YTP.seekTo(0);
        },(remains-0.1)*1000);
    }
}

function openVideoChat() {
    $('#jitsimeet').show();
    jitsiapi = new JitsiMeetExternalAPI(globalconfig.tableconfig.jitsiserver,
        {
            roomName: globalconfig.tableconfig.jitsiroomprefix + '-' + localconfig.tableroom,
            width: 300,
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