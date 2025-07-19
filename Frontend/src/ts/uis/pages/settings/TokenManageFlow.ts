import { userManager } from '../../../messages/managers/UserManager.js';
import { MessageTypeList } from '../../../messages/MessageTypeList.js';
import { TokenServices } from '../../../messages/services/TokenServices.js';
import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { IComponentDom } from '../../base/BaseComponent.js';
import { BaseFlowComponent } from '../../base/flow/BaseFlowComponent.js';
import { FlowSharedData } from '../../base/flow/FlowManager.js';
import { TokenTable } from './TokenTable.js';

export interface ITokenManageFlowDom extends IComponentDom {
    root: HTMLDivElement;
    addGeneralToken: HTMLDivElement;
}

export class TokenManageFlow extends BaseFlowComponent<FlowSharedData, ITokenManageFlowDom> {
    protected _tokenTable: TokenTable;

    protected createDomRoot(): void {
        Object.assign(this._dom, HtmlUtil.createDom(`
            <div class="token-manage flow">
                <div class="information">
                    <span class="text-title">Token設定</span>
                    <div class="padding-2" data-enh-label="tokenSettings">
                        <button class="margin-bottom-1" data-enh-label="addGeneralToken">申請一般Token</button>
                    </div>
                </div>
            </div>
        `));

        this._tokenTable = new TokenTable(true);

        this._dom.addGeneralToken.parentElement.append(this._tokenTable.dom.root);

        this._dom.addGeneralToken.addEventListener('click', this.onaddGeneralTokenClick.bind(this));
    }

    protected async onaddGeneralTokenClick(): Promise<void> {
        const user = await userManager.getCurrentUser();
        const msg = await TokenServices.createToken(user.index, 2);
        switch (msg.type) {
            case MessageTypeList.HAS_NOT_LOGGED_IN:
                alert('當前帳號已登出');
                location.reload();
                return;
            case MessageTypeList.SUCCESS:
                break;
            default:
                msg.data && console.error(msg.data);
                alert('出現未知的錯誤，請再試一次');
                return;
        }

        const { id, string: token } = msg.data;
        copyToken(token);

        // Temporary implementation
        await this._tokenTable.updateAllToken();
    }
}

function copyToken(token: string, prefix = '') {
    if (prompt(`${prefix}該Token未來不會再顯示，請妥善保管！\n按下確認會自動複製，也可以自行複製後點擊取消\n\nToken:`, token) === null) {
        return;
    }
    navigator.clipboard.writeText(token)
        .catch(err => {
            copyToken(token, `自動複製失敗！\n\n${err}\n\n`);
        });
}
