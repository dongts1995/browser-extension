let localStream = null;
let pc = null;

const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const video = document.getElementById("preview");
const BASE_API = "https://api.portals.now";
let whipResource = null;

async function fetchWhip(eventId) {
    const res = await fetch(`${BASE_API}/screen-share/${eventId}/whip-url`);

    const text = await res.text();
    console.log("RAW API RESPONSE:", text);

    let data = {};
    try {
        data = JSON.parse(text);
    } catch (e) {
        console.error("JSON parse error");
    }

    // ✅ KHÔNG dùng lại biến url
    const whipUrl =
        data.url ||
        data.whip ||
        data.endpoint ||
        data.whipUrl;

    const token =
        data.token ||
        data.accessToken ||
        data.bearer ||
        "";

    console.log("Parsed WHIP URL:", whipUrl);

    return { url: whipUrl, token };
}

// 🎥 START
startBtn.onclick = async () => {
    try {
        // 1. Lấy screen
        localStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false
        });

        video.srcObject = localStream;

        localStream.getTracks()[0].onended = () => {
            console.log("Screen share ended by user");
            stopSharing();
        };

        // 2. Tạo PeerConnection
        await createPeerConnection();

        // 3. Add track
        localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
        });

        console.log("Tracks added to PeerConnection");

        // 🆕 4. TẠO OFFER
        const offer = await pc.createOffer({
            offerToReceiveAudio: false,
            offerToReceiveVideo: false
        });

        await pc.setLocalDescription(offer);

        console.log("SDP OFFER:");
        console.log(offer.sdp);

        // 🆕 5. CALL WHIP
        const eventId = 33; // ⚠️ thay bằng thật nếu cần

        const { url, token } = await fetchWhip(eventId);

        console.log("WHIP URL:", url);

        // const res = await fetch(url, {
        //     method: "POST",
        //     headers: {
        //         "Content-Type": "application/sdp",
        //         ...(token ? { Authorization: `Bearer ${token}` } : {})
        //     },
        //     body: offer.sdp
        // });

        const res = await fetch(
            `http://localhost:3000/whip-proxy?url=${encodeURIComponent(url)}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/sdp",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: offer.sdp
            }
        );

        console.log("WHIP response status:", res.status);

        if (!res.ok) {
            throw new Error("WHIP publish failed");
        }

        // Lưu resource để stop sau
        whipResource = res.headers.get("Location");

        const answer = await res.text();

        console.log("SDP ANSWER:");
        console.log(answer);

        await pc.setRemoteDescription({
            type: "answer",
            sdp: answer
        });

        console.log("Remote description set ✅");

        // pc.oniceconnectionstatechange = () => {
        //     console.log("ICE state:", pc.iceConnectionState);
        // };

        // setInterval(() => {
        //     console.log("ICE:", pc.iceConnectionState);
        // }, 2000);

    } catch (err) {
        console.error("Error:", err);
    }
};

// 🛑 STOP
stopBtn.onclick = () => {
    stopSharing();
};

function stopSharing() {
    if (pc) {
        pc.close();
        pc = null;
        console.log("PeerConnection closed");
    }

    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    video.srcObject = null;
}

// 🔗 WebRTC setup
async function createPeerConnection() {
    pc = new RTCPeerConnection({
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" }
        ]
    });

    // ICE candidate (WHIP sẽ không cần gửi thủ công)
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            console.log("ICE candidate:", event.candidate.candidate);
        }
    };

    // Theo dõi trạng thái ICE
    pc.oniceconnectionstatechange = () => {
        console.log("ICE state:", pc.iceConnectionState);
    };

    pc.onsignalingstatechange = () => {
        console.log("Signaling state:", pc.signalingState);
    };

    console.log("PeerConnection created");
}