import { userManager } from '../../../messages/managers/UserManager.js';
import { MessageTypeList } from '../../../messages/MessageTypeList.js';
import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { RandomUtil } from '../../../utils/RandomUtil.js';
import { TypeUtil } from '../../../utils/TypeUtil.js';
import { IComponentDom } from '../../base/BaseComponent.js';
import { BaseFlowComponent } from '../../base/flow/BaseFlowComponent.js';
import { FlowSharedData } from '../../base/flow/FlowManager.js';
import { PasskeyFlow } from '../register/PasskeyFlow.js';
import { PasskeyFlowEventList } from '../register/PasskeyFlowEventList.js';
import { PasskeyTable } from './PasskeyTable.js';

export interface IAccountRelatedFlowDom extends IComponentDom {
    root: HTMLDivElement;
    nickname: HTMLInputElement;
    editNickname: HTMLButtonElement;
    passwordWrapper: HTMLDivElement;
    password: HTMLInputElement;
    editPassword: HTMLButtonElement;
    allowPassword: HTMLInputElement;
    addPasskey: HTMLButtonElement;
}

export class AccountRelatedFlow extends BaseFlowComponent<FlowSharedData, IAccountRelatedFlowDom> {
    protected _passkeyTable: PasskeyTable;

    protected createDomRoot(): void {
        Object.assign(this._dom, HtmlUtil.createDom(`
            <div class="account-related flow">
                <div class="information">
                    <span class="text-title">個人資料</span>
                    <div class="padding-2">
                        <div class="normal-input-wrapper">
                            <div class="input-block">
                                <div class="input-title">顯示名稱</div>
                                <input type="text" class="text-input" readonly data-enh-label="nickname">
                            </div>
                            <button class="edit-button" data-enh-label="editNickname">編輯</button>
                        </div>
                        <div class="normal-input-wrapper disabled" data-enh-label="passwordWrapper">
                            <div class="input-block">
                                <div class="input-title">密碼</div>
                                <input type="password" class="text-input" readonly data-enh-label="password">
                            </div>
                            <button class="edit-button" data-enh-label="editPassword">編輯</button>
                        </div>
                    </div>
                </div>
                <div class="security">
                    <span class="text-title">安全設定</span>
                    <div class="padding-2">
                        <label>
                            <input type="checkbox" checked data-enh-label="allowPassword">
                            允許使用密碼登入
                        </label>
                    </div>
                </div>
                <div class="passkey">
                    <span class="text-title">Passkey設定</span>
                    <div class="padding-2">
                        <button class="margin-bottom-1" data-enh-label="addPasskey">新增Passkey</button>
                    </div>
                </div>
            </div>
        `));

        this._passkeyTable = new PasskeyTable(true);
        this._dom.addPasskey.parentElement.append(this._passkeyTable.dom.root);

        this._dom.editNickname.addEventListener('click', this.onEditNicknameClick.bind(this));
        this._dom.editPassword.addEventListener('click', this.onEditPasswordClick.bind(this));
        this._dom.allowPassword.addEventListener('change', this.onAllowPasswordChange.bind(this));
        this._dom.addPasskey.addEventListener('click', this.onAddPasskeyClick.bind(this));

        this.updateNickname();
        this.setPassword('');
        this.updateAllowPassword();
    }

    public async updateNickname(): Promise<void> {
        const user = await userManager.getCurrentUser();
        this.setNickname(user.nickname);
    }

    public setNickname(nickname: string): void {
        this._dom.nickname.value = nickname + '';
    }

    public async updateAllowPassword(): Promise<void> {
        const user = await userManager.getCurrentUser();
        this.setAllowPassword(user.allowPassword);
    }

    public setAllowPassword(value: boolean): void {
        value = !!value;
        this._dom.passwordWrapper.classList.toggle('disabled', !value);
        this._dom.allowPassword.checked = value;
    }

    public setPassword(password: string): void {
        this._dom.password.value = RandomUtil.randomString(RandomUtil.randomInt(15, 56));
    }

    protected async onEditNicknameClick(): Promise<void> {
        const user = await userManager.getCurrentUser();
        const nickname = prompt(`請輸入使用者[${user.nickname}]的新名稱：`, user.nickname);
        if (nickname === null) {
            return;
        }
        if (!TypeUtil.isTextAllowedMax(nickname)) {
            alert('使用者的名稱長度必須在1~64之間');
            return;
        }

        const msg = await userManager.updateNickname(user.index, nickname);
        switch (msg.type) {
            case MessageTypeList.NETWORK_ERROR:
                alert('無法連接到伺服器');
                return;
            case MessageTypeList.HAS_NOT_LOGGED_IN:
                alert('此帳號尚未登入');
                return;
            case MessageTypeList.INVALID_DATA:
                alert('使用者的名稱長度必須在1~64之間');
                return;
            case MessageTypeList.SUCCESS:
                break;
            default:
                msg.data && console.error(msg.data);
                alert('出現未知的錯誤，請再試一次');
                return;
        }

        this.setNickname(user.nickname);
    }

