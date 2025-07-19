import { userManager } from '../../../messages/managers/UserManager.js';
import { MessageTypeList } from '../../../messages/MessageTypeList.js';
import { PasskeyServices } from '../../../messages/services/PasskeyServices.js';
import { PasskeyVo } from '../../../messages/vo/PasskeyVo.js';
import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { TypeUtil } from '../../../utils/TypeUtil.js';
import { Table } from '../../widgets/Table.js';

export class PasskeyTable extends Table {
    protected createDomRoot(): void {
        super.createDomRoot();

        this.title = 'Passkey';
        this.headers = ['ID', '名稱', ''];

        this.updateAllPasskey();
    }

    public async updateAllPasskey(): Promise<void> {
        await userManager.ready();
        const passkeys = await PasskeyServices.fetchAllPasskey(userManager.currentUserIndex);
        this.clearRows();
        passkeys.forEach(passkey => this.addPasskey(passkey));
    }

    public addPasskey(passkey: PasskeyVo): void {
        const actions = HtmlUtil.createElement(`
            <div class="action-btns"></div>
        `);
        const renameBtn = HtmlUtil.createElement(`
            <button class="rename margin-0_5">更名</button>
        `);
        const deleteBtn = HtmlUtil.createElement(`
            <button class="delete margin-0_5">刪除</button>
        `);

        actions.append(renameBtn, deleteBtn);
        const tr = this.addRow(passkey.cred_id, passkey.nickname, actions);

        renameBtn.addEventListener('click', this.onRenameBtnClick.bind(this, passkey, tr.querySelector('td:nth-child(2)')));
        deleteBtn.addEventListener('click', this.onDeleteBtnClick.bind(this, passkey, tr));
    }

    protected async onRenameBtnClick(passkey: PasskeyVo, nameDom: HTMLTableCellElement): Promise<void> {
        const nickname = prompt(`請輸入Passkey[${passkey.nickname}]的新名稱：`, passkey.nickname);
        if (nickname === null) {
            return;
        }
        if (!TypeUtil.isTextAllowedMax(nickname)) {
            alert('Passkey的名稱長度必須在1~64之間');
            return;
        }

        const msg = await PasskeyServices.renamePasskey(userManager.currentUserIndex, passkey.id, nickname);

        switch (msg.type) {
            case MessageTypeList.NETWORK_ERROR:
                alert('無法連接到伺服器');
                return;
            case MessageTypeList.HAS_NOT_LOGGED_IN:
                alert('此帳號尚未登入');
                return;
            case MessageTypeList.INVALID_DATA:
                alert('Passkey的名稱長度必須在1~64之間');
                return;
            case MessageTypeList.SUCCESS:
                break;
            default:
                msg.data && console.error(msg.data);
                alert('出現未知的錯誤，請再試一次');
                return;
        }

        const vo = await PasskeyServices.fetchPasskey(userManager.currentUserIndex, passkey.id);
        if (!vo) {
            alert('出現未知問題');
            return;
        }

        passkey.valueObject = vo.valueObject;
        nameDom.textContent = passkey.nickname;
    }

    protected async onDeleteBtnClick(passkey: PasskeyVo, rowDom: HTMLTableRowElement): Promise<void> {
        if (!confirm(`確定要刪除Passkey[${passkey.nickname}]嗎？`)) {
            return;
        }

        const msg = await PasskeyServices.deletePasskey(userManager.currentUserIndex, passkey.id);

        switch (msg.type) {
            case MessageTypeList.NETWORK_ERROR:
                alert('無法連接到伺服器');
                return;
            case MessageTypeList.HAS_NOT_LOGGED_IN:
                alert('此帳號尚未登入');
                return;
            case MessageTypeList.NO_PASSKEY_CRED:
                alert('該Passkey不存在，可能是頁面資料過舊');
                await this.updateAllPasskey();
                alert('已更新頁面資料');
                return;
            case MessageTypeList.REQUIRE_ONE_AUTH_METHOD:
                alert('帳號中至少要有一種登入方式');
                return;
            case MessageTypeList.SUCCESS:
                break;
            default:
                msg.data && console.error(msg.data);
                alert('出現未知的錯誤，請再試一次');
                return;
        }

        rowDom.remove();
    }
}
