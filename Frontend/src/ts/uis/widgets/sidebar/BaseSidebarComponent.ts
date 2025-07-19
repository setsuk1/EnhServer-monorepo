import { BaseComponent, IComponentDom } from '../../base/BaseComponent.js';
import { Sidebar } from './Sidebar.js';
import { SidebarComponentEventList } from './SidebarComponentEventList.js';

export abstract class BaseSidebarComponent<D extends IComponentDom = IComponentDom> extends BaseComponent<D> {
	public readonly sidebar: Sidebar;

	constructor(sidebar: Sidebar, render = false) {
		super(false);
		this.sidebar = sidebar;
		this.emitter.on(SidebarComponentEventList.SIDEBAR_COLLAPSED, this.onSidebarCollapsed, this);

		if (render) {
			this.render();
		}
	}

	protected onSidebarCollapsed(): void {
		this._children.forEach(com => com.emitter.emit(SidebarComponentEventList.SIDEBAR_COLLAPSED));
	}
}
