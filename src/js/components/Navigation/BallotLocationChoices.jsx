import React, { Component } from "react";
import PropTypes from "prop-types";
import moment from "moment";
import BallotActions from "../../actions/BallotActions";
import BallotStore from "../../stores/BallotStore";
import { historyPush, isCordova } from "../../utils/cordovaUtils";
import ElectionStore from "../../stores/ElectionStore";
import { renderLog } from "../../utils/logging";
import VoterStore from "../../stores/VoterStore";
import { calculateBallotBaseUrl } from "../../utils/textFormat";

// December 2018:  We want to work toward being airbnb style compliant, but for now these are disabled in this file to minimize massive changes
/* eslint no-restricted-syntax: 1 */

export default class BallotLocationChoices extends Component {
  static propTypes = {
    ballotBaseUrl: PropTypes.string,
    current_voter_address: PropTypes.string,
    google_civic_election_id: PropTypes.number.isRequired,
    pathname: PropTypes.string,
    showElectionName: PropTypes.bool,
    toggleFunction: PropTypes.func,
  };

  constructor (props) {
    super(props);
    this.state = {
      googleCivicElectionId: 0,
      show_all_ballot_locations: false,
    };

    this.goToDifferentBallot = this.goToDifferentBallot.bind(this);
    this.showAllBallotLocationsToggle = this.showAllBallotLocationsToggle.bind(this);
  }

  componentDidMount () {
    // console.log("In BallotLocationChoices componentDidMount,  this.props.google_civic_election_id: ", this.props.google_civic_election_id);
    this.electionStoreListener = ElectionStore.addListener(this.onElectionStoreChange.bind(this));
    this.setState({
      ballot_location_list: this.retrieveBallotLocationList(this.props.google_civic_election_id),
      googleCivicElectionId: this.props.google_civic_election_id,
    });
    // console.log("In BallotLocationChoices componentDidMount, ballot_location_list_sorted: ", ballot_location_list_sorted);
  }

  componentWillReceiveProps (nextProps) {
    // console.log("BallotLocationChoices componentWillReceiveProps, nextProps.google_civic_election_id: ", nextProps.google_civic_election_id);
    this.setState({
      ballot_location_list: this.retrieveBallotLocationList(nextProps.google_civic_election_id),
      googleCivicElectionId: nextProps.google_civic_election_id,
    });
  }

  componentWillUnmount () {
    // console.log("BallotLocationChoices componentWillUnmount");
    this.electionStoreListener.remove();
  }

  onElectionStoreChange () {
    // console.log("BallotLocationChoices, onElectionStoreChange");
    this.setState({
      ballot_location_list: this.retrieveBallotLocationList(this.state.googleCivicElectionId),
    });
    // console.log("In BallotLocationChoices onElectionStoreChange, ballot_location_list_unsorted: ", ballot_location_list_unsorted);
  }

  retrieveBallotLocationList (googleCivicElectionId) {
    // console.log("retrieveBallotLocationList, googleCivicElectionId: ", googleCivicElectionId);
    if (!googleCivicElectionId || googleCivicElectionId === 0) {
      return [];
    }
    const ballot_location_list_unsorted = ElectionStore.getBallotLocationsForElection(googleCivicElectionId) || [];
    const ballot_location_list_sorted = this.sortBallotLocations(ballot_location_list_unsorted) || [];
    const voter_ballot_location = VoterStore.getBallotLocationForVoter();
    if (voter_ballot_location && voter_ballot_location.ballot_returned_we_vote_id) {
      let voter_ballot_location_in_list = false;
      // If the election in the voter_ballot_location matches the election we are looking at,
      // include the voter's displayed address
      // console.log("retrieveBallotLocationList, googleCivicElectionId: ", googleCivicElectionId, ", voter_ballot_location: ", voter_ballot_location);
      if (voter_ballot_location.google_civic_election_id === googleCivicElectionId) {
        // TODO: Steve remove the error suppression on the next line 12/1/18, a temporary hack
        ballot_location_list_sorted.map((ballot_location) => { // eslint-disable-line array-callback-return
          if (ballot_location.ballot_returned_we_vote_id === voter_ballot_location.ballot_returned_we_vote_id) {
            voter_ballot_location_in_list = true;
          }
        });

        if (!voter_ballot_location_in_list) {
          // The this ballot isn't already in the list, add it to the start
          ballot_location_list_sorted.unshift(voter_ballot_location); // Add to the start of the array
          // console.log("Added to start of ballot_location_list_sorted: ", voter_ballot_location);
        }
      }
    }
    return ballot_location_list_sorted;
  }

  sortBallotLocations (ballot_location_list_unsorted) {
    const orderedArray = [];
    if (ballot_location_list_unsorted) {
      // temporary array holds objects with position and sort-value
      const mapped = ballot_location_list_unsorted.map((ballot_location, i) => ({index: i, value: ballot_location}));

      // sorting the mapped array based on ballot_location_order which came from the server
      mapped.sort((a, b) => +(parseInt(a.value.ballot_location_order, 10) > parseInt(b.value.ballot_location_order, 10)) ||
      +(parseInt(a.value.ballot_location_order, 10) === parseInt(b.value.ballot_location_order, 10)) - 1);

      for (const element of mapped) {
        orderedArray.push(element.value);
      }
    }
    return orderedArray;
  }

