if (!location.hash || location.hash == "#null") {
    let c = prompt("Enter your Code : ", "");
    if (c === "") window.location.reload();
    else location.hash = c;
    //location.hash = Math.floor(Math.random() * 0xFFFFFF).toString(16);
}


const roomHash = location.hash.substring(1);

// TODO: Replace with your own channel ID
const drone = new ScaleDrone('yiS12Ts5RdNhebyM');
// Room name needs to be prefixed with 'observable-'
const roomName = 'observable-' + roomHash;
const configuration = {
    iceServers: [{
        urls: 'stun:stun.l.google.com:19302'
    }]
};
let room;
let pc;


function onSuccess() {
};

function onError(error) {
    console.error(error);
};


drone.on('open', error => {
    if (error) {
        return console.error(error);
    }
    room = drone.subscribe(roomName);
    room.on('open', error => {
        if (error) {
            onError(error);
        }
    });
    // We're connected to the room and received an array of 'members'
    // connected to the room (including us). Signaling server is ready.
    room.on('members', members => {
        console.log('MEMBERS', members);
        // If we are the second user to connect to the room we will be creating the offer
        const isOfferer = true; //members.length >= 2;
        startWebRTC(isOfferer);
    });
});


// Send signaling data via Scaledrone
function sendMessage(message) {
    drone.publish({
        room: roomName,
        message
    });
}

function tryit(pc) {
    if (typeof pc !== undefined) {
        try {
            const streamx = pc.getRemoteStreams()[0];
            if (typeof streamx !== "undefined" && !remoteVideo.srcObject || remoteVideo.srcObject.id !== streamx.id) {
                remoteVideo.srcObject = streamx;
            }
            startDouble();
        } catch (e) {
        }
    }
}

function startWebRTC(isOfferer) {
    pc = new RTCPeerConnection(configuration);

    pc.addTransceiver('video', {direction: 'recvonly'});
    pc.addTransceiver('audio', {direction: 'recvonly'});

    // 'onicecandidate' notifies us whenever an ICE agent needs to deliver a
    // message to the other peer through the signaling server
    pc.onicecandidate = event => {
        if (event.candidate) {
            sendMessage({'candidate': event.candidate});
        }
    };

    pc.ontrack = event => {
        const streamx = event.streams[0];
        if (!remoteVideo.srcObject || remoteVideo.srcObject.id !== streamx.id) {
            remoteVideo.srcObject = streamx;
            //    remoteVideo.play();
            startDouble();
        }
    };

    // If user is offerer let the 'negotiationneeded' event create the offer

    pc.onnegotiationneeded = () => {
        pc.createOffer().then(localDescCreated).catch(onError);
    }

    //window.setInterval(function(){tryit(pc)}, 1000);

    /*
      pc.ontrack = event => {
        const streamx = event.streams[0];
        if (!remoteVideo.srcObject || remoteVideo.srcObject.id !== streamx.id) {
          remoteVideo.srcObject = streamx;
        }
      };

        navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        }).then(stream => {
          // Display your local video in #localVideo element
          //localVideo.srcObject = stream;
          // Add your stream to be sent to the conneting peer
          //let dummy = pc.addTrack(track, stream);
          stream.getTracks().forEach(track => pc.addTrack(track, stream));
        }, onError);
    */
    // Listen to signaling data from Scaledrone
    room.on('data', (message, client) => {
        // Message was sent by us
        if (client.id === drone.clientId) {
            return;
        }

        if (message.sdp) {
            console.log(message.sdp);
            // This is called after receiving an offer or answer from another peer
            pc.setRemoteDescription(new RTCSessionDescription(message.sdp), () => {
                // When receiving an offer lets answer it
                if (pc.remoteDescription.type === 'offer') {
                    pc.createAnswer().then(localDescCreated).catch(onError);
                }
            }, onError);
        } else if (message.candidate) {
            console.log(message.candidate);
            // Add the new ICE candidate to our connections remote description
            pc.addIceCandidate(
                new RTCIceCandidate(message.candidate), onSuccess, onError
            );
            tryit(pc);
        }

    });
}

let to = null;
let done = false;

function startDouble() {
    //if (!done) {
    clearTimeout(to);
    updateBigVideo();
    done = true;
    //}
}

