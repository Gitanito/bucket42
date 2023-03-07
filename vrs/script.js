// Generate random room name if needed
if (!location.hash) {
  location.hash = Math.floor(Math.random() * 0xFFFFFF).toString(16) + '' + Math.floor(Math.random() * 0xFFFFFF).toString(16);
}

const roomHash = location.hash.substring(1);

let room;
let pc;


// TODO: Replace with your own channel ID
let drone = null;
// Room name needs to be prefixed with 'observable-'
const roomName = 'observable-' + roomHash;
const configuration = {
  iceServers: [{
    urls: 'stun:stun.l.google.com:19302'
  }]
};


function onSuccess() {};
function onError(error) {
  console.error(error);
};

function startnow() {
  copy.hidden=false;

  var qrcode = new QRCode(document.getElementById("qrcode"), {
    width: 300,
    height: 300
  });
  qrcode.makeCode("https://bucket42.com/vrs/r.html#" + roomHash);
  document.getElementById("qrcodetext").innerText = "https://bucket42.com/vrs/r.html#" + roomHash;
  document.getElementById("qrcodecode").innerText = "" + roomHash;

  var qrcode2 = new QRCode(document.getElementById("qrcode2"), {
    width: 300,
    height: 300
  });
  qrcode2.makeCode("https://bucket42.com/vrs/aframe.html#" + roomHash);

  window.drone = new ScaleDrone('yiS12Ts5RdNhebyM');

  window.drone.on('open', error => {
    if (error) {
      return console.error(error);
    }
    room = window.drone.subscribe(roomName);
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
      const isOfferer = false; //members.length >= 2;
      startWebRTC(isOfferer);
    });
  });
}



// Send signaling data via Scaledrone
function sendMessage(message) {
  window.drone.publish({
    room: roomName,
    message
  });
}

function startWebRTC(isOfferer) {
  pc = new RTCPeerConnection(configuration);

  // 'onicecandidate' notifies us whenever an ICE agent needs to deliver a
  // message to the other peer through the signaling server
  pc.onicecandidate = event => {
    if (event.candidate) {
      sendMessage({'candidate': event.candidate});
    }
  };

  pc.ontrack = event => {
    /*
    const streamx = event.streams[0];
    if (!remoteVideo.srcObject || remoteVideo.srcObject.id !== streamx.id) {
      remoteVideo.srcObject = streamx;
    }
    */

  };

  let dim = getOption('format').split("x");
  let fr = getOption('framerate');
  let codec = getOption('codec');

  navigator.mediaDevices.getDisplayMedia({
    video: {
      frameRate: {ideal: parseInt(fr), max: parseInt(fr)},
      width: {ideal: parseInt(dim[0]), max: parseInt(dim[0])},
      height: {ideal: parseInt(dim[1]), max: parseInt(dim[1])}
    },
    cursor: 'motion',
    audio: true
  }).then(stream => {
    //localVideo.srcObject = stream;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    if (codec !== "none") {

      let tcvr = pc.getTransceivers()[0];
      let codecs = RTCRtpReceiver.getCapabilities('video').codecs;
      console.log(codecs);
      let vp9_codecs = [];
// iterate over supported codecs and pull out the codecs we want
      for (let i = 0; i < codecs.length; i++) {
        if (codecs[i].mimeType === "video/"+codec) {
          vp9_codecs.push(codecs[i]);
        }
      }
      console.log(vp9_codecs);

// currently not all browsers support setCodecPreferences
      if (typeof tcvr.setCodecPreferences !== "undefined") {
        tcvr.setCodecPreferences(vp9_codecs);
      }
    }
  }, onError);


  // Listen to signaling data from Scaledrone
  room.on('data', (message, client) => {
    // Message was sent by us
    if (client.id === window.drone.clientId) {
      return;
    }

    if (message.sdp) {
      // This is called after receiving an offer or answer from another peer
      pc.setRemoteDescription(new RTCSessionDescription(message.sdp), () => {
        // When receiving an offer lets answer it
        if (pc.remoteDescription.type === 'offer') {
          pc.createAnswer().then(localDescCreated).catch(onError);
        }
      }, onError);
    } else if (message.candidate) {
      // Add the new ICE candidate to our connections remote description
      pc.addIceCandidate(
        new RTCIceCandidate(message.candidate), onSuccess, onError
      );
    }
  });
}

function localDescCreated(desc) {
  pc.setLocalDescription(
    desc,
    () => sendMessage({'sdp': pc.localDescription}),
    onError
  );
}

function getOption(id) {
  selectElement = document.querySelector('#'+id);
  return selectElement.value;
}
