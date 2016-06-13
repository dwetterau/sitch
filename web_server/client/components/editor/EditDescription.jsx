import React from "react"

EditDescription = React.createClass({
    propTypes: {
        // The current description
        description: React.PropTypes.object.isRequired,

        // The function to call when the description changes
        updateDescription: React.PropTypes.func.isRequired
    },

    handleDescriptionChange(newRawContent) {
        this.props.description = newRawContent;
        this.props.updateDescription(newRawContent);
    },

    render() {
        return (
            <DraftEditor
                text={this.props.description}
                readOnly={false}
                onTextChange={this.handleDescriptionChange}
                showOptions={true}
                placeholder={"Description..."} />
        );
    }
});