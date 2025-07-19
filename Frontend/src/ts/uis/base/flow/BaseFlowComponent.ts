import { BaseComponent, IComponentDom } from '../BaseComponent.js';
import { FlowManager, FlowSharedData } from './FlowManager.js';

export class BaseFlowComponent<S extends FlowSharedData = FlowSharedData, D extends IComponentDom = IComponentDom> extends BaseComponent<D> {
    protected flowManager: FlowManager<S>;
    protected readonly sharedData: S;

    public readonly name: string;

    constructor(name: string, flowManager: FlowManager<S>, sharedData: S, render = false) {
        super(render);
        this.name = name;
        this.flowManager = flowManager;
        this.sharedData = sharedData;
    }

    public show(): Promise<void> | void {
        return super.show();
    };

    public hide(): Promise<void> | void {
        return super.hide();
    };
}
