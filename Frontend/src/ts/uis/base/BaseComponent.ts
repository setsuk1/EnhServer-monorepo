import { Emitter } from '../../utils/emitter/Emitter.js';
import { UrlUtil } from '../../utils/UrlUtil.js';
import { ComponentEventList } from './ComponentEventList.js';

export interface IComponentSetting {
    name: string;
    tagName: string;
    className: string;
    children: BaseComponent[];
    cssDependencies: string[];
}

export interface IComponentDom {
    root: HTMLElement;
}

export class BaseComponent<D extends IComponentDom = IComponentDom, S extends IComponentSetting = IComponentSetting> {
    protected _children = new Set<BaseComponent>();

    protected readonly _dom = {} as D;

    public readonly emitter = new Emitter();

    constructor(render = false) {
        if (render) {
            this.render();
        }
    }

    public get children(): BaseComponent[] {
        return Array.from(this._children);
    }

    public get dom(): Readonly<D> {
        return this._dom;
    };

    public render(): void {
        if (!this._dom.root) {
            this.createDomRoot();
            this.emitter.emit(ComponentEventList.CREATE_DOM);
        }
        this.emitter.emit(ComponentEventList.RENDER);
    }

    protected createDomRoot(): void {
        this._dom.root = document.createElement('div');
    };

    public contains(component: BaseComponent): boolean {
        return this._children.has(component);
    }

    public append(component: BaseComponent, render = false): boolean {
        if (component instanceof BaseComponent === false) {
            return false;
        }

        this._children.add(component);

        if (render) {
            component.render();
        }
        if (component._dom.root) {
            this._dom.root.append(component._dom.root);
        }

        return true;
    }

    public removeChild(component: BaseComponent): boolean {
        if (component instanceof BaseComponent) {
            this.removeNode(component._dom.root);
        }

        return this._children.delete(component);
    }

    public removeNode(node: Node): boolean {
        if (node instanceof Node === false || !this._dom.root.contains(node)) {
            return false;
        }
        this._dom.root.removeChild(node);
        return true;
    }

    public show(): void {
        this._dom.root.classList.remove('hidden');
        this.emitter.emit(ComponentEventList.SHOW);
    }

    public hide(): void {
        this._dom.root.classList.add('hidden');
        this.emitter.emit(ComponentEventList.HIDE);
    }

    public remove(): void {
        this._dom.root.remove();
        this.emitter.emit(ComponentEventList.REMOVE);
    }

    protected setupListenerForAllAnchor(): void {
        this._dom.root.querySelectorAll('a').forEach(this.setupListenerForAnchor.bind(this))
    }

    protected setupListenerForAnchor(a: HTMLAnchorElement): void {
        if ('enhRedirect' in a.dataset === false) {
            a.addEventListener('click', this.onAnchorClick.bind(this, a));
            a.dataset['enhRedirect'] = 'true';
        }
    }

    protected onAnchorClick(a: HTMLAnchorElement, ev: MouseEvent) {
        ev.preventDefault();
        if (!a.dataset['enhButton'] && a.getAttribute('href') !== null) {
            UrlUtil.redirectBase(a.href);
        }
    }
}
