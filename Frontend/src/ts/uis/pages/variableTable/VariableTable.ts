import { userManager } from '../../../messages/managers/UserManager.js';
import { MessageTypeList } from '../../../messages/MessageTypeList.js';
import { VariableTableServices } from '../../../messages/services/VariableTableServices.js';
import { VariableTableInfoVo } from '../../../messages/vo/VaraibleTableInfoVo.js';
import { VariableTableEntryVo } from '../../../messages/vo/VariableTableEntryVo.js';
import { CodecUtil } from '../../../utils/CodecUtil.js';
import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { Table } from '../../widgets/Table.js';
import { VariableTableEventList } from './VariableTableEventList.js';

export class VariableTable extends Table {
    public static parse(value: Uint8Array): string {
        try {
            const text = CodecUtil.decoders.utf8.decode(value);
            return text;
        } catch (e) {
            console.error(e);
            try {
                return `[${value.join(', ')}]`;
            } catch {
                return 'Unable to parse the data.';
            }
        }
    }

    protected _info: VariableTableInfoVo;

    public readonly id: number;

    constructor(id: number, render = false) {
        super(false);

        this.id = +id;

        if (render) {
            this.render();
        }
    }

    public createDomRoot(): void {
        super.createDomRoot();

        this.title = '';
        this.headers = ['屬性名稱', '屬性數值', '']

        this.updateAllData();
    }

    public async updateAllData(): Promise<void> {
        await userManager.ready();
        const info = await VariableTableServices.fetchVariableTableInfo(userManager.currentUserIndex, this.id);
        if (!info) {
            this.emitter.emit(VariableTableEventList.PERMISSION_DENIED);
            return;
        }

        this.clearRows();

        this._info = info;
        this.title = info.nickname;

        const entrys = await VariableTableServices.fetchAllVariableTableEntry(userManager.currentUserIndex, this.id);
        entrys.forEach(entry => this.addEntry(entry));

        if (!info.isOwner) {
            this.setColumnDisplay(3, false);
        }
    }

    public addEntry(entry: VariableTableEntryVo): void {
        const actions = HtmlUtil.createElement(`
            <div class="action-btns"></div>
        `);
        const editBtn = HtmlUtil.createElement(`
            <button class="rename margin-0_5">編輯</button>
        `);
        const deleteBtn = HtmlUtil.createElement(`
            <button class="delete margin-0_5">刪除</button>
        `);

        actions.append(editBtn, deleteBtn);
        const tr = this.addRow(entry.key, VariableTable.parse(entry.value), actions);

        editBtn.addEventListener('click', this.onEditBtnClick.bind(this, entry, tr.querySelector('td:nth-child(2)')));
        deleteBtn.addEventListener('click', this.onDeleteBtnClick.bind(this, entry, tr));
    }

    protected async onEditBtnClick(entry: VariableTableEntryVo, valueDom: HTMLTableCellElement): Promise<void> {
        if (!this._info.isOwner) {
            return;
        }

        const value = prompt(`請輸入屬性[${entry.key}]的值：`);
        if (value === null) {
            return;
        }

        const msg = await VariableTableServices.changeVariableTableEntry(userManager.currentUserIndex, this.id, entry.id, value);
        switch (msg.type) {
            case MessageTypeList.NETWORK_ERROR:
                alert('無法連接到伺服器');
                return;
            case MessageTypeList.INVALID_DATA:
                alert('Key或Value不符合要求');
                return;
            case MessageTypeList.PERMISSION_DENIED:
                alert('你沒有資格編輯');
                return;
            case MessageTypeList.SUCCESS:
                break;
            default:
                msg.data && console.error(msg.data);
                alert('出現未知的錯誤，請再試一次');
                return;
        }

        const vo = await VariableTableServices.fetchVariableTableEntry(userManager.currentUserIndex, this.id, entry.id);
        if (!vo) {
            alert('出現未知問題');
            return;
        }

        entry.valueObject = vo.valueObject;
        valueDom.textContent = VariableTable.parse(entry.value);
    }

    protected async onDeleteBtnClick(entry: VariableTableEntryVo, rowDom: HTMLTableRowElement): Promise<void> {
        if (!this._info.isOwner || !confirm(`確定要刪除屬性[${entry.key}]嗎？`)) {
            return;
        }

        const msg = await VariableTableServices.deleteVariableTableEntry(userManager.currentUserIndex, this.id, entry.id);
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
    }
}
