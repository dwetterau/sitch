import moment from "moment"
import React from "react"
import DraftJS from "draft-js"

getEmptyEvent = (creator) => {
    return {
        startTime: new Date(),
        title: "",
        description: DraftJS.convertToRaw(
            DraftJS.ContentState.createFromText("")
        ),
        public: true, // TODO: Change this default
        attendees: [creator]
    };
};

PERMISSION_LEVEL = {
    VIEWER: 100,
    EDITOR: 200,
    OWNER: 300
};

Event = React.createClass({
    propTypes: {
        event: React.PropTypes.object.isRequired,

        // The permission level of the user viewing this event
        permissionLevel: React.PropTypes.number.isRequired
    },

    mixins: [ReactMeteorData],

    getInitialState() {
        return this._getNewStateFromProps(this.props);
    },

    componentWillReceiveProps(newProps) {
        this.setState(this._getNewStateFromProps(newProps))
    },

    _getNewStateFromProps(props) {
        return {
            event: props.event,
            inEditMode: false,
            notifying: false
        }
    },

    getMeteorData() {
        let userIdToUser = {};
        let fbIdToMessengerId = {};
        if (this.state.event.attendees.length > 0) {
            const userSubscriber = Meteor.subscribe(
                "users.byId",
                this.state.event.attendees
            );
            if (userSubscriber.ready()) {
                const users = Meteor.users.find(
                    {_id: {$in: this.state.event.attendees}}).fetch();
                let fbIds = [];
                users.forEach((user) => {
                    userIdToUser[user._id] = user;
                    fbIds.push(user.profile.facebookId);
                });

                // Now start loading the messenger mappings
                const fbIdMappingSubscriber = Meteor.subscribe(
                    "fbIdMapping.byFbIds", fbIds
                );
                if (fbIdMappingSubscriber.ready()) {
                    const mappings = FbIdMapping.find(
                        {fbId: {$in: fbIds}}).fetch();
                    mappings.forEach((mapping) => {
                        fbIdToMessengerId[mapping.fbId] = mapping.messengerId;
                    });
                }
            }
        }
        return {
            userIdToUser,
            fbIdToMessengerId
        }
    },

    toggleEditMode() {
        this.setState({inEditMode: !this.state.inEditMode});
    },

    updateEvent(eventId, newEvent) {
        Meteor.call("updateEvent", eventId, newEvent, (error, updatedEvent) => {
            this.setState({event: updatedEvent})
        });
        this.toggleEditMode();
    },

    deleteEvent() {
        Meteor.call("deleteEvent", this.state.event._id);
    },

    _localUpdate() {
        let newEvent = {};
        // Clear off the _id value
        Object.keys(this.state.event).forEach(function(key) {
            if (key == "_id") {
                return;
            }
            newEvent[key] = this.state.event[key];
        }.bind(this));
        this.updateEvent(this.state.event._id, newEvent);
    },

    joinEvent() {
        // Join the event as the logged in user
        const userId = Meteor.userId();
        if (!userId) {
            throw Error("Allowed non-existent user to join...");
        }
        this.state.event.attendees.push(userId);
        this._localUpdate();
    },

    cancelEventEdit() {
        this.toggleEditMode();
    },

    notifyAttendees() {
        // Turn on notify mode
        this.toggleNotifyMode();
    },

    toggleNotifyMode() {
        this.setState({notifying: !this.state.notifying})
    },

    sendNotificationToAttendees() {
        const senderName = Meteor.user().services.facebook.first_name;
        const messageText = this.refs.notificationMessage.value;
        const url = Meteor.absoluteUrl(`e/${this.state.event._id}`);
        const message = {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: `${senderName}: ${messageText}`,
                    buttons: [{
                        type: "web_url",
                        url: url,
                        title: "View Event"
                    }]
                }
            }
        };

        let messengerIds = [];
        let seenMap = {};
        this.state.event.attendees.forEach((userId) => {
            const user = this.data.userIdToUser[userId];
            const fbId = user.profile.facebookId;
            if (this.data.fbIdToMessengerId.hasOwnProperty(fbId)) {
                if (seenMap[userId]) {
                    throw Error("User in attendees list twice!");
                }
                seenMap[userId] = true;
                messengerIds.push(this.data.fbIdToMessengerId[fbId]);
            }
        });
        if (!seenMap[Meteor.userId()]) {
            throw Error("Can't send messages if this user is not on messenger.")
        }
        if (messengerIds.length) {
            Meteor.call("sendMessageToUsers", messengerIds, message);
        }
        this.toggleNotifyMode();
    },

    renderOptions() {
        if (this.props.permissionLevel < PERMISSION_LEVEL.EDITOR) {
            return;
        }
        return <EventOptions creating={false}
                             editing={this.state.inEditMode}
                             saveOrEditFunc={this.toggleEditMode}
                             deleteFunc={this.deleteEvent}
                             cancelFunc={this.cancelEventEdit} />
    },

    renderEventDescription() {
        const description = this.state.event.description || "";
        return (
                <DraftEditor
                    text={description}
                    readOnly={true}
                    showOptions={false}
                    onTextChange={(x) => {}} />
        )
    },

    renderJoinButton() {
        if (!Meteor.user()) {
            if (!Meteor.loggingIn()) {
                // Login to join this event!
                return (
                    <div className="join-button-container">
                        Log in to join this event!
                    </div>
                )
            }
            // Still logging in, don't show anything yet
            return
        }
        if (this.state.event.attendees.includes(Meteor.userId())) {
            // User is already in the event
            return
        }

        return (
            <div className="join-button-container"
                 onClick={this.joinEvent}>
                Click here to join this event!
            </div>
        )
    },

    renderNotifyAttendeesButton() {
        if (!Meteor.user()) return;
        if (!this.state.event.attendees.includes(Meteor.userId())) {
            // User must join event to notify all
            return
        }

        return (
            <div className="notify-button-container"
                 onClick={this.notifyAttendees}>
                Click here to send all attendees a message!
            </div>
        )
    },

    renderEventAttendee(attendeeId) {
        let user = this.data.userIdToUser[attendeeId];
        if (!user) return;
        const profilePicUrl = `https://graph.facebook.com/
            ${user.profile.facebookId}/picture/
            ?type=square&height=64&width=64`;

        return (
            <div key={user.profile.facebookId} className="attendee-container">
                <img className="attendee-photo" src={profilePicUrl} />
                <div className="attendee-name">
                    {user.profile.name}
                </div>
            </div>
        )
    },

    renderEventAttendees() {
        if (!(this.state.event.attendees.length > 0
                && Object.keys(this.data.userIdToUser).length > 0)) {
            return;
        }
        return (
            <div className="attendee-list-container">
                {this.state.event.attendees.map(this.renderEventAttendee)}
                {this.renderJoinButton()}
                {this.renderNotifyAttendeesButton()}
            </div>
        )
    },

    renderEventBody() {
        const formattedDate = moment(this.state.event.startTime).format(
            "ll @ h:mm a");
        return (
            <div className="event-body">
                <div className="event-header">
                    <div className="event-date">{formattedDate}</div>
                    <div className="event-title">
                        <DraftEditor
                            text={this.state.event.title}
                            readOnly={true}
                            showOptions={false}
                            onTextChange={(x) => {}} />
                    </div>
                </div>
                {this.renderEventDescription()}
                {this.renderEventAttendees()}
            </div>
        )
    },

    renderEvent() {
        if (!this.state.inEditMode) {
            return (
                <div className="rendered-event-container">
                    {this.renderOptions()}
                    {this.renderEventBody()}
                </div>
            )
        } else {
            return (
                <EditEvent event={this.state.event}
                           permissionLevel={this.props.permissionLevel}
                           updateFunc={this.updateEvent}
                           deleteFunc={this.deleteEvent}
                           cancelFunc={this.cancelEventEdit} />
            )
        }
    },

    renderNotifyContainer() {
        if (!this.state.notifying) return;
        return (
            <div className="notify-container card">
                Send a message to all attendees
                <input type="text" ref="notificationMessage" />
                <input type="button" value="Send"
                       onClick={this.sendNotificationToAttendees} />
            </div>
        )
    },

    render() {
        return (
            <div className="single-event-container">
                <div className="event-container card">
                    {this.renderEvent()}
                </div>
                {this.renderNotifyContainer()}
            </div>
        );
    }
});