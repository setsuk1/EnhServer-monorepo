import { userManager } from '../../../messages/managers/UserManager.js';
import { Message } from '../../../messages/Message.js';
import { MessageTypeList } from '../../../messages/MessageTypeList.js';
import { TokenServices } from '../../../messages/services/TokenServices.js';
import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { UrlUtil } from '../../../utils/UrlUtil.js';
import { BaseComponent } from '../../base/BaseComponent.js';

export class ExternalLoginPage extends BaseComponent {

	public get allowGuest(): boolean {
		return UrlUtil.locationSearch.has('allow_guest', 'true');
	}

	public get selectCurrent(): boolean {
		return UrlUtil.locationSearch.has('select_current', 'true');
	}

	public createDomRoot(): void {
		this._dom.root = HtmlUtil.createElement(`
            <div class="external-login">
				<div class="container">
					<div class="section user-area">
					</div>
					<div class="section">
						<button class="other-login-button full">登入其他帳號</button>
					</div>
					<div class="section">
						<button class="guest-login-button full">以訪客登入</button>
					</div>
				</div>
            </div>
		`);

		const [loginButtonDom, guestButtonDom] = Array.from(this._dom.root.querySelectorAll('button'));

		loginButtonDom.addEventListener('click', this.onLoginButtonClick.bind(this));

		guestButtonDom.addEventListener('click', this.onGuestButtonClick.bind(this));

		if (!this.allowGuest) {
			guestButtonDom.classList.add('hidden');
		}

		this.updateUserButton();
	}

	protected async updateUserButton(): Promise<void> {
		const selectCurrent = this.selectCurrent;
		const [myuser, users] = await Promise.all([selectCurrent && userManager.getCurrentUser(), userManager.getUsers()]);
		if (!users.length && !this.allowGuest) {
			const params = new URLSearchParams();
			if (selectCurrent) {
				params.set('select_current', 'true');
			}

			this.onLoginButtonClick(params);
			return;
		}

		if (myuser) {
			const index = users.findIndex(user => user.account === myuser.account);
			if (index !== -1) {
				this.onAccountButtonClick(index);
			}
		}

		const userAreaDom = this._dom.root.querySelector('.user-area');
		userAreaDom.innerHTML = '';

		users.forEach((user, index) => {
			const btn = HtmlUtil.createElement(`
                <button class="account-button full">以${user.account}登入</button>
            `);

			btn.addEventListener('click', () => this.onAccountButtonClick(index));

			userAreaDom.append(btn);
		});
	}

	protected async onAccountButtonClick(index: number): Promise<void> {
		if (!canBeSend()) {
			return;
		}

		disableSendToken();

		const msg = await TokenServices.createToken(index, 1);

		enableSendToken();

		switch (msg.type) {
			case MessageTypeList.NETWORK_ERROR:
				alert('無法連接到伺服器');
				return;
			case MessageTypeList.HAS_NOT_LOGGED_IN:
				alert('該帳號已登出，可能是頁面資料過舊所致');
				await this.updateUserButton();
				alert('已將頁面的資料更新至最新');
				return;
			case MessageTypeList.SUCCESS:
				break;
			default:
				msg.data && console.error(msg.data);
				alert('出現未知的錯誤，請再試一次');
				return;
		}

		sendToken(msg.data.string);
	}

	protected onLoginButtonClick(params: URLSearchParams): void {
		if (params instanceof URLSearchParams === false) {
			params = new URLSearchParams();
		}
		params.set('redirect_url', location.pathname);
		params.set('redirect_name', '登入頁面');
		params.set('redirect_with_params', 'true');
		UrlUtil.redirectBase(`login.html?${params}`);
	}

	protected onGuestButtonClick(): void {
		if (!this.allowGuest || !canBeSend()) {
			return;
		}

		sendToken('guest');
	}
}

let send = false;

function canBeSend(): boolean {
	return !send;
}

function enableSendToken(): void {
	send = false;
}

function disableSendToken(): void {
	send = true;
}

function sendToken(token: string) {
	if (!canBeSend()) {
		return false;
	}

	disableSendToken();

	window.addEventListener('message', (ev: MessageEvent) => {
		if (ev.origin.endsWith('gamelet.online') === false) {
			return;
		}
		ev.source.postMessage(new Message(MessageTypeList.SUCCESS, { token }).toJSON(), ev.origin as WindowPostMessageOptions);
	});

	return true;
}
