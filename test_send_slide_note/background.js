import { SocketService } from "./socket.js";
import { compressAndEncodeImage } from "./image.js";

const socketService = new SocketService();

const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjExMiwidXNlciI6eyJpZCI6MTEyLCJlbWFpbCI6ImRvbmd0czE5OTVAZ21haWwuY29tIiwib3JnYW5pemF0aW9uSWQiOm51bGwsImlzR3Vlc3QiOmZhbHNlLCJvcmlnaW5FdmVudElkIjpudWxsfSwiaWF0IjoxNzczOTA1MDgwLCJleHAiOjE3NzM5MDU5ODB9.bOQJXbbPu3rk0ZH_5Ft68hDHm12ndM2bloEIWZLrNsM";
const EVENT_ID = 33;

async function init() {
    socketService.connect(ACCESS_TOKEN, EVENT_ID);

    // delay để chắc chắn connect
    setTimeout(async () => {
        await emitSlideMovedNext(+
            "Current note example",
            "Next note example"
        );
    }, 3000);
}


async function emitSlideMovedNext(currentNotes, nextNotes) {
    console.log("[Slide] current:", currentNotes, "next:", nextNotes);

    const imageUrl = "https://lh7-us.googleusercontent.com/docsdf/AFQj2d4E6Hn13XPqdpGPZqLHSYWCQRdcwQMT55TQzc9HlpBz20CiRPiwLf5zD37gGPEl-tQQ-IQ_hmeYy3AC01DUj9kEGJK4lHRsBd3JcOHU6PmZVIBiat1BKidN_hN360qtHvd7aRUIQiXdFrdilYoTVbp3zarDBXqU1MQGs1PdTSYn1lBT=s1600";

    const nextPreview = await compressAndEncodeImage(imageUrl);

    const payload = {
        currentNotes,
        nextNotes,
        nextPreview,
    };

    console.log("[Emit] slide.move.next.desktop");

    socketService.sendMessage("slide.move.next.desktop", payload);
}

init();