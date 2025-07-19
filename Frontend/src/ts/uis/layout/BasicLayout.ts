import { HtmlUtil } from '../../utils/HtmlUtil.js';
import { BaseComponent, IComponentDom } from '../base/BaseComponent.js';
import { Footer } from '../widgets/Footer.js';
import { NavBar } from '../widgets/NavBar.js';

export interface IBasicLayoutDom extends IComponentDom {
    root: HTMLDivElement;
    navBar: HTMLElement;
    page: HTMLElement;
    footer: HTMLElement;
}

export class BasicLayout<P extends BaseComponent<IComponentDom>, N extends BaseComponent<IComponentDom> = NavBar, F extends BaseComponent<IComponentDom> = Footer> extends BaseComponent<IBasicLayoutDom> {
    public readonly navBar: N;
    public readonly page: P;
    public readonly footer: F;

    constructor(
        page: P,
        navBar: N = new NavBar() as BaseComponent<IComponentDom> as N,
        footer: F = new Footer() as BaseComponent<IComponentDom> as F,
        render = false
    ) {
        super(false);

        this.navBar = navBar;
        this.page = page;
        this.footer = footer;

        if (render) {
            this.createDomRoot();
        }
    }

    public createDomRoot(): void {
        this._dom.root = HtmlUtil.createElement(`
            <div class="basic-layout"></div>
        `);

        this.append(this.navBar, true);
        this.append(this.page, true);
        this.append(this.footer, true)

        this._dom.navBar = this.navBar.dom.root;

        this._dom.page = this.page.dom.root;
        this._dom.page.classList.add('content');

        this._dom.footer = this.footer.dom.root;
    }
}
