import { AuthenticationResponseJSON } from '@simplewebauthn/browser';
import { SimpleWebAuthn } from '../../../libs/SimpleWebAuthn.js';
import { MessageTypeList } from '../../../messages/MessageTypeList.js';
import { PasskeyServices } from '../../../messages/services/PasskeyServices.js';
import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { BaseFlowComponent } from '../../base/flow/BaseFlowComponent.js';
import { IAccountFlowData } from './AccountFlow.js';
import { PasskeyFlowEventList } from './PasskeyFlowEventList.js';

export class PasskeyFlow extends BaseFlowComponent<IAccountFlowData> {
    public createDomRoot(): void {
        this._dom.root = HtmlUtil.createElement(`
            <div class="login-passkey">
                <span class="title">使用密碼金鑰登入</span>
                <hr>
                <div>您應該會看到密碼管理工具已跳出登入要求，若沒有出現可點選重試。</div>
                <br>
                <div class="row">
                    <button class="left">使用密碼<br>登入</button>
                    <button class="right">重試</button>
                </div>
            </div>
        `);

        const [passwordButtonDom, retryButtonDom] = Array.from(this._dom.root.querySelectorAll('button'));
        passwordButtonDom.addEventListener('click', this.onPasswordButtonClick.bind(this));
        retryButtonDom.addEventListener('click', this.onRetryButtonClick.bind(this));
    }

    protected onPasswordButtonClick(ev: MouseEvent): void {
        this.emitter.emit(PasskeyFlowEventList.USE_PASSWORD_LOGIN);
    }

    protected async onRetryButtonClick(ev: MouseEvent): Promise<void> {
        const account = this.sharedData.account;
        await this.login(account);
    }

    public async login(account: string): Promise<void> {
        if (!account.length) {
            return;
        }

        const optsMsg = await PasskeyServices.requestAuthenticationOptions(account);
        switch (optsMsg.type) {
            case MessageTypeList.NETWORK_ERROR:
                alert('無法連接到伺服器');
                return;
            case MessageTypeList.HAS_LOGGED_IN:
                alert('您已登入此帳號');
                this.emitter.emit(PasskeyFlowEventList.HAS_LOGGED_IN)
                return;
            case MessageTypeList.ACCOUNT_OR_PASSWORD_ERROR:
            case MessageTypeList.NO_PASSKEY_CRED:
                this.emitter.emit(PasskeyFlowEventList.USE_PASSWORD_LOGIN);
                return;
            case MessageTypeList.SUCCESS:
                this.emitter.emit(PasskeyFlowEventList.TRY_PASSKEY_LOGIN);
                break;
            default:
                optsMsg.data && console.error(optsMsg.data);
                alert('出現未知的錯誤，請再試一次');
                return;
        }

        let asseResp: AuthenticationResponseJSON;
        try {
            asseResp = await SimpleWebAuthn.startAuthentication({ optionsJSON: optsMsg.data });
        } catch (error) {
            return;
        }

        const verifyMsg = await PasskeyServices.verifyAuthenticationOptions(asseResp);
        switch (verifyMsg.type) {
            case MessageTypeList.NETWORK_ERROR:
                alert('無法連接到伺服器');
                return;
            case MessageTypeList.GENERIC_ERROR:
                alert('錯誤的憑證');
                return;
            case MessageTypeList.HAS_LOGGED_IN:
                alert('您已登入此帳號');
                this.emitter.emit(PasskeyFlowEventList.HAS_LOGGED_IN);
                return;
            case MessageTypeList.SUCCESS:
                this.emitter.emit(PasskeyFlowEventList.PASSKEY_LOGIN_SUCCESS, verifyMsg.data);
                break;
            default:
                verifyMsg.data && console.error(verifyMsg.data);
                alert('出現未知的錯誤，請再試一次');
                return;
        }
    }
}
