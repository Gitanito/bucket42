
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        videoId: globalconfig.background,
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
    return (match&&match[7].length===11)? match[7] : false;
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
function setupBackground(myurl) {

    let yturl = youtube_parser(myurl);

    if (yturl) {
        $.get({
            url: "https://www.youtube.com/oembed?format=json&url=" + encodeURI("https://www.youtube.com/watch?v=" + globalconfig.background),
            success: function (data) {
                //console.log(data);
                globalconfig.video_aspect_ratio = data.height / data.width;
                //console.log(globalconfig.video_aspect_ratio);
            }
        });
        globalconfig.bg_is_video = true;
        globalconfig.background = yturl;
    } else {
        globalconfig.bg_is_video = false;
        globalconfig.background = myurl;

    }
}

function createBackground() {
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    tag.id = "ytifa";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}