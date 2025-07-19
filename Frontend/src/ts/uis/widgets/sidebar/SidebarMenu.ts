import { SidebarSubMenu } from './SidebarSubMenu.js';

export class SidebarMenu extends SidebarSubMenu {
    protected createDomRoot(): void {
        super.createDomRoot();
        
        this._dom.root.classList.replace('submenu', 'menu');
    }
}
