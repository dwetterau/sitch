import React from "react"
import DraftJS from "draft-js"

EditEvent = React.createClass({
    propTypes: {
        // The current properties of the event
        event: React.PropTypes.object.isRequired,

        // The permission level of the user viewing this event 
        permissionLevel: React.PropTypes.number.isRequired,

        // The function to call to create the event
        createFunc: React.PropTypes.func,

        // The function to call to cancel editing the event
        cancelFunc: React.PropTypes.func,

        // The function to call to update the event
        updateFunc: React.PropTypes.func,

        // The function to call to delete the event
        deleteFunc: React.PropTypes.func
    },

    getInitialState() {
        return this._getNewStateFromProps(this.props)
    },

    componentWillReceiveProps(newProps) {
        this.setState(this._getNewStateFromProps(newProps))
    },

    _getNewStateFromProps(props) {
        let clonedEvent = JSON.parse(JSON.stringify(props.event));
        clonedEvent.startTime = new Date(clonedEvent.startTime);
        return {
            event: clonedEvent,
            creating: !props.event._id
        }
    },

    handleTitleChange(rawContent) {
        const contentState = DraftJS.convertFromRaw(rawContent);
        this.state.event.title = contentState.getPlainText().trim();
        this.setState({event: this.state.event});
    },

    handleDateChange(newDate) {
        this.state.event.startTime = newDate;
        this.setState({event: this.state.event});
    },

    handlePublicChange() {
        throw Error("Changing public status is not supported yet.");
        this.state.event.public = !this.state.event.public;
        this.setState({event: this.state.event})
    },

    handleDescriptionChange(newDescription) {
        this.state.event.description = newDescription;
        this.setState({event: this.state.event});
    },

    createEvent() {
        if (!this.state.creating) {
            throw Error("Tried to create event in non-create mode.");
        }
        let newEvent = {};
        newEvent.startTime = this.state.event.startTime;
        newEvent.title = this.state.event.title;
        newEvent.description = this.state.event.description;
        newEvent.path = this.state.event.path;
        newEvent.public = this.state.event.public;
        newEvent.attendees = this.state.event.attendees;

        this.props.createFunc(newEvent);
    },

    updateEvent() {
        let newEvent = {};
        // Clear off the _id value
        Object.keys(this.state.event).forEach(function(key) {
            if (key == "_id") {
                return;
            }
            newEvent[key] = this.state.event[key];
        }.bind(this));
        this.props.updateFunc(this.state.event._id, newEvent);
    },

    renderOptions() {
        // TODO: Formalize this: viewer: 100, editor: 200, owner: 300
        if (this.props.permissionLevel < 200) {
            return;
        }
        const saveOrEdit = (this.state.creating) ? this.createEvent :
            this.updateEvent;
        const deleteFunc = (this.state.creating) ? () => {} :
            this.props.deleteFunc;
        return <EventOptions creating={this.state.creating}
                             editing={true}
                             saveOrEditFunc={saveOrEdit}
                             deleteFunc={deleteFunc}
                             cancelFunc={this.props.cancelFunc} />
    },

    renderDatePicker() {
        // TODO: Allow time picking
        return <DatePicker callback={this.handleDateChange}
                           date={this.state.event.startTime} />
    },

    renderTitleEditor() {
        return (
            <div className="event-title-editor">
                <DraftEditor
                    text={this.state.event.title}
                    readOnly={false}
                    onTextChange={this.handleTitleChange}
                    showOptions={false}
                    initialOptions={{}}
                    placeholder={"Title"} />
            </div>
        )
    },

    renderDescriptionEditor() {
        return (
            <EditDescription 
                description={this.state.event.description}
                updateDescription={this.handleDescriptionChange} />
        )
    },

    renderEditorPublicSelector() {
        // TODO: Support private events
        let text;
        if (this.state.creating) {
            if (this.state.event.public) {
                text = "Anyone will be able to see this"
            } else {
                text = "Only you will be able to see this"
            }
        } else {
            if (this.state.event.public) {
                text = "Anyone can see this"
            } else {
                text = "Only you can see this"
            }
        }
        return (
            <div className="editor-public-container">
                <a className="editor-public-changer"
                     onClick={this.handlePublicChange}>
                    {text}
                </a>
            </div>
        )
    },

    render() {
        return (
            <div className="event-editor">
                {this.renderOptions()}
                {this.renderDatePicker()}
                {this.renderTitleEditor()}
                {this.renderDescriptionEditor()}
            </div>
        )
    }
});