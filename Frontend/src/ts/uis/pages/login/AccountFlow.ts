import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { TimeUtil } from '../../../utils/TimeUtil.js';
import { IComponentDom } from '../../base/BaseComponent.js';
import { BaseFlowComponent } from '../../base/flow/BaseFlowComponent.js';
import { FlowSharedData } from '../../base/flow/FlowManager.js';
import { AccountFlowEventList } from './AccountFlowEventList.js';

export interface IAccountFlowDom extends IComponentDom {
    root: HTMLDivElement;
    account: HTMLInputElement;
}

export interface IAccountFlowData extends FlowSharedData {
    account: string;
}

export class AccountFlow extends BaseFlowComponent<IAccountFlowData, IAccountFlowDom> {
    public createDomRoot(): void {
        Object.assign(this._dom, HtmlUtil.createDom(`
            <div class="login-account">
                <span class="title">Link Start</span>
                <hr>
                <form target="">
                    <input type="text" placeholder="Account" name="username" autocomplete="username" data-enh-label="account" required>
                    <input class="hidden" type="password">
                    <span class="flex-no-gap flex-center">
                        <span>沒有帳號嗎？可以前往</span>
                        <a href="register.html">此處</a>
                        <span>註冊</span>
                    </span>
                    <button class="full">下一步</button>
                </form>
            </div>
        `));

        const form = this._dom.root.querySelector('form');
        form.addEventListener('submit', this.onFormSubmit.bind(this));

        this.setupListenerForAllAnchor();
    }

    public show(): void {
        TimeUtil.wait().then(() => this._dom.account.focus());
        super.show();
    }

    protected async onFormSubmit(ev: SubmitEvent): Promise<void> {
        ev.preventDefault();

        const account = this._dom.account.value;
        this.sharedData.account = account;

        this.emitter.emit(AccountFlowEventList.NEXT_STEP, account);
    }
}
