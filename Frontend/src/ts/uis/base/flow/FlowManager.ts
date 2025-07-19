import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { TypeUtil } from '../../../utils/TypeUtil.js';
import { BaseComponent, IComponentDom } from '../BaseComponent.js';
import { BaseFlowComponent } from './BaseFlowComponent.js';

export type FlowSharedData = {
    [key: string]: any;
};

export class FlowManager<S extends FlowSharedData = FlowSharedData, D extends IComponentDom = IComponentDom> extends BaseComponent<D> {
    protected classNames: string[];
    protected flowMap = new Map<string, BaseFlowComponent>();
    protected currentFlowName: string;

    protected readonly sharedData: S;

    constructor(className = '', sharedData?: S, render = false) {
        super(render);
        if (typeof className === 'string') {
            this.classNames = className.trim().split(' ').filter(c => c)
        } else {
            this.classNames = [];
        }

        if (this._dom.root && this.classNames.length) {
            this._dom.root.classList.add(...this.classNames);
        }
        this.sharedData = TypeUtil.isPrimitive(sharedData) && {} as S || sharedData;
    }

    public get currentFlow(): BaseFlowComponent {
        return this.flowMap.get(this.currentFlowName);
    }

    public createDomRoot(): void {
        this._dom.root = HtmlUtil.createElement(`
            <div${this.classNames.length ? ` class="${this.classNames.join(' ')}"` : ''}></div>
        `);
    }

    public hasFlow(name: string): boolean {
        return this.flowMap.has(name);
    }

    public createFlow<C extends new (name: string, flowManager: FlowManager<F>, sharedData: F, render?: boolean, ...args: any[]) => BaseFlowComponent<F>, F extends FlowSharedData>(this: FlowManager<S & F>, name: string, flowClass: C, render = false, ...args: any[]) {
        return new flowClass(name, this, this.sharedData, render, ...args);
    }

    public addFlow<F extends FlowSharedData>(this: FlowManager<S & F>, flow: BaseFlowComponent<F>): boolean {
        if (this.flowMap.has(flow.name)) {
            console.error(`Flow "${flow.name}" has already been added.`);
            return false;
        }
        this.flowMap.set(flow.name, flow);
        return true;
    }

    public removeFlow(name: string): boolean {
        if (!this.flowMap.has(name)) {
            console.error(`Flow "${name}" does not exist.`);
            return false;
        }
        return this.flowMap.delete(name);
    }

    public async showFlow(name: string): Promise<boolean> {
        const flow = this.flowMap.get(name);
        if (!flow) {
            console.error(`Flow "${name}" not found.`);
            return false;
        }

        const prevFlow = this.currentFlow;
        if (prevFlow) {
            await prevFlow.hide();
        }

        this.append(flow, true);

        this.currentFlowName = name;
        await flow.show();

        return true;
    }
}
