import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import styled from 'styled-components';
import { withStyles } from '@material-ui/core/styles';
import ActivityActions from '../actions/ActivityActions';
import AnalyticsActions from '../actions/AnalyticsActions';
import AppActions from '../actions/AppActions';
import AppStore from '../stores/AppStore';
import BallotActions from '../actions/BallotActions';
import BallotStore from '../stores/BallotStore';
import BrowserPushMessage from '../components/Widgets/BrowserPushMessage';
import cookies from '../utils/cookies';
import EditAddressOneHorizontalRow from '../components/Ready/EditAddressOneHorizontalRow';
import ElectionCountdown from '../components/Ready/ElectionCountdown';
import FindOpinionsForm from '../components/ReadyNoApi/FindOpinionsForm';
import FirstAndLastNameRequiredAlert from '../components/Widgets/FirstAndLastNameRequiredAlert';
import FriendActions from '../actions/FriendActions';
import { historyPush, isAndroid, isIOS, isWebApp } from '../utils/cordovaUtils';
import IssueActions from '../actions/IssueActions';
import IssueStore from '../stores/IssueStore';
import ReadMore from '../components/Widgets/ReadMore';
import ReadyActions from '../actions/ReadyActions';
import ReadyIntroduction from '../components/ReadyNoApi/ReadyIntroduction';
import ReadyTaskBallot from '../components/Ready/ReadyTaskBallot';
import ReadyTaskFriends from '../components/Ready/ReadyTaskFriends';
import ReadyTaskPlan from '../components/Ready/ReadyTaskPlan';
import ReadyTaskRegister from '../components/Ready/ReadyTaskRegister';
import ReadyInformationDisclaimer from '../components/Ready/ReadyInformationDisclaimer';
import { renderLog } from '../utils/logging';
import ShareButtonDesktopTablet from '../components/Share/ShareButtonDesktopTablet';
import ValuesToFollowPreview from '../components/Values/ValuesToFollowPreview';
import VoterStore from '../stores/VoterStore';
import webAppConfig from '../config';
// import PledgeToVote from '../components/Ready/PledgeToVote';

const nextReleaseFeaturesEnabled = webAppConfig.ENABLE_NEXT_RELEASE_FEATURES === undefined ? false : webAppConfig.ENABLE_NEXT_RELEASE_FEATURES;

class Ready extends Component {
  constructor (props) {
    super(props);
    this.state = {
      chosenReadyIntroductionText: '',
      chosenReadyIntroductionTitle: '',
      issuesDisplayDecisionHasBeenMade: false,
      issuesShouldBeDisplayed: false,
      textForMapSearch: '',
      voterIsSignedIn: false,
    };
  }

  componentDidMount () {
    this.appStoreListener = AppStore.addListener(this.onAppStoreChange.bind(this));
    this.issueStoreListener = IssueStore.addListener(this.onIssueStoreChange.bind(this));
    this.voterStoreListener = VoterStore.addListener(this.onVoterStoreChange.bind(this));
    this.onAppStoreChange();
    this.onIssueStoreChange();
    this.onVoterStoreChange();
    if (!IssueStore.issueDescriptionsRetrieveCalled()) {
      IssueActions.issueDescriptionsRetrieve();
    }
    IssueActions.issuesFollowedRetrieve();
    if (!BallotStore.ballotFound) {
      // console.log('WebApp doesn't know the election or have ballot data, so ask the API server to return best guess');
      BallotActions.voterBallotItemsRetrieve(0, '', '');
    }
    ReadyActions.voterPlansForVoterRetrieve();
    ActivityActions.activityNoticeListRetrieve();
    FriendActions.suggestedFriendList();

    let { match: { params: { modalToOpen, shared_item_code: sharedItemCode } } } = this.props;
    modalToOpen = modalToOpen || '';
    // console.log('componentDidMount modalToOpen:', modalToOpen);
    if (modalToOpen === 'share') {
      this.modalOpenTimer = setTimeout(() => {
        AppActions.setShowShareModal(true);
      }, 1000);
    } else if (modalToOpen === 'sic') { // sic = Shared Item Code
      sharedItemCode = sharedItemCode || '';
      // console.log('componentDidMount sharedItemCode:', sharedItemCode);
      if (sharedItemCode) {
        this.modalOpenTimer = setTimeout(() => {
          AppActions.setShowSharedItemModal(sharedItemCode);
        }, 1000);
      }
    }

    AnalyticsActions.saveActionReadyVisit(VoterStore.electionId());
    this.setState({
      locationGuessClosed: cookies.getItem('location_guess_closed'),
      textForMapSearch: VoterStore.getTextForMapSearch(),
    });
  }

  componentDidCatch (error, info) {
    console.log('Ready.jsx caught: ', error, info.componentStack);
  }

  componentWillUnmount () {
    this.appStoreListener.remove();
    this.issueStoreListener.remove();
    this.voterStoreListener.remove();
    if (this.modalOpenTimer) {
      clearTimeout(this.modalOpenTimer);
      this.modalOpenTimer = null;
    }
  }

