import express from "express";

const app = express();
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

app.get("/", (req, res) => {
  res.send("LINE BOT OK");
});

app.post("/webhook", async (req, res) => {
  try {
    const events = req.body.events || [];

    for (const event of events) {
      if (event.type !== "message") continue;
      if (event.message?.type !== "text") continue;

      const userMessage = event.message.text;
      const replyToken = event.replyToken;

      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: userMessage }
          ]
        })
      });

      const openaiData = await openaiRes.json();
      const aiReply =
        openaiData.choices?.[0]?.message?.content || "うまく返答できませんでした。";

      await fetch("https://api.line.me/v2/bot/message/reply", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          replyToken,
          messages: [
            { type: "text", text: aiReply }
          ]
        })
      });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running");
});
