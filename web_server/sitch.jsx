import React from "react"
import {render} from "react-dom"
import { Meteor } from 'meteor/meteor';

Events = new Mongo.Collection("events");
FbIdMapping = new Mongo.Collection("fbIdMapping");

if (Meteor.isClient) {
    // This code is executed on the client only
    FlowRouter.route("/", {
        action() {
            render(<App />, document.getElementById("render-target"))
        }
    });
    
    FlowRouter.route("/e/:event", {
        action(params) {
            render(
                <App eventId={params.event} />,
                document.getElementById("render-target")
            )
        }
    });
    
    // Error handling
    [404].forEach(function(code) {
        FlowRouter.route("/" + code, {
            action() {
                render(
                    <Error code={code} />,
                    document.getElementById("render-target")
                );
            }
        });
    });
    
    Meteor.startup(function() {});
}

if (Meteor.isServer) {
    Tracker.autorun(function() {
        Meteor.publish("events.byId", function(eventId) {
            return Events.find({_id: eventId});
        });
        Meteor.publish("fbIdMapping", function() {
            return FbIdMapping.find({});
        });
        Meteor.publish("users.byId", function(userIdList) {
            return Meteor.users.find({_id: {$in: userIdList}})
        });
        Meteor.publish("fbIdMapping.byFbIds", function(fbIds) {
            return FbIdMapping.find({fbId: {$in: fbIds}})
        })
    });

    requireLoggedIn = function() {
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
    };
    
    Meteor.methods({
       addEvent(content) {
           requireLoggedIn();
           // Only logged in users can create events
           return Events.insert(content);
        },

       updateEvent(eventId, event) {
           requireLoggedIn();
           Events.update(eventId, {
               $set: event
           });
           // Return the event for client computation
           event._id = eventId;
           return event
       },

       deleteEvent(eventId) {
           requireLoggedIn();
           Events.remove(eventId)
       },

       sendMessageToUsers(fbMessengerIds, message) {
           // Look up the fbMessengerId
           Meteor.http.call("POST", "http://localhost:4050/message/send", {
               data: {
                   token: process.env.CHAT_API_SECRET,
                   ids: fbMessengerIds,
                   message: message
               }
           })
       }
    });
}