function updateBigVideo() {
    var v = document.getElementById('remoteVideo');
    //if (v.paused || v.ended) return false;

    let canvasEl = document.getElementById('lefteye');
    let context = canvasEl.getContext('2d');

    canvasEl.width = v.videoWidth;
    canvasEl.height = v.videoHeight;


    context.drawImage(v, 0, 0, canvasEl.width, canvasEl.height);


    //context.drawImage(v, 0, 0, canvas.style.width, canvas.style.height);
    to = setTimeout(updateBigVideo, 16);
}

function localDescCreated(desc) {
    pc.setLocalDescription(
        desc,
        () => sendMessage({'sdp': pc.localDescription}),
        onError
    );
}

let viewstatus = -1;
let filters = "";

let dpi_x = 96;
let scalepercent = 1;
let eyealignl = "left:0;right:auto;";
let eyealignr = "right:0;left:auto;";


remoteVideo.addEventListener("click", function () {
    next();
});
lefteye.addEventListener("click", function () {
    next();
});

starter.addEventListener("click", function () {
    next();
});

go.addEventListener("click", function () {
    next();
});

function next() {

    if (remoteVideo.paused) {
        remoteVideo.play();
        try {
            document.body.requestFullscreen();
        } catch (e) {
        }
    }

    viewstatus++;
    if (viewstatus > 8) viewstatus = 0;

    switch (viewstatus) {
        case -1:
            lefteye.hidden = true;
            remoteVideo.hidden = true;
            overlay.hidden = true;
            break;
        case 0:

            var saturate = $("#saturate").val();
            var brightness = $("#brightness").val();
            var contrast = $("#contrast").val();
            var sepia = $("#sepia").val();
            var eye = $("#eye").val();

            if (localStorage.getItem("saturate") !== null) {
                saturate = localStorage.getItem("saturate");
                $("#saturate").val(saturate);
                $("#saturate-val").text((saturate * 100) + "%");
            }
            if (localStorage.getItem("brightness") !== null) {
                brightness = localStorage.getItem("brightness");
                $("#brightness").val(brightness);
                $("#brightness-val").text((brightness * 100) + "%");
            }
            if (localStorage.getItem("contrast") !== null) {
                contrast = localStorage.getItem("contrast");
                $("#contrast").val(contrast);
                $("#contrast-val").text((contrast * 100) + "%");
            }
            if (localStorage.getItem("sepia") !== null) {
                sepia = localStorage.getItem("sepia");
                $("#sepia").val(sepia);
                $("#sepia-val").text((sepia * 100) + "%");
            }
            if (localStorage.getItem("eye") !== null) {
                eye = localStorage.getItem("eye");
                $("#eye").val(eye);
                $("#eye-val").text((eye * 10) + "%");
            }

            window.scalepercent = eye / 10;

            if (window.scalepercent > 1) {
                window.scalepercent = 2 - window.scalepercent;
                window.eyealignl = "left:-" + ((screen.width / 4) * (1 - window.scalepercent)) + "px;right:auto;";
                window.eyealignr = "right:-" + ((screen.width / 4) * (1 - window.scalepercent)) + "px;left:auto;";
            } else {
                window.eyealignl = "right:" + ((screen.width / 2) - ((screen.width / 4) * (1 - window.scalepercent))) + "px;left:auto;";
                window.eyealignr = "left:" + ((screen.width / 2) - ((screen.width / 4) * (1 - window.scalepercent))) + "px;right:auto;";
            }

            window.filters = "saturate(" + saturate + ") brightness(" + brightness + ") contrast(" + contrast + ") sepia(" + sepia + ")";

            remoteVideo.style.cssText = "width:" + (screen.width / 2) + "px;-moz-transform: scale(" + window.scalepercent + ", " + window.scalepercent + "); \
-webkit-transform: scale(" + window.scalepercent + ", " + window.scalepercent + "); -o-transform: scale(" + window.scalepercent + ", " + window.scalepercent + "); \
transform: scale(" + window.scalepercent + ", " + window.scalepercent + ");" + window.eyealignl + " filter: none;-webkit-filter:" + window.filters;


            lefteye.hidden = true;
            remoteVideo.hidden = false;
            overlay.hidden = false;
            starter.hidden = true;

            break;
        case 1:
            lefteye.hidden = false;
            remoteVideo.hidden = false;
            overlay.hidden = true;
            starter.hidden = true;
            remoteVideo.style.cssText = "width:" + (screen.width / 2) + "px;-moz-transform: scale(" + window.scalepercent + ", " + window.scalepercent + "); \
-webkit-transform: scale(" + window.scalepercent + ", " + window.scalepercent + "); -o-transform: scale(" + window.scalepercent + ", " + window.scalepercent + "); \
transform: scale(" + window.scalepercent + ", " + window.scalepercent + ");" + window.eyealignl + " filter: none;-webkit-filter:" + window.filters;
            lefteye.style.cssText = "width:" + (screen.width / 2) + "px;-moz-transform: scale(" + window.scalepercent + ", " + window.scalepercent + "); \
-webkit-transform: scale(" + window.scalepercent + ", " + window.scalepercent + "); -o-transform: scale(" + window.scalepercent + ", " + window.scalepercent + "); \
transform: scale(" + window.scalepercent + ", " + window.scalepercent + ");" + window.eyealignr + " filter: none;-webkit-filter:" + window.filters;
            clearTimeout(to);
            startDouble();
            break;
        case 2:
            lefteye.hidden = true;
            remoteVideo.hidden = false;
            overlay.hidden = true;
            starter.hidden = true;
            clearTimeout(to);
            remoteVideo.style.cssText = "width:" + (screen.width) + "px;-moz-transform: scale(-1, 1); \
-webkit-transform: scale(-1, 1); -o-transform: scale(-1, 1); \
transform: scale(-1, 1);left:0;right:auto; filter: FlipH;-webkit-filter:" + window.filters;
            break;

        case 3:
            lefteye.hidden = true;
            remoteVideo.hidden = false;
            overlay.hidden = true;
            starter.hidden = true;
            clearTimeout(to);
            remoteVideo.style.cssText = "width:" + (screen.width) + "px;-moz-transform: scale(1, -1); \
-webkit-transform: scale(1, -1); -o-transform: scale(1, -1); \
transform: scale(1, -1);left:0;right:auto; filter: FlipV;-webkit-filter:" + window.filters;
            break;
        case 4:
            lefteye.hidden = true;
            remoteVideo.hidden = false;
            overlay.hidden = true;
            starter.hidden = true;
            clearTimeout(to);
            remoteVideo.style.cssText = "width:" + (screen.width) + "px;-moz-transform: scale(-1, -1); \
-webkit-transform: scale(-1, -1); -o-transform: scale(-1, -1); \
transform: scale(-1, -1);left:0;right:auto; filter: FlipV FlipH;-webkit-filter:" + window.filters;
            break;
        case 5:
            lefteye.hidden = true;
            remoteVideo.hidden = false;
            overlay.hidden = true;
            starter.hidden = true;
            clearTimeout(to);
            remoteVideo.style.cssText = "width:" + (screen.width) + "px;-moz-transform: scale(1, 1); \
-webkit-transform: scale(1, 1); -o-transform: scale(1, 1); \
transform: scale(1, 1);left:0;right:auto; filter: none;-webkit-filter:" + window.filters;
            break;
        case 6:
            lefteye.hidden = false;
            remoteVideo.hidden = false;
            overlay.hidden = true;
            starter.hidden = true;
            remoteVideo.style.cssText = "width:" + (screen.width / 2) + "px;-moz-transform: scale(-" + window.scalepercent + ", " + window.scalepercent + "); \
-webkit-transform: scale(-" + window.scalepercent + ", " + window.scalepercent + "); -o-transform: scale(-" + window.scalepercent + ", " + window.scalepercent + "); \
transform: scale(-" + window.scalepercent + ", " + window.scalepercent + ");" + window.eyealignl + " filter: FlipH;-webkit-filter:" + window.filters;
            lefteye.style.cssText = "width:" + (screen.width / 2) + "px;-moz-transform: scale(-" + window.scalepercent + ", " + window.scalepercent + "); \
-webkit-transform: scale(-" + window.scalepercent + ", " + window.scalepercent + "); -o-transform: scale(-" + window.scalepercent + ", " + window.scalepercent + "); \
transform: scale(-" + window.scalepercent + ", " + window.scalepercent + ");" + window.eyealignr + " filter: FlipH;-webkit-filter:" + window.filters;
            clearTimeout(to);
            startDouble();
            break;
        case 7:
            lefteye.hidden = false;
            remoteVideo.hidden = false;
            overlay.hidden = true;
            starter.hidden = true;
            remoteVideo.style.cssText = "width:" + (screen.width / 2) + "px;-moz-transform: scale(-" + window.scalepercent + ", -" + window.scalepercent + "); \
-webkit-transform: scale(-" + window.scalepercent + ", -" + window.scalepercent + "); -o-transform: scale(-" + window.scalepercent + ", -" + window.scalepercent + "); \
transform: scale(-" + window.scalepercent + ", -" + window.scalepercent + ");" + window.eyealignl + " filter: FlipV FlipH;-webkit-filter:" + window.filters;
            lefteye.style.cssText = "width:" + (screen.width / 2) + "px;-moz-transform: scale(-" + window.scalepercent + ", -" + window.scalepercent + "); \
-webkit-transform: scale(-" + window.scalepercent + ", -" + window.scalepercent + "); -o-transform: scale(-" + window.scalepercent + ", -" + window.scalepercent + "); \
transform: scale(-" + window.scalepercent + ", -" + window.scalepercent + ");" + window.eyealignr + " filter: FlipV FlipH;-webkit-filter:" + window.filters;
            clearTimeout(to);
            startDouble();
            break;
        case 8:
            lefteye.hidden = false;
            remoteVideo.hidden = false;
            overlay.hidden = true;
            starter.hidden = true;
            remoteVideo.style.cssText = "width:" + (screen.width / 2) + "px;-moz-transform: scale(" + window.scalepercent + ", -" + window.scalepercent + "); \
-webkit-transform: scale(" + window.scalepercent + ", -" + window.scalepercent + "); -o-transform: scale(" + window.scalepercent + ", -" + window.scalepercent + "); \
transform: scale(" + window.scalepercent + ", -" + window.scalepercent + ");" + window.eyealignl + " filter: FlipV;-webkit-filter:" + window.filters;
            lefteye.style.cssText = "width:" + (screen.width / 2) + "px;-moz-transform: scale(" + window.scalepercent + ", -" + window.scalepercent + "); \
-webkit-transform: scale(" + window.scalepercent + ", -" + window.scalepercent + "); -o-transform: scale(" + window.scalepercent + ", -" + window.scalepercent + "); \
transform: scale(" + window.scalepercent + ", -" + window.scalepercent + ");" + window.eyealignr + " filter: FlipV;-webkit-filter:" + window.filters;
            clearTimeout(to);
            startDouble();
            break;

    }
}

