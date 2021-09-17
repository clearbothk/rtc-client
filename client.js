var pc = null;

const socket = window.io("http://192.168.0.107:8000");

function negotiate() {
  pc.addTransceiver("video", { direction: "recvonly" });

  return pc
    .createOffer()
    .then(function (offer) {
      return pc.setLocalDescription(offer);
    })
    .then(function () {
      // wait for ICE gathering to complete
      return new Promise(function (resolve) {
        if (pc.iceGatheringState === "complete") {
          resolve();
        } else {
          function checkState() {
            if (pc.iceGatheringState === "complete") {
              pc.removeEventListener("icegatheringstatechange", checkState);
              resolve();
            }
          }
          pc.addEventListener("icegatheringstatechange", checkState);
        }
      });
    })
    .then(function () {
      var offer = pc.localDescription;
      const body = JSON.stringify({
        sdp: offer.sdp,
        type: offer.type,
      });

      socket.emit("join_stream", body, (data) => {
        console.log(data);
      });

      socket.on("answer", (data) => {
        console.log("Answer", data);
        return pc.setRemoteDescription(data);
      });
    })
    .catch(function (e) {
      alert(e);
    });
}

function start() {
  var config = {
    sdpSemantics: "unified-plan",
  };

  config.iceServers = [{ urls: ["stun:stun.l.google.com:19302"] }];

  pc = new RTCPeerConnection(config);

  // connect audio / video
  pc.addEventListener("track", function (evt) {
    if (evt.track.kind == "video") {
      document.getElementById("video").srcObject = evt.streams[0];
    } else {
      document.getElementById("audio").srcObject = evt.streams[0];
    }
  });

  document.getElementById("start").style.display = "none";
  negotiate();
  document.getElementById("stop").style.display = "inline-block";
}

function stop() {
  document.getElementById("stop").style.display = "none";

  // close peer connection
  setTimeout(function () {
    pc.close();
  }, 500);
}
