import React from "react"
import {render} from "react-dom"
import { Meteor } from 'meteor/meteor';

Events = new Mongo.Collection("events");

if (Meteor.isClient) {
    // This code is executed on the client only
    Meteor.startup(function() {
        render(<App />, document.getElementById("render-target"))
    });
}

if (Meteor.isServer) {
    Tracker.autorun(function() {
        Meteor.publish("events", function() {
            return Events.find({});
        });
    });

    Meteor.methods({
       addEvent(content) {
            // Only logged in users can create events
            return Events.insert(content);
        },

       updateEvent(eventId, event) {
          Events.update(eventId, {
               $set: event
           });
       },

       deleteEvent(eventId) {
          Events.remove(eventId)
       },

       sendMessageToUser(fbId, message) {
           Meteor.http.call("POST", "http://localhost:4050/message/send", {
               data: {
                   token: process.env.CHAT_API_SECRET,
                   id: fbId,
                   message: message
               }
           })
       }
    });
}
