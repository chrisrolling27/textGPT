const express = require('express');
const axios = require('axios');
const twilio = require('twilio');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

const { MessagingResponse } = require('twilio').twiml;

const app = express();
const PORT = 3000;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });
app.use(express.json());

dotenv.config();
app.use(bodyParser.urlencoded({ extended: false }));

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const phonenumber = process.env.phonenumber;
const openAIkey = process.env.openAIkey;
const openAIapi = 'https://api.openai.com/v1/engines/text-davinci-003/completions';

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
    const receivedQuestion = req.body.Body;
    console.log(receivedQuestion);
    const senderPhoneNumber = req.body.From;

    const gptResponse = await sendToGPT(receivedQuestion);

    console.log(gptResponse);

    res.status(200).send(gptResponse);
    // client.messages
    //     .create({
    //         body: gptResponse,
    //         from: phonenumber,
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

async function sendToGPT(question) {
    const prompt = `The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.\n\nHuman: ${question}?\nAI:`;
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAIkey}`
    };
    const data = {
        prompt: prompt,
        temperature: 0.9,
        max_tokens: 100,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6,
        stop: [" Human:", " AI:"]
    };

    try {
        const response = await axios.post(openAIapi, data, { headers: headers });
        return response.data.choices[0].text.trim();
    } catch (error) {
        console.log(error);
        return 'Error processing your request.';
    }
}
