import express from "express";
import fetch from "node-fetch";

const app = express();

app.use(express.text({ type: "*/*" }));

// 🔥 THÊM ĐOẠN NÀY (QUAN TRỌNG)
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }

    next();
});

// API proxy
app.post("/whip-proxy", async (req, res) => {
    try {
        const whipUrl = req.query.url;

        console.log("Proxy to:", whipUrl);

        const response = await fetch(whipUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/sdp"
            },
            body: req.body
        });

        const answer = await response.text();

        // expose header
        res.set("Access-Control-Expose-Headers", "Location");

        const location = response.headers.get("location");
        if (location) res.set("Location", location);

        res.status(response.status).send(answer);

    } catch (err) {
        console.error(err);
        res.status(500).send("Proxy error");
    }
});

app.listen(3000, () => {
    console.log("🚀 Proxy running at http://localhost:3000");
});