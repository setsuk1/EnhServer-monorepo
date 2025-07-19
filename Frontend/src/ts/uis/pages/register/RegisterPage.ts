import { userManager } from '../../../messages/managers/UserManager.js';
import { FlowManager, FlowSharedData } from '../../base/flow/FlowManager.js';
import { SuccessFlow } from '../login/SuccessFlow.js';
import { InputInfoFlow } from './InputInfoFlow.js';
import { InputInfoFlowEventList } from './InputInfoFlowEventList.js';
import { PasskeyFlow } from './PasskeyFlow.js';
import { PasskeyFlowEventList } from './PasskeyFlowEventList.js';

export class RegisterPage extends FlowManager<FlowSharedData> {
	protected _userIndex: number;

	public readonly inputInfoFlow: InputInfoFlow;
	public readonly passkeyFlow: PasskeyFlow;
	public readonly successFlow: SuccessFlow;

	constructor(render = false) {
		super('register-page login-page', undefined, render);

		this.inputInfoFlow = this.createFlow('input_info', InputInfoFlow) as InputInfoFlow;
		this.passkeyFlow = this.createFlow('passkey', PasskeyFlow) as PasskeyFlow;
		this.successFlow = this.createFlow('success', SuccessFlow) as SuccessFlow;

		this.addFlow(this.inputInfoFlow);
		this.addFlow(this.passkeyFlow);
		this.addFlow(this.successFlow);

		this.inputInfoFlow.emitter.on(InputInfoFlowEventList.USER_REGISTER_SUCCESS, this.onUserRegisterSuccess, this);

		this.passkeyFlow.emitter.on(PasskeyFlowEventList.SKIP_REGISTER_PASSKEY, this.onSkipRegisterPasskey, this);
		this.passkeyFlow.emitter.on(PasskeyFlowEventList.PASSKEY_REGISTER_SUCCESS, this.onPasskeyRegisterSuccess, this);
	}

	public createDomRoot(): void {
		super.createDomRoot();
		this.showFlow(this.inputInfoFlow.name);
	}

	protected async onUserRegisterSuccess(userIndex: number): Promise<void> {
		this._userIndex = userIndex;
		userManager.switcCurrenthUserByIndex(userIndex);
		this.showFlow(this.passkeyFlow.name);
	}

	protected async onSkipRegisterPasskey(): Promise<void> {
		await this.registerSuccess();
	}

	protected async onPasskeyRegisterSuccess(): Promise<void> {
		await this.registerSuccess();
	}

	public async registerSuccess(): Promise<void> {
		await this.showFlow(this.successFlow.name);
		this.successFlow.start('註冊成功', '');
		const user = await userManager.getUserByIndex(this._userIndex);
		this.successFlow.nickname = user?.nickname || '';
	}
}
