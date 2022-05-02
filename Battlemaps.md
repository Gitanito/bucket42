# This are Battlemaps made by me
All videos are looped. Just start a video and put it in fullscreen-mode to play on a gaming-table-montor.


<style>.ytp-show-cards-title {display:none;visibility:none;}</style>
<div id="player"></div>
<script>
  var tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  var player;
  function onYouTubeIframeAPIReady() {
	player = new YT.Player('player', {
		videoId: 'HQc6iW6bMU8',
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
	function onPlayerReady(event) {
		event.target.playVideo();
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
</script>

