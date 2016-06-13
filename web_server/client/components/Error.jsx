import React from "react"

// App component - represents the whole app
Error = React.createClass({
    propTypes: {
        code: React.PropTypes.number.isRequired
    },

    redirectHome() {
        window.location = "/";
    },

    render() {
        return (
            <div className="page-container">
                <header>
                    <h1 className="page-title" onClick={this.redirectHome}>
                        Sitch
                    </h1>
                    <div className="account-ui-wrapper">
                        <AccountsUIWrapper />
                    </div>
                </header>
                <h1>Error!</h1>
                <div>Code: {this.props.code}</div>
            </div>
        );
    }
});