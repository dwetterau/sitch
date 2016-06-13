var request = require("request");
var token = process.env.CHAT_AUTH_TOKEN;

function sendTextMessage(sender, text) {
    var newMessage = {
        text: text
    };
    return sendMessage(sender, newMessage)
}
    
function sendMessage(sender, message) {    
    if (!token) {
        throw Error("No token!")
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: token},
        method: 'POST',
        json: {
            recipient: {id: sender},
            message: message
        }
    }, function(error, response, body) {
        if (error) {
            console.log("Error sending message:", error);
        } else if (response.body.error) {
            console.log('Response error:', response.body, error);
        } else {
            console.log("Got response from sending:", body);
        }
    })
}

module.exports = {
    sendMessage: sendMessage,
    sendTextMessage: sendTextMessage
};