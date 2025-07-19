import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { UrlUtil } from '../../../utils/UrlUtil.js';
import { IComponentDom } from '../../base/BaseComponent.js';
import { BaseFlowComponent } from '../../base/flow/BaseFlowComponent.js';
import { FlowSharedData } from '../../base/flow/FlowManager.js';

export interface ISuccessFlowDom extends IComponentDom {
    root: HTMLDivElement;
    title: HTMLSpanElement;
    nickname: HTMLSpanElement;
    seconds: HTMLSpanElement;
    link: HTMLAnchorElement;
}

export class SuccessFlow extends BaseFlowComponent<FlowSharedData, ISuccessFlowDom> {
    protected _title: string = '';
    protected _nickname: string = '';

    protected redirectTime: number;
    protected redirectUrl: string;

    public get title(): string {
        return this._title;
    }
    public set title(value: string) {
        this._title = value + '';
        this._dom.title.textContent = this._title;
    }

    public get nickname(): string {
        return this._nickname;
    }
    public set nickname(value: string) {
        this._nickname = value + '';
        this._dom.nickname.textContent = this._nickname;
    }

    protected get remainSeconds(): number {
        return Math.max(0, (this.redirectTime - performance.now()) / 1000);
    }

    public createDomRoot(): void {
        Object.assign(this._dom, HtmlUtil.createDom(`
            <div class="login-success">
                <span class="title" data-enh-label="title">${this._title}</span>
                <hr>
                <span class="flex-no-gap flex-center">
                    <span class="user-nickname" data-enh-label="nickname">${this._nickname}</span>
                    <span>，Welcome to EnhServer !</span>
                    <span>只要再撐</span>
                    <span class="redirect-seconds" data-enh-label="seconds"></span>
                    <span>秒就能Switch到</span>
                    <a class="redirect-name" href="/" data-enh-label="link"></a>
                    <span>了。</span>
                </span>
            </div>
        `));

        this.setupListenerForAllAnchor();
    }

    public async start(title: string, nickname: string): Promise<void> {
        this.title = title;
        this.nickname = nickname;
        this.setRedirect();
        try {
            const success = await this.redirectAfter();
            if (!success) {
                throw new Error('redirect failed');
            }
        } catch (err) {
            console.error(err);
            UrlUtil.redirectBase('/');
        }
    }

    public setRedirect(url: string = UrlUtil.locationSearch.get('redirect_url'), displayName: string = UrlUtil.locationSearch.get('redirect_name')) {
        if (!url || !displayName) {
            url = '/';
            displayName = '首頁';
        } else {
            url += '';
            displayName += '';
        }

        this.redirectUrl = url;

        this._dom.link.textContent = displayName;
        this._dom.link.href = url;
    }

    public async redirectAfter(ms = 10000): Promise<boolean> {
        this.redirectTime = performance.now() + ms;

        await new Promise<void>(resolve => this.updateRemainSeconds(resolve));

        return UrlUtil.redirectBase(this.redirectUrl);
    }

    protected updateRemainSeconds(callback: () => void): void {
        const remainSeconds = this.remainSeconds;

        const redirectSecondsDom = this._dom.root.querySelector('.redirect-seconds');
        redirectSecondsDom.textContent = remainSeconds.toFixed(1);

        if (remainSeconds > 0) {
            requestAnimationFrame(this.updateRemainSeconds.bind(this, callback));
        } else {
            callback?.();
        }
    }
}
