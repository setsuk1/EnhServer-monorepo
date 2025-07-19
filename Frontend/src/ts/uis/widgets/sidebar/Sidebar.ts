import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { BaseComponent, IComponentDom } from '../../base/BaseComponent.js';
import { SidebarComponentEventList } from './SidebarComponentEventList.js';
import { SidebarContent } from './SidebarContent.js';

export interface ISidebarDom extends IComponentDom {
    root: HTMLUListElement;
    icon: HTMLSpanElement;
    toggle: HTMLButtonElement;
}

export class Sidebar extends BaseComponent<ISidebarDom> {
    protected _content: SidebarContent;

    public get content(): SidebarContent {
        return this._content;
    }

    public get collapsed(): boolean {
        return this._dom.root.classList.contains('collapsed');
    }

    protected createDomRoot(): void {
        Object.assign(this._dom, HtmlUtil.createDom(`
            <div class="sidebar">
                <div class="sidebar-header">
                    <span class="header-icon" data-enh-label="icon"></span>
                    <button class="sidebar-toggle" data-enh-label="toggle">←</button>
                </div>
            </div>
        `));

        this._content = new SidebarContent(this);

        this.append(this._content, true);

        this._dom.toggle.addEventListener('click', this.onToggleClick.bind(this));
    }

    protected onToggleClick(): void {
        if (this._dom.root.classList.toggle('collapsed')) {
            this._dom.toggle.textContent = '→';
            this._content.emitter.emit(SidebarComponentEventList.SIDEBAR_COLLAPSED);
        } else {
            this._dom.toggle.textContent = '←';
        }
    }
}
