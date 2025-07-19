import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { IComponentDom } from '../../base/BaseComponent.js';
import { BaseFlowComponent } from '../../base/flow/BaseFlowComponent.js';
import { FlowSharedData } from '../../base/flow/FlowManager.js';
import { VariableTableInfoFlowEventList } from './VariableTableInfoFlowEventList.js';
import { VariableTableInfoTable } from './VariableTableInfoTable.js';
import { VariableTableInfoTableEventList } from './VariableTableInfoTableEventList.js';

export interface IAllVariableTableInfoFlowDom extends IComponentDom {
    root: HTMLDivElement;
}

export class AllVariableTableInfoFlow extends BaseFlowComponent<FlowSharedData, IAllVariableTableInfoFlowDom> {
    protected _infoTable: VariableTableInfoTable;

    public get infoTable(): VariableTableInfoTable {
        return this._infoTable;
    }

    protected createDomRoot(): void {
        Object.assign(this._dom, HtmlUtil.createDom(`
            <div class="all-variable-table flow">
            </div>
        `));

        this._infoTable = new VariableTableInfoTable();
        this.append(this._infoTable, true);

        this._infoTable.title = '變數表總表';

        this._infoTable.emitter.on(VariableTableInfoTableEventList.DELETE_VARIABLE_TABLE_INFO, this.onDeleteInfo, this);
    }

    protected onDeleteInfo(id: number): void {
        this.emitter.emit(VariableTableInfoFlowEventList.DELETE_VARIABLE_TABLE_INFO, id);
    }
}
