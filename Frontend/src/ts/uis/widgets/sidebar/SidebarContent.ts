import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { IComponentDom } from '../../base/BaseComponent.js';
import { BaseSidebarComponent } from './BaseSidebarComponent.js';
import { SidebarMenu } from './SidebarMenu.js';

export interface ISidebarContentDom extends IComponentDom {
    root: HTMLDivElement;
}

export class SidebarContent extends BaseSidebarComponent<ISidebarContentDom> {
    protected createDomRoot(): void {
        this._dom.root = HtmlUtil.createElement(`
            <div class="sidebar-content"></div>
        `);
    }

    public addMenu(): SidebarMenu {
        const menu = new SidebarMenu(this.sidebar);
        this.append(menu, true);
        return menu;
    }
}
