
let player;
let vid = "";
let grid_x = 96;
let grid_y = 96;
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


function openTable() {
    vid = youtube_parser($('#vidurl').val());
    console.log(vid);
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

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

$(document).ready(function() {

var // where files are dropped + file selector is opened
    dropRegion = document.getElementById("drop-region"),
    // where images are previewed
    imagePreviewRegion = document.getElementById("body");


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


function preventDefault(e) {
    e.preventDefault();
    e.stopPropagation();
}

dropRegion.addEventListener('dragenter', preventDefault, false)
dropRegion.addEventListener('dragleave', preventDefault, false)
dropRegion.addEventListener('dragover', preventDefault, false)
dropRegion.addEventListener('drop', preventDefault, false)


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

dropRegion.addEventListener('drop', handleDrop, false);



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

    // container
    var imgView = document.createElement("div");
    imgView.className = "element-image";
    imgView.style = "position: absolute; top: "+grid_y+"px; left: "+grid_x+"px;";
    imagePreviewRegion.appendChild(imgView);
    $(imgView).draggable({ grid: [ grid_x, grid_y ] });

    // previewing image
    var img = document.createElement("img");
    img.style = "border: 5px solid " + colors[$('.element-image img').length] + ";";
    imgView.appendChild(img);
/*
    // progress overlay
    var overlay = document.createElement("div");
    overlay.className = "overlay";
    imgView.appendChild(overlay);
*/

    // read the image...
    var reader = new FileReader();
    reader.onload = function(e) {
        img.src = e.target.result;
    }
    reader.readAsDataURL(image);
    /*
        // create FormData
        var formData = new FormData();
        formData.append('image', ige);

        /*
        // upload the image
        var uploadLocation = 'https://api.imgbb.com/1/upload';
        formData.append('key', 'bb63bee9d9846c8d5b7947bcdb4b3573');

        var ajax = new XMLHttpRequest();
        ajax.open("POST", uploadLocation, true);

        ajax.onreadystatechange = function(e) {
            if (ajax.readyState === 4) {
                if (ajax.status === 200) {
                    // done!
                } else {
                    // error!
                }
            }
        }

        ajax.upload.onprogress = function(e) {

            // change progress
            // (reduce the width of overlay)

            var perc = (e.loaded / e.total * 100) || 100,
                width = 100 - perc;

            overlay.style.width = width;
        }

        ajax.send(formData);
    */
}

});