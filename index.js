const express = require('express');
const axios = require('axios');
const twilio = require('twilio');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const { MessagingResponse } = require('twilio').twiml;
const { db, createTableIfNotExists, writeDBmessage, closeDbConnection } = require('./db');

dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const phonenumber = process.env.phonenumber;
const openAIkey = process.env.openAIkey;
const openAIapi = 'https://api.openai.com/v1/engines/text-davinci-003/completions';

const PORT = 3000;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });
app.use(express.json());
createTableIfNotExists();

const openAIRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 15 minutes
    max: 10, // limit each phone number to 10 requests per windowMs
    keyGenerator: (req, res) => {
      return req.body.From;
    },
    handler: (req, res) => {
      res.status(429).send('Too many requests, please try again later');
    },
  });


app.post('/message', (req, res) => {
    console.log('here: ', req.body.Body);
    const twiml = new MessagingResponse();
    twiml.message('The Robots are coming! Head for the hills!!');
    res.type('text/xml').send(twiml.toString());
});

app.post('/sms', openAIRateLimiter, async (req, res) => {
    
    const receivedQuestion = req.body.Body;
    const senderPhoneNumber = req.body.From;
    const gptResponse = await sendToGPT(receivedQuestion);

    writeDBmessage(senderPhoneNumber, receivedQuestion, gptResponse);
    console.log('phone number: ', senderPhoneNumber);
    console.log('question: ', receivedQuestion);
    console.log('gptResponse: ', gptResponse);

    client.messages
        .create({
            body: gptResponse,
            from: phonenumber,
            to: senderPhoneNumber
        })
        .then(message => {
            console.log('Message sent: ' + message.sid);
        })
        .catch(err => {
            console.error('Error sending message: ', err);
        });

    const twiml = new MessagingResponse();
    res.type('text/xml').send(twiml.toString());
});

async function sendToGPT(question) {
    const prompt = `The following is a conversation with an AI assistant. The assistant is helpful and clever. Please be brief in your responses and remove and redundant filler information or greetings as your response is limited to 100 tokens. \n\nHuman: ${question}?\nAI:`;
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAIkey}`
    };
    const data = {
        prompt: prompt,
        temperature: 0.9,
        max_tokens: 120,
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


process.on('SIGINT', () => {
    closeDbConnection();
    process.exit(0);
});
