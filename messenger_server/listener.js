var bodyParser = require('body-parser');
var express = require('express');
var mongoClient = require('mongodb').MongoClient;
var app = express();

// Local imports
MessageLib = require("./lib/messaging");

// Set up middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

function insertFBMapping(messengerId, optin) {
    var query = {fbId: optin};
    var newMapping = {fbId: optin, messengerId: messengerId};
    db.collection("fbIdMapping").update(query, newMapping, {upsert: true},
            function(err) {

        if (err) {
            console.log("Error when inserting mapping", err);
            return
        }
        console.log("Inserted new mapping successfully", optin, messengerId)
    });
}

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
            // This is a text webhook
            var text = event.message.text;
            // Handle a text message from this sender
            console.log("Got a text message!!", text);

            // Send a reply
            MessageLib.sendTextMessage(
                sender,
                "Received: " + text.substr(0, 20)
            );
        } else if (event.optin && event.optin.ref) {
            // This is an authentication webhook event
            console.log("Got new auth event", sender, event.optin);
            insertFBMapping(sender, event.optin.ref)
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
    var fbIds = req.body.ids || [];
    var message = req.body.message;
    fbIds.forEach(function(fbId) {
        console.log("Sending message to:", fbId);
        MessageLib.sendMessage(fbId, message);
    });
    res.sendStatus(200);
});

// Connect to the db
var db;
mongoClient.connect(process.env.MONGO_URL, function(err, database) {
    if (err) throw err;
    db = database;
    app.listen(4050, function() {
        console.log("Server listening...");
    });
});
