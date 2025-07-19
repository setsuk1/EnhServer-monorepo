import { userManager } from '../../../messages/managers/UserManager.js';
import { UserManagerEventList } from '../../../messages/managers/UserManagerEventList.js';
import { MessageTypeList } from '../../../messages/MessageTypeList.js';
import { VariableTableServices } from '../../../messages/services/VariableTableServices.js';
import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { TypeUtil } from '../../../utils/TypeUtil.js';
import { UrlUtil } from '../../../utils/UrlUtil.js';
import { BaseComponent, IComponentDom } from '../../base/BaseComponent.js';
import { VariableTable } from './VariableTable.js';
import { VariableTableEventList } from './VariableTableEventList.js';

export interface IVariableTablePageDom extends IComponentDom {
    root: HTMLDivElement;
    btns: HTMLDivElement;
    rename: HTMLButtonElement;
    addEntry: HTMLButtonElement;
}

export class VariableTablePage extends BaseComponent<IVariableTablePageDom> {
    protected _table: VariableTable;

    public readonly id: number;

    constructor(id?: number, render = false) {
        super(false);

        if (id == undefined) {
            id = UrlUtil.locationSearch.get('id') as any ?? undefined;
        }

        this.id = +id;

        if (render) {
            this.createDomRoot();
        }
    }

    public createDomRoot(): void {
        Object.assign(this._dom, HtmlUtil.createDom(`
            <div class="variable-table-page margin-0_5">
                <div class="margin-0-auto" data-enh-label="btns">
                    <button data-enh-label="rename">更改名稱</button>
                    <button data-enh-label="addEntry">增加屬性</button>
                </div>
            </div>
        `));

        this._table = new VariableTable(this.id);
        this.append(this._table, true);

        this._dom.rename.addEventListener('click', this.onRenameClick.bind(this));
        this._dom.addEntry.addEventListener('click', this.onAddEntryClick.bind(this));

        this._table.emitter.on(VariableTableEventList.PERMISSION_DENIED, this.onPermissionDenied, this);

        // Temporary implementation
        userManager.emitter.on(UserManagerEventList.SWITCH_CURRENT_USER, location.reload, location);
    }

    protected onPermissionDenied(): void {
        alert('你沒有資格查看');
        UrlUtil.redirectBase('variableTableList.html');
    }

    protected async onRenameClick(): Promise<void> {
        const nickname = prompt(`請輸入變數表[${this._table.title}]的新名稱：`, this._table.title);
        if (nickname === null) {
            return;
        }
        if (!TypeUtil.isTextAllowedMax(nickname)) {
            alert('變數表的名稱長度必須在1~64之間');
            return;
        }

        const msg = await VariableTableServices.renameVariableTable(userManager.currentUserIndex, this.id, nickname);
        switch (msg.type) {
            case MessageTypeList.NETWORK_ERROR:
                alert('無法連接到伺服器');
                return;
            case MessageTypeList.INVALID_DATA:
                alert('變數表的名稱長度必須在1~64之間');
                return;
            case MessageTypeList.PERMISSION_DENIED:
                alert('你沒有資格更改');
                return;
            case MessageTypeList.SUCCESS:
                break;
            default:
                msg.data && console.error(msg.data);
                alert('出現未知的錯誤，請再試一次');
                return;
        }

        this._table.title = nickname;
    }

    protected async onAddEntryClick(): Promise<void> {
        const key = prompt(`請輸入欲增加到變數表[${this._table.title}]的屬性名稱：`);
        if (key === null) {
            return;
        }
        const value = prompt(`請輸入屬性[${key}]的值：`);
        if (value === null) {
            return;
        }

        const msg = await VariableTableServices.createVariableTableEntry(userManager.currentUserIndex, this.id, key, value);

        switch (msg.type) {
            case MessageTypeList.NETWORK_ERROR:
                alert('無法連接到伺服器');
                return;
            case MessageTypeList.INVALID_DATA:
                alert('屬性值或屬性名稱不符合規定');
                return;
            case MessageTypeList.PERMISSION_DENIED:
                alert('你沒有資格增加');
                return;
            case MessageTypeList.SUCCESS:
                break;
            default:
                msg.data && console.error(msg.data);
                alert('出現未知的錯誤，請再試一次');
                return;
        }

        this._table.updateAllData();
    }
}
