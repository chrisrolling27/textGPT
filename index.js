const express = require('express');
const axios = require('axios');
const twilio = require('twilio');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });

dotenv.config();
app.use(bodyParser.urlencoded({ extended: false }));

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GPT_API_ENDPOINT = 'https://api.openai.com/v1/engines/davinci-codex/completions';

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/message', (req, res) => {
    const receivedMessage = req.body.Body;
    console.log('Received SMS message:', receivedMessage);
    res.status(200).send('received_message!');
  });




app.post('/sms', async (req, res) => {
    const receivedMessage = req.body.Body;
    const senderPhoneNumber = req.body.From;

    const gptResponse = await sendToGPT(receivedMessage);

    client.messages
        .create({
            body: gptResponse,
            from: TWILIO_PHONE_NUMBER,
            to: senderPhoneNumber
        })
        .then(() => {
            res.status(200).send();
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send();
        });
});

async function sendToGPT(message) {
    const prompt = `Texter says: ${message}\nAI Assistant:`;
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
    };
    const data = {
        prompt,
        max_tokens: 150,
        n: 1,
        stop: null,
        temperature: 0.8
    };

    try {
        // @ts-ignore
        const response = await axios.post(GPT_API_ENDPOINT, data, { headers: headers });
        return response.data.choices[0].text.trim();
    } catch (error) {
        console.error(error);
        return 'Error processing your request.';
    }
}

