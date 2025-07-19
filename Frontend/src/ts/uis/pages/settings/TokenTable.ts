import { userManager } from '../../../messages/managers/UserManager.js';
import { MessageTypeList } from '../../../messages/MessageTypeList.js';
import { TokenServices } from '../../../messages/services/TokenServices.js';
import { TokenVo } from '../../../messages/vo/TokenVo.js';
import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { TypeUtil } from '../../../utils/TypeUtil.js';
import { Table } from '../../widgets/Table.js';

export class TokenTable extends Table {
    protected createDomRoot(): void {
        super.createDomRoot();

        this.title = 'Token';
        this.headers = ['ID', '名稱', ''];

        this.updateAllToken();
    }

    public async updateAllToken(): Promise<void> {
        await userManager.ready();
        const tokens = await TokenServices.fetchAllToken(userManager.currentUserIndex);
        this.clearRows();
        tokens.forEach(token => this.addToken(token));
    }

    public addToken(token: TokenVo): void {
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
        const tr = this.addRow(token.id + '', token.nickname, actions);

        renameBtn.addEventListener('click', this.onRenameBtnClick.bind(this, token, tr.querySelector('td:nth-child(2)')));
        deleteBtn.addEventListener('click', this.onDeleteBtnClick.bind(this, token, tr));
    }

    protected async onRenameBtnClick(token: TokenVo, nameDom: HTMLTableCellElement): Promise<void> {
        const nickname = prompt(`請輸入Token[${token.nickname}]的新名稱：`, token.nickname);
        if (nickname === null) {
            return;
        }
        if (!TypeUtil.isTextAllowedMax(nickname)) {
            alert('Token的名稱長度必須在1~64之間');
            return;
        }

        const msg = await TokenServices.renameToken(userManager.currentUserIndex, token.id, nickname);

        switch (msg.type) {
            case MessageTypeList.NETWORK_ERROR:
                alert('無法連接到伺服器');
                return;
            case MessageTypeList.INVALID_DATA:
                alert('Token的名稱長度必須在1~64之間');
                return;
            case MessageTypeList.SUCCESS:
                break;
            default:
                msg.data && console.error(msg.data);
                alert('出現未知的錯誤，請再試一次');
                return;
        }

        const vo = await TokenServices.fetchToken(userManager.currentUserIndex, token.id);
        if (!vo) {
            alert('出現未知問題');
            return;
        }

        token.valueObject = vo.valueObject;
        nameDom.textContent = token.nickname;
    }

    protected async onDeleteBtnClick(token: TokenVo, rowDom: HTMLTableRowElement): Promise<void> {
        if (!confirm(`確定要刪除Token[${token.nickname}]嗎？`)) {
            return;
        }

        const msg = await TokenServices.deleteToken(userManager.currentUserIndex, token.id);

        switch (msg.type) {
            case MessageTypeList.NETWORK_ERROR:
                alert('無法連接到伺服器');
                return;
            case MessageTypeList.SPECIFIC_ERROR:
                alert('該Token不存在，可能是頁面資料過舊所致');
                await this.updateAllToken();
                alert('已將頁面的資料更新至最新');
                return;
            case MessageTypeList.SUCCESS:
                break;
            default:
                msg.data && console.error(msg.data);
                console.log(msg)
                alert('出現未知的錯誤，請再試一次');
                return;
        }

        rowDom.remove();
    }
}
