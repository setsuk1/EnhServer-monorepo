import { userManager } from '../../../messages/managers/UserManager.js';
import { MessageTypeList } from '../../../messages/MessageTypeList.js';
import { VariableTableServices } from '../../../messages/services/VariableTableServices.js';
import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { IComponentDom } from '../../base/BaseComponent.js';
import { BaseFlowComponent } from '../../base/flow/BaseFlowComponent.js';
import { FlowSharedData } from '../../base/flow/FlowManager.js';
import { VariableTableInfoFlowEventList } from './VariableTableInfoFlowEventList.js';
import { VariableTableInfoTable } from './VariableTableInfoTable.js';
import { VariableTableInfoTableEventList } from './VariableTableInfoTableEventList.js';

export interface IMyVariableTableInfoFlowDom extends IComponentDom {
    root: HTMLDivElement;
    addVariableTable: HTMLButtonElement;
}

export class MyVariableTableInfoFlow extends BaseFlowComponent<FlowSharedData, IMyVariableTableInfoFlowDom> {
    protected _infoTable: VariableTableInfoTable;

    public get infoTable(): VariableTableInfoTable {
        return this._infoTable;
    }

    protected createDomRoot(): void {
        Object.assign(this._dom, HtmlUtil.createDom(`
            <div class="my-variable-table flow">
                <button data-enh-label="addVariableTable">新增變數表</button>
            </div>
        `));

        this._infoTable = new VariableTableInfoTable(true);
        this.append(this._infoTable, true);

        this._infoTable.title = '我的變數表';

        this._dom.addVariableTable.addEventListener('click', this.onAddVariableTableClick.bind(this));
        this._infoTable.emitter.on(VariableTableInfoTableEventList.DELETE_VARIABLE_TABLE_INFO, this.onDeleteInfo, this);
    }

    protected async onAddVariableTableClick(): Promise<void> {
        const msg = await VariableTableServices.createVariableTable(userManager.currentUserIndex);

        switch (msg.type) {
            case MessageTypeList.NETWORK_ERROR:
                alert('無法連接到伺服器');
                return;
            case MessageTypeList.SUCCESS:
                break;
            default:
                msg.data && console.error(msg.data);
                alert('出現未知的錯誤，請再試一次');
                return;
        }

        // Temporary implementation
        await this._infoTable.updateAllVariableTableInfo();

        this.emitter.emit(VariableTableInfoFlowEventList.UPDATE_ALL_VARIABLE_TABLE_INFO);
    }

    protected onDeleteInfo(id: number): void {
        this.emitter.emit(VariableTableInfoFlowEventList.DELETE_VARIABLE_TABLE_INFO, id);
    }
}
