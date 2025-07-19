import { userManager } from '../../../messages/managers/UserManager.js';
import { FlowManager } from '../../base/flow/FlowManager.js';
import { AccountFlow, IAccountFlowData } from './AccountFlow.js';
import { AccountFlowEventList } from './AccountFlowEventList.js';
import { PasskeyFlow } from './PasskeyFlow.js';
import { PasskeyFlowEventList } from './PasskeyFlowEventList.js';
import { PasswordFlow } from './PasswordFlow.js';
import { PasswordFlowEventList } from './PasswordFlowEventList.js';
import { SuccessFlow } from './SuccessFlow.js';

export type LoginPageSharedData = IAccountFlowData;

export class LoginPage extends FlowManager<LoginPageSharedData> {
	public readonly accountFlow: AccountFlow;
	public readonly passwordFlow: PasswordFlow;
	public readonly passkeyFlow: PasskeyFlow;
	public readonly successFlow: SuccessFlow;

	constructor(render = false) {
		super('login-page', undefined, render);

		this.accountFlow = this.createFlow('account', AccountFlow) as AccountFlow;
		this.passwordFlow = this.createFlow('password', PasswordFlow) as PasswordFlow;
		this.passkeyFlow = this.createFlow('passkey', PasskeyFlow) as PasskeyFlow;
		this.successFlow = this.createFlow('success', SuccessFlow) as SuccessFlow;

		this.addFlow(this.accountFlow);
		this.addFlow(this.passwordFlow);
		this.addFlow(this.passkeyFlow);
		this.addFlow(this.successFlow);

		this.accountFlow.emitter.on(AccountFlowEventList.NEXT_STEP, this.onAccountNextStep, this);

		this.passwordFlow.emitter.on(PasswordFlowEventList.CANCEL_PASSWORD_LOGIN, this.onPasswordCancelPasswordLogin, this);
		this.passwordFlow.emitter.on(PasswordFlowEventList.HAS_LOGGED_IN, this.onPasswordHasLoggedIn, this);
		this.passwordFlow.emitter.on(PasswordFlowEventList.PASSWORD_LOGIN_SUCCESS, this.onPasswordPasswordLoginSuccess, this);

		this.passkeyFlow.emitter.on(PasskeyFlowEventList.HAS_LOGGED_IN, this.onPasskeyHasLoggedIn, this);
		this.passkeyFlow.emitter.on(PasskeyFlowEventList.USE_PASSWORD_LOGIN, this.onPasskeyUsePasswordLogin, this);
		this.passkeyFlow.emitter.on(PasskeyFlowEventList.TRY_PASSKEY_LOGIN, this.onPasskeyTryPasskeyLogin, this);
		this.passkeyFlow.emitter.on(PasskeyFlowEventList.PASSKEY_LOGIN_SUCCESS, this.onPasskeyPasskeyLoginSuccess, this);
	}

	public createDomRoot(): void {
		super.createDomRoot();
		this.showFlow(this.accountFlow.name);
	}

	protected onAccountNextStep(account: string): Promise<void> {
		return this.passkeyFlow.login(account);
	}

	protected onPasswordCancelPasswordLogin(): void {
		this.showFlow(this.accountFlow.name);
	}

	protected onPasswordHasLoggedIn(): void {
		this.clearInput();
		this.showFlow(this.accountFlow.name);
	}

	protected async onPasswordPasswordLoginSuccess(userIndex: number): Promise<void> {
		await this.loginSuccess(userIndex);
	}

	protected onPasskeyHasLoggedIn(): void {
		this.clearInput();
		this.showFlow(this.accountFlow.name);
	}

	protected onPasskeyUsePasswordLogin(): void {
		this.showFlow(this.passwordFlow.name);
	}

	protected onPasskeyTryPasskeyLogin(): void {
		this.showFlow(this.passkeyFlow.name);
	}

	protected async onPasskeyPasskeyLoginSuccess(userIndex: number): Promise<void> {
		await this.loginSuccess(userIndex);
	}

	public clearInput(): void {
		this.accountFlow.dom.account && (this.accountFlow.dom.account.value = '');
		this.passwordFlow.dom.password && (this.passwordFlow.dom.password.value = '');
	}

	public async loginSuccess(userIndex: number): Promise<void> {
		await this.showFlow(this.successFlow.name);
		this.successFlow.start('歡迎回來', '');
		await userManager.switcCurrenthUserByIndex(userIndex);
		const user = await userManager.getCurrentUser();
		this.successFlow.nickname = user.nickname;
	}
}
