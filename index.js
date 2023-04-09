// @ts-nocheck
const express = require('express');
const axios = require('axios');
const twilio = require('twilio');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

const { MessagingResponse } = require('twilio').twiml;

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
    res.send('Could this really be...the internet?');
});

app.post('/message', (req, res) => {
    console.log('here: ', req.body.Body);
    const twiml = new MessagingResponse();
    twiml.message('The Robots are coming! Head for the hills!!');
    res.type('text/xml').send(twiml.toString());
});


app.post('/sms', async (req, res) => {
    const receivedMessage = req.body.Body;
    const senderPhoneNumber = req.body.From;

    const gptResponse = await sendToGPT(receivedMessage);

    console.log(gptResponse);
    // client.messages
    //     .create({
    //         body: gptResponse,
    //         from: TWILIO_PHONE_NUMBER,
    //         to: senderPhoneNumber
    //     })
    //     .then(() => {
    //         res.status(200).send();
    //     })
    //     .catch((err) => {
    //         console.error(err);
    //         res.status(500).send();
    //     });
});

async function sendToGPT(message) {
    const prompt = `The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.\n\nHuman: ${message}\nAI:`;
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
    };
    const data = {
        model: "text-davinci-003",
        prompt,
        temperature: 0.9,
        max_tokens: 150,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6,
        stop: [" Human:", " AI:"]
    };

    try {
        const response = await axios.post(GPT_API_ENDPOINT, data, { headers: headers });
        console.log(response.data.choices[0].text.trim());
        return response.data.choices[0].text.trim();
    } catch (error) {
        //console.error(error);
        return 'Error processing your request.';
    }
}
