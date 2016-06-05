import React from "react"

// App component - represents the whole app
App = React.createClass({
    propTypes: {},

    mixins: [ReactMeteorData],

    getMeteorData() {
        Meteor.subscribe("events");
        Meteor.subscribe("fbIdMapping");
        const events = Events.find({}).fetch();
        let fbIdMapping = null;
        if (Meteor.user()) {
            const fbIdMappingList = FbIdMapping.find(
                {fbId: Meteor.user().profile.facebookId}).fetch();
            if (fbIdMappingList.length) {
                fbIdMapping = fbIdMappingList[0];
            }
        }
        return {
            events: events,
            fbIdMapping: fbIdMapping,
            currentUser: Meteor.user()
        }
    },

    redirectHome() {
        window.location = "/";
    },

    createEventFunc(event) {
        return Meteor.call("addEvent", event)
    },

    renderCreateNewEvent() {
        return (
            <div className="header-container card">
            </div>
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
            <div className="custom-message">
                <input ref="customMessageBox" type="text" />
                <input type="button" onClick={this.sendMessage} value="Send" />
            </div>
        )
    },

    renderPage() {
        // This is only called if we are querying for the page of a valid user
        return (
            <div className="page-content">
                {this.renderSendSelfMessage()}
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