  onAppStoreChange () {
    this.setState({
      chosenReadyIntroductionText: AppStore.getChosenReadyIntroductionText(),
      chosenReadyIntroductionTitle: AppStore.getChosenReadyIntroductionTitle(),
    });
  }

  onIssueStoreChange () {
    const { issuesDisplayDecisionHasBeenMade } = this.state;
    // console.log('Ready, onIssueStoreChange, issuesDisplayDecisionHasBeenMade: ', issuesDisplayDecisionHasBeenMade);
    if (!issuesDisplayDecisionHasBeenMade) {
      const areIssuesLoadedFromAPIServer = IssueStore.areIssuesLoadedFromAPIServer();
      const areIssuesFollowedLoadedFromAPIServer = IssueStore.areIssuesFollowedLoadedFromAPIServer();
      // console.log('areIssuesLoadedFromAPIServer: ', areIssuesLoadedFromAPIServer, ', areIssuesFollowedLoadedFromAPIServer:', areIssuesFollowedLoadedFromAPIServer);
      if (areIssuesLoadedFromAPIServer && areIssuesFollowedLoadedFromAPIServer) {
        const issuesFollowedCount = IssueStore.getIssuesVoterIsFollowingLength();
        // console.log('issuesFollowedCount: ', issuesFollowedCount);
        this.setState({
          issuesDisplayDecisionHasBeenMade: true,
          issuesShouldBeDisplayed: (issuesFollowedCount < 3),
        });
      }
    }
  }

  onVoterStoreChange () {
    const textForMapSearch = VoterStore.getTextForMapSearch();
    this.setState({
      textForMapSearch,
      voterIsSignedIn: VoterStore.getVoterIsSignedIn(),
    });
  }

  goToBallot = () => {
    historyPush('/ballot');
  }

  getTopPadding = () => {
    if (isWebApp()) {
      return { paddingTop: '0 !important' };
    } else if (isIOS()) {
      // TODO: This is a bad place to set a top padding: Move it to Application__Wrapper on the next iOS pass
      return { paddingTop: '56px !important' };  // SE2: 56px, 11 Pro Max: 56px
    } else if (isAndroid()) {
      return { paddingTop: 'unset' };
    }
    return {};
  }

