import moment from "moment"
import React from "react";

DatePicker = React.createClass({
    propTypes: {
        // A Date() object
        date: React.PropTypes.object,

        // A function to call when the date is changed
        callback: React.PropTypes.func.isRequired
    },

    START_YEAR: 2016,
    YEARS: function() {
        let years = [];
        let year = 2016;
        while (year >= 1970) {
            years.push(year--);
        }
        return years
    }(),
    MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'],
    DAYS: function() {
        let days = [];
        let day = 1;
        while (day <= 31) {
            days.push(day++);
        }
        return days;
    }(),
    DAY_SUFFIXES: ['st', 'nd', 'rd', 'th'],
    HOURS: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    MINUTES: ['00', '05', '10', '15', '20', '25', '30',
        '35', '40', '45', '50', '55'],
    PERIODS: ['AM', 'PM'],

    getInitialState() {
        const m = moment(this.props.date);
        return {
            date: m,
            dateSuffix: this.getDateSuffixIndex(m.date())
        }
    },

    componentWillReceiveProps(newProps) {
        const m = moment(newProps.date);
        this.setState({
            date: m,
            dateSuffix: this.getDateSuffixIndex(m.date())
        })
    },

    getDateSuffixIndex(day) {
        if ((day <= 3 || (day > 20 && day % 10 <= 3)) && (day % 10 > 0)) {
            return (day - 1) % 10;
        } else {
            return 3;
        }
    },

    getSelectionWithDate() {
        const m = this.state.date;
        const month = parseInt(m.format("MM")) - 1;
        const days = m.date() - 1;
        const years = this.START_YEAR - m.year();
        const hour = parseInt(m.format("hh")) - 1;
        const minute = Math.floor(m.minute() / 5);
        const period = (m.hour() >= 12) ? 1 : 0;
        
        return [month, days, years, hour, minute, period];
    },

    handleChange(type, event) {
        const index = event.target.selectedIndex;
        const selections = this.getSelectionWithDate();
        if (type == "month") {
            // If we are changing to a month with fewer days, we may need to
            // adjust the day as well.
            this.state.date.set('month', this.MONTHS[index]);
            if (index != selections[0]) {
                const newNumberOfDays = this.state.date.daysInMonth();
                if (this.DAYS[selections[1]] > newNumberOfDays) {
                    this.state.dateSuffix = this.getDateSuffixIndex(
                        newNumberOfDays);
                }
            }
        } else if (type == "day") {
            this.state.date.set('date', this.DAYS[index]);
            this.state.dateSuffix = this.getDateSuffixIndex(
                this.DAYS[index]);
        } else if (type == "year") {
            this.state.date.set('year', this.YEARS[index]);
            // Handle the case when we're switching from Feb. 29th to not a leap
            // year.
            if (index != selections[2]) {
                if (this.DAYS[selections[1]] != this.state.date.date()) {
                    this.state.dateSuffix = this.getDateSuffixIndex(1)
                }
            }
        } else if (type == "hours") {
            const hour = (selections[5] == 0 ? 0 : 12) + (
                this.HOURS[index] % 12);
            this.state.date.set('hour', hour);
        } else if (type == "minutes") {
            this.state.date.set('minute', this.MINUTES[index]);
        } else if (type == "periods") {
            if (selections[5] == index) {
                return;
            }
            const hour = this.state.date.hour();
            if (index == 0) {
                // Just switched from PM to AM, subtract 12 hours
                this.state.date.set('hour', hour - 12)
            } else {
                this.state.date.set('hour', hour + 12)
            }
        }
        this.props.callback(this.state.date.toDate())
    },

    renderList(listElements, selectedIndex, type) {
        const defaultValue = listElements[selectedIndex];
        return (
            <select value={defaultValue}
                    onChange={this.handleChange.bind(this, type)}>
                {listElements.map(function(element) {
                    return (
                        <option key={element} value={element}>{element}</option>
                    )
                })}
            </select>
        )
    },

    renderTimePicker(selections) {
        return (
            <span className="time-picker">
                {this.renderList(this.HOURS, selections[3], "hours")}
                {":"}
                {this.renderList(this.MINUTES, selections[4], "minutes")}
                {this.renderList(this.PERIODS, selections[5], "periods")}
            </span>
        )
    },

    render() {
        const selections = this.getSelectionWithDate();
        const daySuffix = this.DAY_SUFFIXES[this.state.dateSuffix];
        const daysInMonth = this.state.date.daysInMonth();
        const days = this.DAYS.filter(function(day) {
            return day <= daysInMonth;
        });

        return (
            <div className="date-picker">
                {this.renderList(this.MONTHS, selections[0], "month")}
                {this.renderList(days, selections[1], "day")}
                <span className="day-suffix-text">{daySuffix}</span>
                {this.renderList(this.YEARS, selections[2], "year")}
                <span className="at-sign">@</span>
                {this.renderTimePicker(selections)}
            </div>
        );
    }
});
