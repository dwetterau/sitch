import React from "react"

EventOptions = React.createClass({
    propTypes: {
        // Whether or not an event is being created currently
        creating: React.PropTypes.bool.isRequired,

        // Whether the event is currently being edited or not
        editing: React.PropTypes.bool.isRequired,

        // The function to call when the Save/Edit button is clicked on
        saveOrEditFunc: React.PropTypes.func.isRequired,

        // The function to call when the delete button is clicked on
        deleteFunc: React.PropTypes.func.isRequired,

        // The function to call when teh cancel button is clicked on
        cancelFunc: React.PropTypes.func.isRequired
    },

    getInitialState() {
        // If we are creating or currently editing, automatically have the menu
        // expanded initially. Otherwise, keep it closed.
        const forceExpanded = this.props.creating || this.props.editing;
        return {
            expanded: forceExpanded,
            allowCollapse: !forceExpanded
        }
    },

    toggleExpand() {
        this.setState({expanded: !this.state.expanded});
    },

    renderExpander() {
        if (!this.state.allowCollapse) {
            return;
        }
        const text = this.state.expanded ? "close" : "options";
        return (
            <a className="expander"
                 onClick={this.toggleExpand}>
                {text}
            </a>
        );
    },

    renderEventOptionEdit() {
        const saveOrEdit = (this.props.creating) ? "create" : (
            (this.props.editing) ? "save" : "edit");
        return <a className="event-option -edit"
                  onClick={this.props.saveOrEditFunc}>{saveOrEdit}</a>
    },

    renderEventOptionDelete() {
        // There's nothing to delete if we're creating still
        if (this.props.creating) return;
        return <a className="event-option -delete"
                  onClick={this.props.deleteFunc}>delete</a>
    },

    renderEventOptionCancel() {
        // If we aren't editing, there's nothing to cancel
        if (!this.props.editing) return;
        return <a className="event-option -cancel"
                  onClick={this.props.cancelFunc}>cancel</a>
    },

    renderOptions() {
        // If the menu isn't expanded, don't show it
        if (!this.state.expanded) {
            return;
        }
        return (
            <div className="event-options-list">
                {this.renderEventOptionEdit()}
                {this.renderEventOptionDelete()}
                {this.renderEventOptionCancel()}
            </div>
        )
    },

    render() {
        return (
            <div className="event-options">
                {this.renderExpander()}
                {this.renderOptions()}
            </div>
        );
    }
});