    protected async onEditPasswordClick(): Promise<void> {
        const user = await userManager.getCurrentUser();
        const oldPassword = prompt(`請輸入使用者[${user.nickname}]的舊密碼：`);
        if (oldPassword === null) {
            return;
        }
        const newPassword = prompt(`請輸入使用者[${user.nickname}]的新密碼：`);
        if (newPassword === null) {
            return;
        }
        const againPassword = prompt(`請確認使用者[${user.nickname}]的新密碼：`);
        if (againPassword === null) {
            return;
        }
        if (!TypeUtil.isTextAllowedMax(oldPassword) || !TypeUtil.isTextAllowedMax(newPassword) || !TypeUtil.isTextAllowedMax(againPassword)) {
            alert('使用者的密碼長度必須在1~64之間');
            return;
        }
        if (oldPassword === newPassword) {
            alert('輸入的新密碼與舊密碼相同');
            return;
        }
        if (newPassword !== againPassword) {
            alert('輸入的兩次新密碼不相同');
            return;
        }

        const msg = await userManager.updatePassword(user.index, oldPassword, newPassword);
        switch (msg.type) {
            case MessageTypeList.NETWORK_ERROR:
                alert('無法連接到伺服器');
                return;
            case MessageTypeList.HAS_NOT_LOGGED_IN:
                alert('此帳號尚未登入');
                return;
            case MessageTypeList.INVALID_OPERATION:
                alert('無效的操作');
                return;
            case MessageTypeList.INVALID_DATA:
                alert('使用者的密碼長度必須在1~64之間');
                return;
            case MessageTypeList.ACCOUNT_OR_PASSWORD_ERROR:
                alert('帳號或密碼錯誤');
                return;
            case MessageTypeList.SUCCESS:
                break;
            default:
                msg.data && console.error(msg.data);
                alert('出現未知的錯誤，請再試一次');
                return;
        }

        this.setPassword('');
    }

    protected async onAllowPasswordChange(): Promise<void> {
        const allow = await this.changeAllowPassword();
        this.setAllowPassword(allow);
    }

    protected async changeAllowPassword() {
        const user = await userManager.getCurrentUser();
        const checked = this._dom.allowPassword.checked;
        if (!confirm(`確定要${checked ? '啟用' : '取消'}使用者[${user.nickname}]的密碼登入嗎？`)) {
            return !checked;
        }

        let password: string;
        if (checked) {
            password = prompt(`請輸入使用者[${user.nickname}]的新密碼：`);

            const againPassword = prompt(`請確認使用者[${user.nickname}]的新密碼：`);
            if (!TypeUtil.isTextAllowedMax(password) || !TypeUtil.isTextAllowedMax(againPassword)) {
                alert('使用者的密碼長度必須在1~64之間');
                return !checked;
            }
            if (password !== againPassword) {
                alert('輸入的兩次新密碼不相同');
                return !checked;
            }
        } else {
            password = prompt(`請輸入使用者[${user.nickname}]的密碼：`);
            if (!TypeUtil.isTextAllowedMax(password)) {
                alert('使用者的密碼長度必須在1~64之間');
                return !checked;
            }
        }

        const msg = await userManager.updateAllowPassword(user.index, checked, password);
        switch (msg.type) {
            case MessageTypeList.NETWORK_ERROR:
                alert('無法連接到伺服器');
                return !checked;
            case MessageTypeList.HAS_NOT_LOGGED_IN:
                alert('此帳號尚未登入');
                return !checked;
            case MessageTypeList.INVALID_OPERATION:
                alert('無效的操作');
                return !checked;
            case MessageTypeList.INVALID_DATA:
                alert('使用者的密碼長度必須在1~64之間');
                return !checked;
            case MessageTypeList.REQUIRE_ONE_AUTH_METHOD:
                alert('帳號中至少要有一種登入方式');
                return !checked;
            case MessageTypeList.SUCCESS:
                break;
            default:
                msg.data && console.error(msg.data);
                alert('出現未知的錯誤，請再試一次');
                return !checked;
        }

        return user.allowPassword;
    }

    protected async onAddPasskeyClick(): Promise<void> {
        this.emitter.once(PasskeyFlowEventList.PASSKEY_REGISTER_SUCCESS, this.onPasskeyRegisterSuccess, this);
        const success: boolean = await PasskeyFlow.prototype['register'].bind(this)();
        if (!success) {
            this.emitter.off(PasskeyFlowEventList.PASSKEY_REGISTER_SUCCESS, this.onPasskeyRegisterSuccess, this);
            return;
        }
    }

    protected onPasskeyRegisterSuccess(): void {
        // Temporary implementation
        this._passkeyTable.updateAllPasskey();
    }
}