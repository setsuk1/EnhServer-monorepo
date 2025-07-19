import { userManager } from '../../../messages/managers/UserManager.js';
import { UserManagerEventList } from '../../../messages/managers/UserManagerEventList.js';
import { HtmlUtil } from "../../../utils/HtmlUtil.js";
import { UrlUtil } from '../../../utils/UrlUtil.js';
import { BaseComponent, IComponentDom } from "../../base/BaseComponent.js";
import { FlowManager } from '../../base/flow/FlowManager.js';
import { Sidebar } from '../../widgets/sidebar/Sidebar.js';
import { SidebarComponentEventList } from '../../widgets/sidebar/SidebarComponentEventList.js';
import { AccountRelatedFlow } from './AccountRelatedFlow.js';
import { PreferencesFlow } from './PreferencesFlow.js';
import { TokenManageFlow } from './TokenManageFlow.js';

export interface ISettingsPageDom extends IComponentDom {
	root: HTMLDivElement;
	content: HTMLDivElement;
}

export class SettingsPage extends BaseComponent<ISettingsPageDom> {
	protected _sidebar: Sidebar;
	protected _flowManager: FlowManager;

	protected _preferencesFlow: PreferencesFlow;
	protected _accountRelatedFlow: AccountRelatedFlow;
	protected _tokenManageFlow: TokenManageFlow;

	protected createDomRoot(): void {
		Object.assign(this._dom, HtmlUtil.createDom(`
			<div class="settings-page sidebar-page">
				<div class="content" data-enh-label="content"><div>
			</div>
		`));

		this._sidebar = new Sidebar();
		this.append(this._sidebar, true);

		this._flowManager = new FlowManager('container');
		this._flowManager.render();

		this._dom.content.append(this._flowManager.dom.root);
		this._dom.root.append(this._dom.content);

		this._preferencesFlow = this._flowManager.createFlow('preferences', PreferencesFlow) as PreferencesFlow;
		this._accountRelatedFlow = this._flowManager.createFlow('account_related', AccountRelatedFlow) as AccountRelatedFlow;
		this._tokenManageFlow = this._flowManager.createFlow('token_manage', TokenManageFlow) as TokenManageFlow;

		this._flowManager.addFlow(this._preferencesFlow);
		this._flowManager.addFlow(this._accountRelatedFlow);
		this._flowManager.addFlow(this._tokenManageFlow);

		this._flowManager.showFlow(this._accountRelatedFlow.name);

		const menu = this._sidebar.content.addMenu();
		menu.addItem(this._preferencesFlow.name, '偏好設定', 'settings')
		menu.addItem(this._accountRelatedFlow.name, '帳號相關', 'app_registration');
		menu.addItem(this._tokenManageFlow.name, 'Token管理', 'key');

		this._sidebar.content.emitter.on(SidebarComponentEventList.MENU_ITEM_CLICK, this.onSidebarMenuItemClick, this);

		// Temporary implementation
		userManager.emitter.on(UserManagerEventList.SWITCH_CURRENT_USER, location.reload, location);

		this.checkIsLoggedIn();
	}

	public async checkIsLoggedIn(): Promise<void> {
		const user = await userManager.getCurrentUser();
		if (user?.isLoggedIn) {
			return;
		}

		alert('你必須登入才能進入設定頁面');
		UrlUtil.redirectBase('login.html');
	}

	protected onSidebarMenuItemClick(tag: string) {
		this._flowManager.showFlow(tag);
	}
}
