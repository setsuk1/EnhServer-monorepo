import { userManager } from '../../../messages/managers/UserManager.js';
import { UserManagerEventList } from '../../../messages/managers/UserManagerEventList.js';
import { VariableTableInfoVo } from '../../../messages/vo/VaraibleTableInfoVo.js';
import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { BaseComponent } from '../../base/BaseComponent.js';
import { FlowManager } from '../../base/flow/FlowManager.js';
import { Sidebar } from '../../widgets/sidebar/Sidebar.js';
import { SidebarComponentEventList } from '../../widgets/sidebar/SidebarComponentEventList.js';
import { SidebarItem } from '../../widgets/sidebar/SidebarItem.js';
import { AllVariableTableInfoFlow } from './AllVariableTableInfoFlow.js';
import { MyVariableTableInfoFlow } from './MyVariableTableInfoFlow.js';
import { VariableTableInfoFlowEventList } from './VariableTableInfoFlowEventList.js';

export class VariableTableListPage extends BaseComponent {
    protected _sidebar: Sidebar;
    protected _flowManager: FlowManager;

    protected _allVariableTableInfoFlow: AllVariableTableInfoFlow;
    protected _myVariableTableInfoFlow: MyVariableTableInfoFlow;

    protected _myVariableTableMenu: SidebarItem;

    public createDomRoot(): void {
        this._dom.root = HtmlUtil.createElement(`
            <div class="variable-table-list-page sidebar-page"></div>
        `);

        this._sidebar = new Sidebar();
        this.append(this._sidebar, true);

        this._flowManager = new FlowManager('container margin-0-auto');
        this._flowManager.render();

        const container = HtmlUtil.createElement(`<div class="content width-100"></div>`);
        container.append(this._flowManager.dom.root);

        this._dom.root.append(container);

        this._allVariableTableInfoFlow = this._flowManager.createFlow('all_variable_table', AllVariableTableInfoFlow) as AllVariableTableInfoFlow;
        this._myVariableTableInfoFlow = this._flowManager.createFlow('my_variable_table', MyVariableTableInfoFlow) as MyVariableTableInfoFlow;

        this._flowManager.addFlow(this._allVariableTableInfoFlow);
        this._flowManager.addFlow(this._myVariableTableInfoFlow);

        this._flowManager.showFlow(this._allVariableTableInfoFlow.name);

        const menu = this._sidebar.content.addMenu();
        menu.addItem(this._allVariableTableInfoFlow.name, '瀏覽變數表', 'menu');

        this._myVariableTableMenu = menu.addItem(this._myVariableTableInfoFlow.name, '我的變數表', 'account_circle');
        this._myVariableTableMenu.hide();

        this._sidebar.content.emitter.on(SidebarComponentEventList.MENU_ITEM_CLICK, this.onSidebarMenuItemClick, this);
        this._allVariableTableInfoFlow.emitter.on(VariableTableInfoFlowEventList.DELETE_VARIABLE_TABLE_INFO, this.onAllDeleteInfo, this);
        this._myVariableTableInfoFlow.emitter.on(VariableTableInfoFlowEventList.UPDATE_ALL_VARIABLE_TABLE_INFO, this.onMyVariableTableUpdate, this);
        this._myVariableTableInfoFlow.emitter.on(VariableTableInfoFlowEventList.DELETE_VARIABLE_TABLE_INFO, this.onMyDeleteInfo, this);

        // Temporary implementation
        userManager.emitter.on(UserManagerEventList.SWITCH_CURRENT_USER, location.reload, location);

        this.checkIsLoggedIn();
    }

    protected async checkIsLoggedIn(): Promise<void> {
        const user = await userManager.getCurrentUser();
        if (!user?.isLoggedIn) {
            return;
        }

        this._myVariableTableMenu.show();
    }

    protected onSidebarMenuItemClick(tag: string): void {
        this._flowManager.showFlow(tag);
    }

    protected onAllDeleteInfo(id: number) {
        const info = { id } as VariableTableInfoVo;
        this._myVariableTableInfoFlow.infoTable.removeInfo(info);
    }

    protected onMyVariableTableUpdate(): void {
        this._allVariableTableInfoFlow.infoTable.updateAllVariableTableInfo();
    }

    protected onMyDeleteInfo(id: number) {
        const info = { id } as VariableTableInfoVo;
        this._allVariableTableInfoFlow.infoTable.removeInfo(info);
    }
}
