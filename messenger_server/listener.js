var bodyParser = require('body-parser');
var express = require('express');
var app = express();

// Local imports
MessageLib = require("./lib/messaging");

// Set up middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === '29fd2492-1e5a-4d18-9385') {
        res.send(req.query['hub.challenge']);
        return;
    }
    res.send('Error, wrong validation token');
});

app.post('/webhook/', function (req, res) {
    var messaging_events = req.body.entry[0].messaging;
    for (i = 0; i < messaging_events.length; i++) {
        var event = req.body.entry[0].messaging[i];
        var sender = event.sender.id;
        if (event.message && event.message.text) {
            var text = event.message.text;
            // Handle a text message from this sender
            console.log("Got a text message!!", text);

            // Send a reply
            MessageLib.sendTextMessage(
                sender,
                "Received: " + text.substr(0, 20)
            );
        }
    }
    res.sendStatus(200);
});

app.get('/webhook/status', function(req, res) {
    res.send({status: "ok"});
});

app.post('/message/send', function(req, res) {
    if (req.body.token !== process.env.CHAT_API_SECRET) {
        res.sendStatus(404);
        return
    }
    var fbId = req.body.id;
    var message = req.body.message;
    console.log("sending message to", fbId, message);
    MessageLib.sendTextMessage(fbId, message);
});

app.listen(4001, function() {
   console.log("Server listening...");
});
