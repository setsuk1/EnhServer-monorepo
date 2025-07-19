import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { IComponentDom } from '../../base/BaseComponent.js';
import { BaseSidebarComponent } from './BaseSidebarComponent.js';
import { Sidebar } from './Sidebar.js';
import { SidebarComponentEventList } from './SidebarComponentEventList.js';
import { SidebarSubMenu } from './SidebarSubMenu.js';

export interface ISidebarItemDom extends IComponentDom {
	root: HTMLLIElement;
	header: HTMLDivElement;
	icon: HTMLElement;
	label: HTMLSpanElement;
	arrow: HTMLSpanElement;
}

export class SidebarItem extends BaseSidebarComponent<ISidebarItemDom> {
	protected _tag: string;

	protected _icon: string;
	protected _text: string;

	protected _menu: SidebarSubMenu;

	constructor(tag: string, sidebar: Sidebar, render = false) {
		super(sidebar, false);
		this._tag = tag;

		if (render) {
			this.render();
		}
	}

	public get tag(): string {
		return this._tag;
	}

	public get icon(): string {
		return this._icon;
	}
	public set icon(value: string) {
		this._icon = value + '';
		this._dom.icon.textContent = this._icon;
	}

	public get text(): string {
		return this._text;
	}
	public set text(value: string) {
		this._text = value + '';
		this._dom.label.textContent = this._text;
	}

	protected createDomRoot(): void {
		Object.assign(this._dom, HtmlUtil.createDom(`
			<li class="menu-item">
				<div class="menu-item-header" data-enh-label="header">
					<span class="material-icons icon" data-enh-label="icon"></span>
					<span class="label" data-enh-label="label"></span>
					<span class="arrow hidden" data-enh-label="arrow">▼</span>
				</div>
			</li>
		`));

		this._dom.header.addEventListener('click', this.onHeaderClick.bind(this));
	}

	protected onHeaderClick(): void {
		this.sidebar.content.emitter.emit(SidebarComponentEventList.MENU_ITEM_CLICK, this._tag);

		if (this.sidebar.collapsed) {
			return;
		}

		this.setExpand();
	}

	public setExpand(value = undefined): void {
		if (this._menu) {
			this._dom.root.classList.toggle('expanded', value);
		}
	}

	protected onSidebarCollapsed(): void {
		super.onSidebarCollapsed();
		this.setExpand(false);
	}

	public updateArrowStatus(): void {
		this._dom.arrow.classList.toggle('hidden', this._children.size === 0);
	}

	public toSubMenu(): SidebarSubMenu {
		if (!this._menu) {
			this._menu = new SidebarSubMenu(this.sidebar);
		}
		this.append(this._menu, true);
		this.updateArrowStatus();
		return this._menu;
	}
}