  goToDifferentBallot (ballot_returned_we_vote_id = "", ballot_location_shortcut = "") {
    const ballotBaseUrl = calculateBallotBaseUrl(this.props.ballotBaseUrl, this.props.pathname);

    // console.log("BallotLocationChoices, goToDifferentBallot, ballot_returned_we_vote_id: ", ballot_returned_we_vote_id);
    // console.log("BallotLocationChoices, goToDifferentBallot, ballot_location_shortcut: ", ballot_location_shortcut);
    if (ballot_location_shortcut !== "" && ballot_location_shortcut !== undefined) {
      BallotActions.voterBallotItemsRetrieve(0, "", ballot_location_shortcut);
      // Change the URL to match
      historyPush(`${ballotBaseUrl}/${ballot_location_shortcut}`);
    } else if (ballot_returned_we_vote_id !== "" && ballot_returned_we_vote_id !== undefined) {
      BallotActions.voterBallotItemsRetrieve(0, ballot_returned_we_vote_id, "");
      // Change the URL to match
      historyPush(`${ballotBaseUrl}/id/${ballot_returned_we_vote_id}`);
    }
    if (this.props.toggleFunction) {
      this.props.toggleFunction();
    }
  }

  showAllBallotLocationsToggle () {
    this.setState({ show_all_ballot_locations: !this.state.show_all_ballot_locations });
  }

  render () {
    renderLog(__filename);
    // Commented out for 2018 Election
    // const default_number_of_ballot_locations_mobile = 5;
    // const default_number_of_ballot_locations_desktop = 5;
    const electionName = BallotStore.currentBallotElectionName;
    const electionDayText = BallotStore.currentBallotElectionDate;
    const electionDayTextFormatted = electionDayText ? <span>{moment(electionDayText).format("MMM Do, YYYY")}</span> : <span />;
    // console.log("In BallotLocationChoices render, ballot_location_list: ", this.state.ballot_location_list);
    if (this.state.ballot_location_list && this.state.ballot_location_list.length) {
      return (
        <div className="u-stack--sm ballot-locations d-print-none">
          { this.props.showElectionName ? (
            <h4 className={`ballot__header__title${isCordova() && "__cordova"} h4`}>
              <span className="u-push--sm">
                {electionName}
                {" "}
                <span className="d-none d-sm-inline">&mdash; </span>
                <span className="u-gray-mid u-no-break">{electionDayTextFormatted}</span>
              </span>
            </h4>
          ) :
            null }
          {/* Commented out for 2018 Election
        <div className="btn-group">
          Mobile display of buttons
          <div className="d-block d-sm-none">
            {this.state.ballot_location_list.slice(0, default_number_of_ballot_locations_mobile).map((ballot_location, key) => {
              return <BallotLocationButton key={key} ballot_location={ballot_location} goToDifferentBallot={this.goToDifferentBallot} />;
            })}
            <span className={this.state.show_all_ballot_locations ? "" : "u-hidden"}>
              {this.state.ballot_location_list.slice(default_number_of_ballot_locations_mobile).map((ballot_location, key) => {
                return <BallotLocationButton key={key} ballot_location={ballot_location} goToDifferentBallot={this.goToDifferentBallot} />;
              })}
            </span>
            { this.state.ballot_location_list.length > default_number_of_ballot_locations_mobile ?
              <span>
                <a onClick={this.showAllBallotLocationsToggle} className="u-no-break">
                  {this.state.show_all_ballot_locations ? "Hide" : "Show more" }
                </a>
              </span> :
              null }
          </div>

          Desktop display of buttons
          <div className="d-none d-sm-block">
            {this.state.ballot_location_list.slice(0, default_number_of_ballot_locations_desktop).map((ballot_location, key) => {
              return <BallotLocationButton key={key} ballot_location={ballot_location} goToDifferentBallot={this.goToDifferentBallot} />;
            })}
            <span className={this.state.show_all_ballot_locations ? "" : "u-hidden"}>
              {this.state.ballot_location_list.slice(default_number_of_ballot_locations_desktop).map((ballot_location, key) => {
                return <BallotLocationButton key={key} ballot_location={ballot_location} goToDifferentBallot={this.goToDifferentBallot} />;
              })}
            </span>
            { this.state.ballot_location_list.length > default_number_of_ballot_locations_desktop ?
              <span>
                <a onClick={this.showAllBallotLocationsToggle} className="u-no-break">
                  {this.state.show_all_ballot_locations ? "Hide" : "Show " + Math.max(0, this.state.ballot_location_list.length - default_number_of_ballot_locations_desktop) + " more" }
                </a>
              </span> :
              null }
          </div>
        </div>  */}
        </div>
      );
    } else {
      return <div />;
    }
  }
}
