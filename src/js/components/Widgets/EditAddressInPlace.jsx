import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AddressBox from '../AddressBox';
import { historyPush, isWebApp } from '../../utils/cordovaUtils';
import { calculateBallotBaseUrl, shortenText } from '../../utils/textFormat';
import { renderLog } from '../../utils/logging';

export default class EditAddressInPlace extends Component {
  static propTypes = {
    address: PropTypes.object.isRequired,
    ballotBaseUrl: PropTypes.string,
    noAddressMessage: PropTypes.string,
    pathname: PropTypes.string,
    toggleFunction: PropTypes.func.isRequired,
    defaultIsEditingAddress: PropTypes.bool,
  };

  constructor (props, context) {
    super(props, context);
    this.state = {
      editingAddress: false,
      textForMapSearch: '',
    };
    this.toggleEditingAddress = this.toggleEditingAddress.bind(this);
  }

  componentDidMount () {
    // console.log("In EditAddressInPlace componentDidMount");
    this.setState({
      editingAddress: this.props.defaultIsEditingAddress,
      textForMapSearch: this.props.address.text_for_map_search || '',
    });
  }

  componentWillReceiveProps (nextProps) {
    // console.log("EditAddressInPlace componentWillReceiveProps");
    this.setState({
      textForMapSearch: nextProps.address.text_for_map_search || '',
    });
  }

  toggleEditingAddress () {
    const { editingAddress } = this.state;
    if (isWebApp()) {
      this.setState({
        editingAddress: !editingAddress,
      });
    } else {
      // The scrolling pane within the Modal causes an "[LayoutConstraints] Unable to simultaneously satisfy constraints."
      // error in Cordova, when you try to expand it to fit for entering text in the address box, and Cordova messes up
      // the display as in https://github.com/wevote/WeVoteCordova/issues/52  So instead use the non modal version in
      // the settings/location route.
      this.props.toggleFunction();
      historyPush('/settings/address');
    }
  }

  render () {
    renderLog(__filename);
    const noAddressMessage = this.props.noAddressMessage ? this.props.noAddressMessage : '- no address entered -';
    const maximumAddressDisplayLength = 60;
    const ballotBaseUrl = calculateBallotBaseUrl(this.props.ballotBaseUrl, this.props.pathname);

    // console.log("EditAddressInPlace render, ballotBaseUrl: ", ballotBaseUrl);

    if (this.state.editingAddress) {
      return (
        <span>
          <h4 className="h4">Address</h4>
          <AddressBox
            cancelEditAddress={this.toggleEditingAddress}
            saveUrl={ballotBaseUrl}
            toggleSelectAddressModal={this.props.toggleFunction}
          />
        </span>
      );
    } else {
      return (
        <span>
          <h4 className="h4">Your Address</h4>
          <span className="ballot__edit-address-preview">
            { this.state.textForMapSearch.length ? shortenText(this.state.textForMapSearch, maximumAddressDisplayLength) : noAddressMessage }
            {' '}
          </span>
          <span className="d-print-none ballot__edit-address-preview-link u-padding-left--sm">
            <button
              className="btn btn-primary"
              id="editAddressInPlaceModalEditButton"
              onClick={this.toggleEditingAddress}
              type="button"
            >
              Edit
            </button>
          </span>
        </span>
      );
    }
  }
}
