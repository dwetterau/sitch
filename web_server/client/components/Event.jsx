import moment from "moment"
import React from "react"
import DraftJS from "draft-js"

getNewAttendee = (userId, permissionLevel, status) => {
    if (!status) {
        status = ATTENDING_STATUS.UNKNOWN;
    }
    return {
        firstJoinTime: new Date(),
        userId: userId,
        access: permissionLevel,
        status: status
    }
};

getEmptyEvent = (creator) => {
    return {
        startTime: new Date(),
        title: "",
        description: DraftJS.convertToRaw(
            DraftJS.ContentState.createFromText("")
        ),
        public: true, // TODO: Change this default
        attendees: [getNewAttendee(
            creator,
            PERMISSION_LEVEL.OWNER,
            ATTENDING_STATUS.ATTENDING
        )]
    };
};

PERMISSION_LEVEL = {
    NONE: 0,
    VIEWER: 100,
    EDITOR: 200,
    OWNER: 300
};

ATTENDING_STATUS = {
    UNKNOWN: 100,
    INVITED: 200,
    ATTENDING: 300,
    NOT_ATTENDING: 400
};

Event = React.createClass({
    propTypes: {
        event: React.PropTypes.object.isRequired
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
            const userIds = this.state.event.attendees.map((attendee) => {
                return attendee.userId;
            });

            const userSubscriber = Meteor.subscribe(
                "users.byId",
                userIds
            );
            if (userSubscriber.ready()) {
                const users = Meteor.users.find(
                    {_id: {$in: userIds}}).fetch();
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
        this.state.event.attendees.push(getNewAttendee(
            userId,
            PERMISSION_LEVEL.VIEWER,
            ATTENDING_STATUS.ATTENDING
        ));
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
        this.state.event.attendees.forEach((attendee) => {
            const user = this.data.userIdToUser[attendee.userId];
            const fbId = user.profile.facebookId;
            if (this.data.fbIdToMessengerId.hasOwnProperty(fbId)) {
                if (seenMap[attendee.userId]) {
                    throw Error("User in attendees list twice!");
                }
                seenMap[attendee.userId] = true;
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

    getUserAccess(userId) {
        if (userId === undefined) {
            userId = Meteor.userId()
        }
        let access = PERMISSION_LEVEL.NONE;
        this.state.event.attendees.forEach((attendee) => {
            if (attendee.userId == userId) {
                access = attendee.access;
            }
        });
        return access;
    },

    removeAttendee(attendee) {
        if (this.getUserAccess() < PERMISSION_LEVEL.OWNER) {
            throw Error("Non owner cannot change attendee access");
        }
        this.state.event.attendees = this.state.event.attendees.filter((curAttendee) => {
            if (curAttendee.userId != attendee.userId) {
                return true
            }
        });
        this._localUpdate()
    },

    changeAttendeeAccess(attendee) {
        if (this.getUserAccess() < PERMISSION_LEVEL.OWNER) {
            throw Error("Non owner cannot change attendee access");
        }
        attendee.access = (attendee.access == PERMISSION_LEVEL.EDITOR) ?
            PERMISSION_LEVEL.VIEWER: PERMISSION_LEVEL.EDITOR;
        this._localUpdate()
    },

    renderOptions() {
        if (this.getUserAccess() < PERMISSION_LEVEL.EDITOR) {
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
        if (this.getUserAccess(Meteor.userId())) {
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
        if (!this.getUserAccess(Meteor.userId())) {
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

    renderAttendeeOptions(attendee) {
        // Can't edit attendees if not logged in, or self edit.
        if (!Meteor.userId() || attendee.userId == Meteor.userId()) {
            return;
        }
        // Only an owner can operate on attendees (but still not self).
        if (this.getUserAccess() < PERMISSION_LEVEL.OWNER) {
            return;
        }
        let accessChangeMessage;
        if (attendee.access < PERMISSION_LEVEL.EDITOR) {
            accessChangeMessage = "Allow to edit"
        } else {
            accessChangeMessage = "Remove edit access"
        }
        return (
            <div className="attendee-options">
                <div className="attendee-remove"
                     onClick={this.removeAttendee.bind(this, attendee)}>
                    Remove
                </div>
                <div className="attendee-access-changer"
                     onClick={this.changeAttendeeAccess.bind(this, attendee)}>
                    {accessChangeMessage}
                </div>
            </div>
        )
    },

    renderEventAttendee(attendee) {
        let user = this.data.userIdToUser[attendee.userId];
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
                {this.renderAttendeeOptions(attendee)}
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
                           permissionLevel={this.getUserAccess()}
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