import { MessageTypeList } from '../../../messages/MessageTypeList.js';
import { UserServices } from '../../../messages/services/UserServices.js';
import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { TimeUtil } from '../../../utils/TimeUtil.js';
import { IComponentDom } from '../../base/BaseComponent.js';
import { BaseFlowComponent } from '../../base/flow/BaseFlowComponent.js';
import { FlowSharedData } from '../../base/flow/FlowManager.js';
import { InputInfoFlowEventList } from './InputInfoFlowEventList.js';

export interface IInputInfoFlowDom extends IComponentDom {
    root: HTMLDivElement;
    account: HTMLInputElement;
    password: HTMLInputElement;
}

export class InputInfoFlow extends BaseFlowComponent<FlowSharedData, IInputInfoFlowDom> {
    public createDomRoot(): void {
        Object.assign(this._dom, HtmlUtil.createDom(`
            <div class="register-input-info">
                <span class="title">註冊</span>
                <hr>
                <form target="">
                    <input type="text" placeholder="Account" name="username" autocomplete="username" data-enh-label="account" required>
                    <input type="password" placeholder="Password" data-enh-label="password" required>
                    <button class="full">下一步</button>
                </form>
            </div>
        `));

        const form = this._dom.root.querySelector('form');
        form.addEventListener('submit', this.onFormSubmit.bind(this));
    }

    public show(): void {
        TimeUtil.wait().then(() => this._dom.account.focus());
        super.show();
    }

    protected async onFormSubmit(ev: SubmitEvent): Promise<void> {
        ev.preventDefault();

        const account = this._dom.account.value;
        const password = this._dom.password.value;

        await this.checkInfo(account, password);
    }

    protected async checkInfo(account: string, password: string): Promise<void> {
        if (!account || !password) {
            return;
        }

        const msg = await UserServices.register(account, password);
        switch (msg.type) {
            case MessageTypeList.NETWORK_ERROR:
                alert('無法連接到伺服器');
                return;
            case MessageTypeList.INVALID_DATA:
                alert('無效的登入資料');
                return;
            case MessageTypeList.ACCOUNT_ALREADY_EXISTS:
                alert('此帳號已經存在');
                return;
            case MessageTypeList.SUCCESS:
                this.emitter.emit(InputInfoFlowEventList.USER_REGISTER_SUCCESS, msg.data);
                break;
            default:
                msg.data && console.error(msg.data);
                alert('出現未知的錯誤，請再試一次');
                return;
        }
    }
}
