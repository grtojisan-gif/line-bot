const express = require("express");
const line = require("@line/bot-sdk");
const OpenAI = require("openai");

const app = express();

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const lineClient = new line.Client(lineConfig);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("LINE BOT OK");
});

app.post("/webhook", line.middleware(lineConfig), async (req, res) => {
  try {
    const events = req.body.events || [];

    await Promise.all(events.map(handleEvent));

    res.status(200).end();
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).end();
  }
});

async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    return null;
  }

  const userMessage = event.message.text;

  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: userMessage,
    });

    const replyText = response.output_text || "うまく返答できませんでした。";

    await lineClient.replyMessage(event.replyToken, {
      type: "text",
      text: replyText,
    });

    return null;
  } catch (error) {
    console.error("OpenAI error:", error);

    await lineClient.replyMessage(event.replyToken, {
      type: "text",
      text: "AI側でエラーが出ました。少ししてからもう一度送ってください。",
    });

    return null;
  }
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("LINE BOT AI 起動");
});