$("input").on('change', function () {
    var saturate = $("#saturate").val();
    var brightness = $("#brightness").val();
    var contrast = $("#contrast").val();
    var sepia = $("#sepia").val();
    var eye = $("#eye").val();

    window.scalepercent = eye / 10;

    if (window.scalepercent > 1) {
        window.scalepercent = 2 - window.scalepercent;
        window.eyealignl = "left:-" + ((screen.width / 4) * (1 - window.scalepercent)) + "px;right:auto;";
        window.eyealignr = "right:-" + ((screen.width / 4) * (1 - window.scalepercent)) + "px;left:auto;";
    } else {
        window.eyealignl = "right:" + ((screen.width / 2) - ((screen.width / 4) * (1 - window.scalepercent))) + "px;left:auto;";
        window.eyealignr = "left:" + ((screen.width / 2) - ((screen.width / 4) * (1 - window.scalepercent))) + "px;right:auto;";
    }

    window.filters = "saturate(" + saturate + ") brightness(" + brightness + ") contrast(" + contrast + ") sepia(" + sepia + ")";

    remoteVideo.style.cssText = "width:" + (screen.width / 2) + "px;-moz-transform: scale(" + window.scalepercent + ", " + window.scalepercent + "); \
-webkit-transform: scale(" + window.scalepercent + ", " + window.scalepercent + "); -o-transform: scale(" + window.scalepercent + ", " + window.scalepercent + "); \
transform: scale(" + window.scalepercent + ", " + window.scalepercent + ");" + window.eyealignl + " filter: none;-webkit-filter:" + window.filters;

    $("#saturate-val").text((saturate * 100) + "%");
    $("#brightness-val").text((brightness * 100) + "%");
    $("#contrast-val").text((contrast * 100) + "%");
    $("#sepia-val").text((sepia * 100) + "%");
    $("#eye-val").text((eye * 10) + "%");
    window.localStorage.setItem("saturate", saturate);
    window.localStorage.setItem("brightness", brightness);
    window.localStorage.setItem("contrast", contrast);
    window.localStorage.setItem("sepia", sepia);
    window.localStorage.setItem("eye", eye);
});