  render () {
    renderLog('Ready');  // Set LOG_RENDER_EVENTS to log all renders
    const {
      chosenReadyIntroductionText, chosenReadyIntroductionTitle, issuesShouldBeDisplayed,
      locationGuessClosed, textForMapSearch, voterIsSignedIn,
    } = this.state;

    const showAddressVerificationForm = !locationGuessClosed || !textForMapSearch;
    // console.log('locationGuessClosed:', locationGuessClosed, ', textForMapSearch:', textForMapSearch, ', showAddressVerificationForm:', showAddressVerificationForm);
    return (
      <Wrapper className="page-content-container">
        <PageContainer className="container-fluid" style={this.getTopPadding()}>
          <Helmet title="Ready to Vote? - We Vote" />
          <BrowserPushMessage incomingProps={this.props} />
          <div className="row">
            {(showAddressVerificationForm) && (
              <EditAddressWrapper className="col-12">
                <EditAddressOneHorizontalRow saveUrl="/ready" />
              </EditAddressWrapper>
            )}
            <div className="col-sm-12 col-lg-8">
              <MobileTabletCountdownWrapper className="u-show-mobile-tablet">
                <ShareButtonTabletWrapper>
                  <ShareButtonInnerWrapper className="u-show-tablet">
                    <ShareButtonDesktopTablet readyShare shareButtonText="Share" />
                  </ShareButtonInnerWrapper>
                </ShareButtonTabletWrapper>
                <ElectionCountdownMobileTabletWrapper
                  className="u-cursor--pointer u-show-mobile-tablet"
                  onClick={this.goToBallot}
                >
                  <ElectionCountdown daysOnlyMode />
                </ElectionCountdownMobileTabletWrapper>
              </MobileTabletCountdownWrapper>
              {(chosenReadyIntroductionTitle || chosenReadyIntroductionText) && (
                <Card className="card u-show-mobile-tablet">
                  <div className="card-main">
                    <Title>
                      {chosenReadyIntroductionTitle}
                    </Title>
                    <Paragraph>
                      <ReadMore
                        textToDisplay={chosenReadyIntroductionText}
                        numberOfLines={3}
                      />
                    </Paragraph>
                  </div>
                </Card>
              )}
              <ReadyInformationDisclaimer top />
              <ReadyTaskBallot
                arrowsOn
              />
              <Card className="card u-show-mobile">
                <div className="card-main">
                  <FindOpinionsForm
                    introHeaderLink="/values"
                    searchTextLarge
                    showVoterGuidePhotos
                    uniqueExternalId="showMobile"
                  />
                </div>
              </Card>
              <Card className="card u-show-mobile">
                <div className="card-main">
                  <ReadyIntroduction />
                </div>
              </Card>
              <IntroAndFindTabletWrapper className="u-show-tablet">
                <IntroductionWrapper>
                  <Card className="card">
                    <div className="card-main">
                      <ReadyIntroduction />
                    </div>
                  </Card>
                </IntroductionWrapper>
                <IntroAndFindTabletSpacer />
                <FindWrapper>
                  <Card className="card">
                    <div className="card-main">
                      <FindOpinionsForm
                        introHeaderLink="/values"
                        searchTextLarge
                        showVoterGuidePhotos
                        uniqueExternalId="showTablet"
                      />
                    </div>
                  </Card>
                </FindWrapper>
              </IntroAndFindTabletWrapper>
              {nextReleaseFeaturesEnabled && (
                <ReadyTaskRegister
                  arrowsOn
                />
              )}
              <ReadyTaskPlan
                arrowsOn
              />
              <ReadyInformationDisclaimer bottom />
              {voterIsSignedIn && (
                <FirstAndLastNameRequiredAlert />
              )}
              {nextReleaseFeaturesEnabled && (
                <ReadyTaskFriends
                  arrowsOn
                />
              )}
              <div className="u-show-mobile-tablet">
                {(issuesShouldBeDisplayed) && (
                  <ValuesListWrapper>
                    <ValuesToFollowPreview
                      followToggleOnItsOwnLine
                      includeLinkToIssue
                    />
                  </ValuesListWrapper>
                )}
              </div>
            </div>
            <div className="col-lg-4 d-none d-lg-block">
              <Card className="card">
                <div className="card-main">
                  <ShareButtonDesktopWrapper>
                    <ShareButtonDesktopTablet readyShare shareButtonText="Share Page" />
                  </ShareButtonDesktopWrapper>
                </div>
              </Card>
              <div className="u-cursor--pointer" onClick={this.goToBallot}>
                <ElectionCountdown daysOnlyMode />
              </div>
              {(chosenReadyIntroductionTitle || chosenReadyIntroductionText) && (
                <Card className="card">
                  <div className="card-main">
                    <Title>
                      {chosenReadyIntroductionTitle}
                    </Title>
                    <Paragraph>
                      {chosenReadyIntroductionText}
                    </Paragraph>
                  </div>
                </Card>
              )}
              <Card className="card">
                <div className="card-main">
                  <FindOpinionsForm
                    introHeaderLink="/values"
                    searchTextLarge
                    showVoterGuidePhotos
                    uniqueExternalId="showDesktopRightColumn"
                  />
                </div>
              </Card>
              <Card className="card">
                <div className="card-main">
                  <ReadyIntroduction
                    showStep3WhenCompressed
                  />
                </div>
              </Card>
              {(issuesShouldBeDisplayed) && (
                <ValuesListWrapper>
                  <ValuesToFollowPreview
                    followToggleOnItsOwnLine
                    includeLinkToIssue
                  />
                </ValuesListWrapper>
              )}
              {/* {nextReleaseFeaturesEnabled && <PledgeToVote />} */}
            </div>
          </div>
        </PageContainer>
      </Wrapper>
    );
  }
}
Ready.propTypes = {
  match: PropTypes.object,
};

const styles = (theme) => ({
  ballotIconRoot: {
    width: 150,
    height: 150,
    color: 'rgb(171, 177, 191)',
  },
  ballotButtonIconRoot: {
    marginRight: 8,
  },
  ballotButtonRoot: {
    width: 250,
    [theme.breakpoints.down('md')]: {
      width: '100%',
    },
  },
});

const Card = styled.div`
  padding-bottom: 4px;
`;

const EditAddressWrapper = styled.div`
  margin-bottom: 8px !important;
  margin-left: 0 !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
`;

const ElectionCountdownMobileTabletWrapper = styled.div`
  margin-top: -37px; // 29px for height of ShareButtonDesktopTablet - 8px for margin-top
`;

const FindWrapper = styled.div`
  width: 40%;
`;

const IntroductionWrapper = styled.div`
  width: 60%;
`;

const IntroAndFindTabletWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const IntroAndFindTabletSpacer = styled.div`
  width: 20px;
`;

const MobileTabletCountdownWrapper = styled.div`
  position: relative;
  z-index: 1;
`;

const PageContainer = styled.div`
// This is a bad place to set a top padding for the scrollable pane, it should be in Application__Wrapper
`;

const Paragraph = styled.div`
`;

const ShareButtonInnerWrapper = styled.div`
  z-index: 2;
`;

const ShareButtonDesktopWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const ShareButtonTabletWrapper = styled.div`
  display: flex;
  height: 29px;
  justify-content: flex-end;
  margin-top: 8px;
  margin-right: 8px;
  z-index: 2;
`;

const Title = styled.h2`
  font-size: 26px;
  font-weight: 800;
  margin: 0 0 12px;
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: 14px;
    margin: 0 0 4px;
  }
`;

const ValuesListWrapper = styled.div`
  margin-top: 12px;
  margin-bottom: 12px;
`;

const Wrapper = styled.div`
`;

export default withStyles(styles)(Ready);
