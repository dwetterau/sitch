import moment from "moment"
import React from "react"
import DraftJS from "draft-js"

getEmptyEvent = () => {
    return {
        startTime: new Date(),
        title: "",
        description: DraftJS.convertToRaw(DraftJS.ContentState.createFromText("")),
        public: true // TODO: Change this default
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

    getInitialState() {
        return this._getNewStateFromProps(this.props);
    },

    componentWillReceiveProps(newProps) {
        this.setState(this._getNewStateFromProps(newProps))
    },

    _getNewStateFromProps(props) {
        return {
            event: props.event,
            inEditMode: false
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

    cancelEventEdit() {
        this.toggleEditMode();
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

    renderEventBody() {
        const formattedDate = moment(this.state.event.startTime).format("ll");
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

    render() {
        return (
            <div className="event-container card">
                {this.renderEvent()}
            </div>
        );
    }
});