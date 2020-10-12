import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SuggestedFriendDisplayForList from './SuggestedFriendDisplayForList';
import { renderLog } from '../../utils/logging';

export default class SuggestedFriendList extends Component {
  constructor (props) {
    super(props);
    this.state = {
      suggestedFriendList: this.props.friendList,
    };
  }

  componentDidMount () {
    this.setState({
      suggestedFriendList: this.props.friendList,
    });
  }

  // eslint-disable-next-line camelcase,react/sort-comp
  UNSAFE_componentWillReceiveProps (nextProps) {
    this.setState({
      suggestedFriendList: nextProps.friendList,
    });
  }

  render () {
    renderLog('SuggestedFriendList');  // Set LOG_RENDER_EVENTS to log all renders
    if (this.state.suggestedFriendList === undefined) {
      return null;
    }
    const { inSideColumn, previewMode } = this.props;

    return (
      <div className={!previewMode ? 'card' : null}>
        <div className={!previewMode ? 'card-main' : null}>
          {this.state.suggestedFriendList.map((friend, index) => (
            <div key={friend.voter_we_vote_id}>
              <SuggestedFriendDisplayForList
                inSideColumn={inSideColumn}
                previewMode={previewMode}
                linkedOrganizationWeVoteId={friend.linked_organization_we_vote_id}
                mutualFriends={friend.mutual_friends}
                positionsTaken={friend.positions_taken}
                voterWeVoteId={friend.voter_we_vote_id}
                voterPhotoUrlLarge={friend.voter_photo_url_large}
                voterDisplayName={friend.voter_display_name}
                voterTwitterHandle={friend.voter_twitter_handle}
                voterTwitterDescription={friend.voter_twitter_description}
                voterEmailAddress={friend.voter_email_address}
              />
              {index !== this.state.suggestedFriendList.length - 1 ? (
                <hr />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  }
}
SuggestedFriendList.propTypes = {
  friendList: PropTypes.array,
  inSideColumn: PropTypes.bool,
  previewMode: PropTypes.bool,
};
