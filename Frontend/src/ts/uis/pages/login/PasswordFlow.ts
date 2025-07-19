import { MessageTypeList } from '../../../messages/MessageTypeList.js';
import { UserServices } from '../../../messages/services/UserServices.js';
import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { IComponentDom } from '../../base/BaseComponent.js';
import { BaseFlowComponent } from '../../base/flow/BaseFlowComponent.js';
import { FlowSharedData } from '../../base/flow/FlowManager.js';
import { PasswordFlowEventList } from './PasswordFlowEventList.js';

export interface IPasswordFlowDom extends IComponentDom {
    root: HTMLDivElement;
    password: HTMLInputElement;
}

export class PasswordFlow extends BaseFlowComponent<FlowSharedData, IPasswordFlowDom> {
    public createDomRoot(): void {
        Object.assign(this._dom, HtmlUtil.createDom(`
            <div class="login-password">
                <span class="title">使用密碼登入</span>
                <hr>
                <form target="">
                    <input type="password" placeholder="Password" data-enh-label="password" required>
                    <br>
                    <div class="row">
                        <button class="left" type="button">取消</button>
                        <button class="right">登入</button>
                    </div>
                </form>
            </div>
        `));

        const form = this._dom.root.querySelector('form');
        form.addEventListener('submit', this.onFormSubmit.bind(this));

        const cancelButtonDom = this._dom.root.querySelector('button.left') as HTMLButtonElement;
        cancelButtonDom.addEventListener('click', this.onCancelButtonClick.bind(this));
    }

    public show(): void {
        this._dom.password.focus();
        super.show();
    }

    protected async onFormSubmit(ev: SubmitEvent): Promise<void> {
        ev.preventDefault();

        const account = this.sharedData.account;
        const password = this._dom.password.value;

        await this.login(account, password);
    }

    protected async login(account: string, password: string) {
        if (!account || !password) {
            return;
        }

        const msg = await UserServices.login(account, password);
        switch (msg.type) {
            case MessageTypeList.INVALID_DATA:
                alert('帳號和密碼的長度須在1~64之間');
                return;
            case MessageTypeList.ACCOUNT_OR_PASSWORD_ERROR:
                alert('帳號或密碼錯誤');
                return;
            case MessageTypeList.INVALID_OPERATION:
                alert('您已禁止密碼登入');
                this.emitter.emit(PasswordFlowEventList.CANCEL_PASSWORD_LOGIN);
                return;
            case MessageTypeList.HAS_LOGGED_IN:
                alert('您已登入此帳號');
                this.emitter.emit(PasswordFlowEventList.HAS_LOGGED_IN);
                return;
            case MessageTypeList.SUCCESS:
                this.emitter.emit(PasswordFlowEventList.PASSWORD_LOGIN_SUCCESS, msg.data);
                break;
            default:
                msg.data && console.error(msg.data);
                alert('出現未知的錯誤，請再試一次');
                return;
        }
    }

    protected onCancelButtonClick(ev: MouseEvent): void {
        ev.preventDefault();
        this.emitter.emit(PasswordFlowEventList.CANCEL_PASSWORD_LOGIN);
    }
}
