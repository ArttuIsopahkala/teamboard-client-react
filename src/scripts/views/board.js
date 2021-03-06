import page  from 'page';
import React from 'react/addons';

import User  from '../models/user';
import Board from '../models/board';

import UserStore     from '../stores/user';
import BoardStore    from '../stores/board';
import SettingsStore from '../stores/settings';

import BoardAction    from '../actions/board';
import TicketAction   from '../actions/ticket';
import SettingsAction from '../actions/settings';

import listener from '../mixins/listener';

import Control         from '../components/control';
import Scrollable      from '../components/scrollable';
import Navigation      from '../components/navigation';
import Broadcaster     from '../components/broadcaster';
import BoardComponent  from '../components/board';
import EditBoardDialog from '../components/dialog/edit-board';

/**
 * Fix issues with iOS and IScroll not working together too well...
 */
function preventDefault(event) {
	return event.preventDefault();
}

/**
 *
 */
export default React.createClass({
	propTypes: {
		id: React.PropTypes.string.isRequired,
		user: (props) => {
			if(!props.user instanceof User) throw new Error();
		}
	},

	mixins: [
		listener(UserStore, BoardStore, SettingsStore)
	],

	onChange() {
		return this.setState(this.getState());
	},

	getState() {
		return {
			board:       BoardStore.getBoard(this.props.id) || new Board(),
			snapToGrid:  SettingsStore.getSetting('snap-to-grid'),
			showMinimap: SettingsStore.getSetting('show-minimap')
		}
	},

	getInitialState() {
		return Object.assign(this.getState(), { showEditBoardDialog: false });
	},

	componentDidMount() {
		BoardAction.load(this.props.id);
		document.addEventListener('touchmove', preventDefault);
	},

	componentWillUnmount() {
		document.removeEventListener('touchmove', preventDefault);
	},

	toggleEditBoardDialog() {
		this.setState({
			showEditBoardDialog: !this.state.showEditBoardDialog
		});
	},

	render() {
		let editBoardDialog = !this.state.showEditBoardDialog ? null : (
			<EditBoardDialog board={this.state.board}
				onDismiss={this.toggleEditBoardDialog} />
		);
		return (
			<div className="view view-board">
				<Broadcaster />
				<Navigation title={this.state.board.name} />
				<div className="content">
					<Scrollable board={this.state.board} minimap={this.state.showMinimap}>
						<BoardComponent board={this.state.board} snap={this.state.snapToGrid} />
					</Scrollable>
				</div>
				{editBoardDialog}
				{this.renderControls()}
			</div>
		);
	},

	/**
	 * TODO This is a mess, clean up the controls somehow?
	 * TODO Use immutable data to prevent constantly re-rendering the controls.
	 */
	renderControls() {
		let controls = [{
			onClick: () => {
				SettingsAction.setSetting('snap-to-grid', !this.state.snapToGrid);
			},
			icon:   'magnet',
			active: this.state.snapToGrid
		}, {
			onClick: () => {
				SettingsAction.setSetting('show-minimap', !this.state.showMinimap);
			},
			icon:   'globe',
			active: this.state.showMinimap
		}];

		let userOnlyControls = [{
			onClick: () => {
				return page.show('/boards')
			},
			icon: 'arrow-left'
		}, {
			icon:    'pencil',
			active:  this.state.showEditBoardDialog,
			onClick: this.toggleEditBoardDialog,
		}];

		if(this.props.user.type === User.Type.User) {
			controls = userOnlyControls.concat(controls);
		}

		return (
			<div className="controls">
				{controls.map((control) => {
					return <Control key={control.icon} {...control} />;
				})}
			</div>
		);
	}
});
