import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { IComponentDom } from '../../base/BaseComponent.js';
import { BaseSidebarComponent } from './BaseSidebarComponent.js';
import { SidebarItem } from './SidebarItem.js';

export interface ISidebarSubMenuDom extends IComponentDom {
    root: HTMLUListElement;
}

export class SidebarSubMenu extends BaseSidebarComponent<ISidebarSubMenuDom> {
    protected createDomRoot(): void {
        this._dom.root = HtmlUtil.createElement(`
            <ul class="submenu"></ul>
        `);
    }

    public addItem(tag: string, text: string, icon: string = ''): SidebarItem {
        const item = new SidebarItem(tag, this.sidebar);
        this.append(item, true);
        item.text = text;
        item.icon = icon;
        return item;
    }
}
