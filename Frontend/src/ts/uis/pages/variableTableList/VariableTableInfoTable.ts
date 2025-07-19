import { userManager } from '../../../messages/managers/UserManager.js';
import { MessageTypeList } from '../../../messages/MessageTypeList.js';
import { VariableTableServices } from '../../../messages/services/VariableTableServices.js';
import { VariableTableInfoVo } from '../../../messages/vo/VaraibleTableInfoVo.js';
import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { Table } from '../../widgets/Table.js';
import { VariableTableInfoTableEventList } from './VariableTableInfoTableEventList.js';

export class VariableTableInfoTable extends Table {
    public readonly onlyOwner: boolean;

    constructor(onlyOwner = false, render = false) {
        super(false);
        this.onlyOwner = !!onlyOwner;

        if (render) {
            this.render();
        }
    }

    protected createDomRoot(): void {
        super.createDomRoot();

        this.title = '變數表';
        this.headers = ['ID', '名稱', ''];

        this.updateAllVariableTableInfo();
    }

    public async updateAllVariableTableInfo(): Promise<void> {
        await userManager.ready();
        const infos = await (this.onlyOwner ? VariableTableServices.fetchMyUserAllVariableTableInfo(userManager.currentUserIndex) : VariableTableServices.fetchAllVariableTableInfo(userManager.currentUserIndex));
        this.clearRows();
        infos.forEach(info => this.addVariableTableInfo(info));
    }

    public addVariableTableInfo(info: VariableTableInfoVo): void {
        if (this.onlyOwner && !info.isOwner) {
            return;
        }

        const actions = HtmlUtil.createElement(`
            <div class="action-btns"></div>
        `);
        const gotoBtn = HtmlUtil.createElement(`
            <a class="margin-0_5 display-inline-block" href="variableTable.html?id=${info.id}">
                <button class="rename">前往</button>
            </a>
        `);

        actions.append(gotoBtn);

        const row = this.addRow(info.id + '', info.nickname, actions);

        this.setupListenerForAnchor(gotoBtn as HTMLAnchorElement);

        if (info.isOwner) {
            const deleteBtn = HtmlUtil.createElement(`
                <button class="delete margin-0_5">刪除</button>
            `);

            actions.append(deleteBtn);

            deleteBtn.addEventListener('click', this.onDeleteBtnClick.bind(this, info, row));
        }
    }

    protected async onDeleteBtnClick(info: VariableTableInfoVo, rowDom: HTMLTableRowElement): Promise<void> {
        if (!info.isOwner || !confirm(`確定要刪除變數表[${info.nickname}]嗎？`)) {
            return;
        }

        const msg = await VariableTableServices.deleteVariableTable(userManager.currentUserIndex, info.id);
        switch (msg.type) {
            case MessageTypeList.NETWORK_ERROR:
                alert('無法連接到伺服器');
                return;
            case MessageTypeList.PERMISSION_DENIED:
                alert('你沒有資格刪除');
                return;
            case MessageTypeList.SUCCESS:
                break;
            default:
                msg.data && console.error(msg.data);
                alert('出現未知的錯誤，請再試一次');
                return;
        }

        rowDom.remove();

        this.emitter.emit(VariableTableInfoTableEventList.DELETE_VARIABLE_TABLE_INFO, info.id);
    }

    public removeInfo(info: VariableTableInfoVo): void {
        this._dom.tbody.querySelectorAll('tr').forEach(rowDom => {
            const id = rowDom.querySelector('td');
            if (id.textContent !== info.id + '') {
                return;
            }
            rowDom.remove();
        });
    }
}
