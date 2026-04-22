import express from "express";
import line from "@line/bot-sdk";
import OpenAI from "openai";

const app = express();

const client = new line.Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/webhook", line.middleware({
  channelSecret: process.env.LINE_CHANNEL_SECRET
}), async (req, res) => {
  try {
    const events = req.body.events;

    for (const event of events) {
      if (event.type === "message" && event.message.type === "text") {
        const userMessage = event.message.text;

        const response = await openai.responses.create({
          model: "gpt-5-mini",
          input: userMessage,
        });

        const aiReply = response.output[0].content[0].text;

        await client.replyMessage(event.replyToken, {
          type: "text",
          text: aiReply,
        });
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("LINE BOT AI 起動🔥");
});
