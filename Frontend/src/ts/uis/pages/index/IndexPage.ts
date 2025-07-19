import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { BaseComponent } from '../../base/BaseComponent.js';

export interface IIndexPageDom {
    root: HTMLDivElement;
}

export class IndexPage extends BaseComponent<IIndexPageDom> {
    public createDomRoot(): void {
        Object.assign(this._dom, HtmlUtil.createDom(`
            <div class="index-page">
                <div class="padding-2">
                    <div class="margin-bottom-1">如果要用前端或Socket以外的方式取得所建變數表的資料，可以到設定頁面創建Token，並透過Token存取</div>
                    <div class="margin-bottom-1">基本樣式如下：</div>
                    <div class="margin-bottom-1"><code>curl https://localhost:3001/api/variable-table -H "Authorization: Bearer &lt;token&gt;"</code></div>
                    <div class="margin-bottom-1">如果為自簽憑證，可加上<code>--insecure</code></div>
                    <div class="margin-bottom-1">如果要格式化輸出，可以加上<code> | python -m json.tool</code></div>
                </div>
            </div>
        `));
    }
}
