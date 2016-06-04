import React from "react"

// App component - represents the whole app
App = React.createClass({
    propTypes: {},

    mixins: [ReactMeteorData],

    getMeteorData() {
        Meteor.subscribe("events");
        const events = Events.find({}).fetch();
        return {
            events: events,
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
        if (!this.data.currentUser) return;
        Meteor.call(
            "sendMessageToUser",
            this.data.currentUser.profile.facebookId,
            this.refs.customMessageBox.value
        )
    },

    renderSendSelfMessage() {
        // Can't send a message to yourself if you're not logged in
        if (!this.data.currentUser) {
            return;
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