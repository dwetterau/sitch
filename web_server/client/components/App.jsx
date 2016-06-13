import React from "react"

// App component - represents the whole app
App = React.createClass({
    propTypes: {
        // The eventId to render
        eventId: React.PropTypes.string
    },

    mixins: [ReactMeteorData],

    getInitialState() {
        return {
            eventEditorOpen: false // Used for creating new events
        }
    },

    getMeteorData() {
        let event = null;
        if (this.props.eventId) {
            const eventSubscriber = Meteor.subscribe(
                "events.byId",
                this.props.eventId
            );
            if (eventSubscriber.ready()) {
                event = Events.findOne({_id: this.props.eventId});
                if (!event) {
                    // Event was not found, redirect to 404
                    window.location = "/404"
                }
            }
        }
        Meteor.subscribe("fbIdMapping");
        let fbIdMapping = null;
        if (Meteor.user()) {
            const fbIdMappingList = FbIdMapping.find(
                {fbId: Meteor.user().profile.facebookId}).fetch();
            if (fbIdMappingList.length) {
                fbIdMapping = fbIdMappingList[0];
            }
        }
        return {
            event: event,
            fbIdMapping: fbIdMapping,
            currentUser: Meteor.user()
        }
    },

    redirectHome() {
        window.location = "/";
    },

    createEventFunc(event) {
        return Meteor.call("addEvent", event, (error, response) => {
            if (!error) {
                this.toggleEventEditor();
            }
            window.location = `/e/${response}`
        })
    },

    cancelEventCreationFunc() {
        this.toggleEventEditor()
    },

    toggleEventEditor() {
        this.setState({eventEditorOpen: !this.state.eventEditorOpen});
    },


    renderOpenEditorButton() {
        // Only allow users that are connected to FB and logged in to create
        // events. We might want to relax this restriction later.
        if (!this.data.fbIdMapping) return;

        // Don't render the create menu if it is already open
        if (this.state.eventEditorOpen) return;

        // If we aren't on our own page and logged in, we can't create a new
        // event here anyway.
        return (
            <div className="create-new-button"
                 onClick={this.toggleEventEditor}>
                <a>Create a new event</a>
            </div>
        )
    },

    renderCreateNewEvent() {
        // Only allow users that are connected to FB and logged in to create
        // events. We might want to relax this restriction later.
        if (!this.data.fbIdMapping) return;

        // Don't render the create menu if it isn't open
        if (!this.state.eventEditorOpen) return;

        return (
            <EditEvent event={getEmptyEvent()}
                       permissionLevel={PERMISSION_LEVEL.OWNER}
                       createFunc={this.createEventFunc}
                       cancelFunc={this.cancelEventCreationFunc} />
        );
    },

    sendMessage() {
        if (!this.data.currentUser || !this.data.fbIdMapping) return;
        Meteor.call(
            "sendMessageToUser",
            this.data.fbIdMapping.messengerId,
            this.refs.customMessageBox.value
        )
    },

    renderConnectMessengerButton() {
        // Ain't this a fun little dance?
        const fbId = this.data.currentUser.profile.facebookId;
        if (!fbId) return; // This won't render anyway if there is no FB user
        const buttonString = `
            <div class="fb-send-to-messenger"
                messenger_app_id="1594853060832247"
                page_id="378321619004947"
                data-ref="${fbId}"
                color="blue"
                size="standard">
            </div>`;
        return (
            <div className="connect-to-messenger-button"
                dangerouslySetInnerHTML={{__html: buttonString}} >
            </div>
        )
    },

    renderSendSelfMessage() {
        // Can't send a message to yourself if you're not logged in
        if (!this.data.currentUser) {
            return;
        }
        if (!this.data.fbIdMapping) {
            return this.renderConnectMessengerButton()
        }
        return (
            <div className="custom-message card">
                <input ref="customMessageBox" type="text" />
                <input type="button" onClick={this.sendMessage} value="Send" />
            </div>
        )
    },

    renderEvent() {
        if (!this.data.event) return;
        // TODO: Use real permissions! This is a gross hack
        return (
            <div className="event-container">
                <Event event={this.data.event}
                       permissionLevel={PERMISSION_LEVEL.EDITOR} />
            </div>
        );
    },

    renderPage() {
        // This is only called if we are querying for the page of a valid user
        return (
            <div className="page-content">
                {this.renderSendSelfMessage()}
                <div className="header-container card">
                    {this.renderOpenEditorButton()}
                    {this.renderCreateNewEvent()}
                </div>
                {this.renderEvent()}
            </div>
        );
    },

    render() {
        return (
            <div className="page-container">
                <header>
                    <h1 className="page-title" onClick={this.redirectHome}>
                        Sitch
                    </h1>
                    <AccountsUIWrapper />
                </header>
                {this.renderPage()}
            </div>
        );
    }
});