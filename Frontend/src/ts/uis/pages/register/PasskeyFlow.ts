import { RegistrationResponseJSON } from '@simplewebauthn/browser';
import { SimpleWebAuthn } from '../../../libs/SimpleWebAuthn.js';
import { userManager } from '../../../messages/managers/UserManager.js';
import { MessageTypeList } from '../../../messages/MessageTypeList.js';
import { PasskeyServices } from '../../../messages/services/PasskeyServices.js';
import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { BaseFlowComponent } from '../../base/flow/BaseFlowComponent.js';
import { PasskeyFlowEventList } from './PasskeyFlowEventList.js';

export class PasskeyFlow extends BaseFlowComponent {
    public createDomRoot(): void {
        this._dom.root = HtmlUtil.createElement(`
            <div class="register-passkey">
                <span class="title">是否註冊密碼金鑰</span>
                <hr>
                <br>
                <div class="row">
                    <button class="left">略過</button>
                    <button class="right">同意</button>
                </div>
            </div>
        `);

        const [skipButtonDom, confirmButtonDom] = Array.from(this._dom.root.querySelectorAll('button'));
        skipButtonDom.addEventListener('click', this.onSkipButtonClick.bind(this));
        confirmButtonDom.addEventListener('click', this.register.bind(this));
    }

    protected onSkipButtonClick(ev: MouseEvent): void {
        this.emitter.emit(PasskeyFlowEventList.SKIP_REGISTER_PASSKEY);
    }

    protected async register(): Promise<boolean> {
        const userIndex = userManager.currentUserIndex;
        const optsMsg = await PasskeyServices.requestRegisterOptions(userIndex);
        switch (optsMsg.type) {
            case MessageTypeList.NETWORK_ERROR:
                alert('無法連接到伺服器');
                return false;
            case MessageTypeList.HAS_NOT_LOGGED_IN:
                alert('您目前非登入狀態，無法註冊密碼金鑰');
                return false;
            case MessageTypeList.REGISTER_PASSKEY_OPTIONS:
                break;
            default:
                optsMsg.data && console.error(optsMsg.data);
                alert('出現未知的錯誤，請再試一次');
                return false;
        }

        let attResp: RegistrationResponseJSON;
        try {
            attResp = await SimpleWebAuthn.startRegistration({ optionsJSON: optsMsg.data });
        } catch (err) {
            if (err.name === 'InvalidStateError') {
                alert('您的身分驗證器可能已經註冊了密碼金鑰');
                return false;
            }
            return false;
        }

        const verifyMsg = await PasskeyServices.verifyRegisterOptions(userIndex, attResp);
        switch (verifyMsg.type) {
            case MessageTypeList.NETWORK_ERROR:
                alert('無法連接到伺服器');
                return false;
            case MessageTypeList.INVALID_STATE:
                alert('註冊密碼金鑰的過程中，受到了一些干擾，請再試一次');
                return false;
            case MessageTypeList.PASSKEY_REGISTERATION_VERIFY_FAILED:
                alert('密碼金鑰驗證失敗，請再試一次');
                return false;
            case MessageTypeList.SUCCESS:
                this.emitter.emit(PasskeyFlowEventList.PASSKEY_REGISTER_SUCCESS, verifyMsg.data);
                break;
            default:
                verifyMsg.data && console.error(verifyMsg.data);
                alert('出現未知的錯誤，請再試一次');
                return false;
        }

        return true;
    }
}
