import { getURLSearchParams, htmlToFragment, redirect, safeFetch, wait } from './function.js';
import { Message } from './Message.js';
import { MultiSectionPage } from './MultiSectionPage.js';
import { reqRegOpts, verifyRegOpts } from './passkey.js';

export class RegisterPage extends MultiSectionPage {
    /**
     * 
     * @param {HTMLDivElement} view 
     */
    constructor(view) {
        super();
        this.view = view;
    }

    initialize(removeOrigin = true) {
        if (!this.view) {
            return;
        }

        const ori = this.clearSectionList();
        removeOrigin && ori.forEach(sec => sec.remove());

        this.generateAccSec();
        this.generatePskSec();
        this.generateSucSec();
    }

    generateAccSec() {
        const accSec = htmlToFragment(`
            <div>
                <h2>註冊</h2>
                <hr>
                <form target="">
                    <input type="text" placeholder="Account" name="username" autocomplete="username" required>
                    <input type="password" placeholder="Password" required>
                    <button class="full">下一步</button>
                </form>
            </div>
        `).firstElementChild;
        const accSecForm = accSec.querySelector('form');
        const [accSecAcc, accSecPwd] = accSec.querySelectorAll('input');
        const accSecNext = accSec.querySelector('button');

        accSecForm.addEventListener('submit', ev => ev.preventDefault());

        accSecNext.addEventListener('click', () => this.onAccSecNextClick());

        this.accSec = accSec;
        this.accSecAcc = accSecAcc;
        this.accSecPwd = accSecPwd;

        this.view.append(accSec);

        this.addSection(accSec);
    }

    generatePskSec() {
        const pskSec = htmlToFragment(`
            <div>
                <h2>是否註冊密碼金鑰</h2>
                <hr>
                <br>
                <div class="row">
                    <button class="left">略過</button>
                    <button class="right">同意</button>
                </div>
            </div>
        `).firstElementChild;
        const [pskSecSkip, pskSecOk] = pskSec.querySelectorAll('button');

        pskSecSkip.addEventListener('click', () => this.registerSuccess());

        pskSecOk.addEventListener('click', () => this.onPskSecOkClick());

        this.pskSec = pskSec;

        this.view.append(pskSec);

        this.addSection(pskSec);
    }

    generateSucSec() {
        const sucSec = htmlToFragment(`
            <div>
                <span class="bold large-text">註冊完成</span>
                <hr>
                <div></div>
            </div>
        `).firstElementChild;
        const sucSecHint = sucSec.querySelector('div');

        this.sucSec = sucSec;
        this.sucSecHint = sucSecHint;

        this.view.appendChild(sucSec);

        this.addSection(sucSec);
    }

    async onAccSecNextClick() {
        const account = this.accSecAcc.value;
        const password = this.accSecPwd.value;
        if (!account || !password) {
            return;
        }

        const body = {
            acc: account,
            pwd: password
        };

        const msg = await safeFetch("api/register", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
            credentials: "include"
        });

        switch (msg.type) {
            case Message.TYPE.NETWORK_ERROR:
                alert('無法連接到伺服器');
                return;
            case Message.TYPE.INVALID_DATA:
                alert('無效的登入資料');
                return;
            case Message.TYPE.ACCOUNT_ALREADY_EXISTS:
                alert('此帳號已經存在');
                return;
            case Message.TYPE.SUCCESS:
                this.showSection(this.pskSec);
                break;
            default:
                msg.data && console.error(msg.data);
                alert('出現未知的錯誤，請再試一次');
                return;
        }
    }

    async onPskSecOkClick() {
        const optsMsg = await reqRegOpts();

        switch (optsMsg.type) {
            case Message.TYPE.NETWORK_ERROR:
                alert('無法連接到伺服器');
                return;
            case Message.TYPE.HAS_NOT_LOGGED_IN:
                alert('您目前非登入狀態，無法註冊密碼金鑰');
                return;
            case Message.TYPE.REGISTER_PASSKEY_OPTIONS:
                break;
            default:
                optsMsg.data && console.error(optsMsg.data);
                alert('出現未知的錯誤，請再試一次');
                return;
        }

        const verifyMsg = await verifyRegOpts(optsMsg.data);

        switch (verifyMsg.type) {
            case Message.TYPE.PASSKEY_AUTHENTICATOR_ALREADY_REGISTERED:
                alert('您的身分驗證器可能已經註冊了密碼金鑰');
                return;
            case Message.TYPE.NETWORK_ERROR:
                alert('無法連接到伺服器');
                return;
            case Message.TYPE.INVALID_STATE:
                alert('註冊密碼金鑰的過程中，受到了一些干擾，請再試一次');
                return;
            case Message.TYPE.PASSKEY_REGISTERATION_VERIFY_FAILED:
                alert('密碼金鑰驗證失敗，請再試一次');
                return;
            case Message.TYPE.SUCCESS:
                this.registerSuccess();
                break;
            default:
                verifyMsg.data && console.error(verifyMsg.data);
                alert('出現未知的錯誤，請再試一次');
                return;
        }
    }

    async registerSuccess() {
        let redirectName = urlParams.get('redirect_name');
        let redirectURL = urlParams.get('redirect_url');
        let redirectWithParams = urlParams.has('redirect_with_params', 'true') ? urlParams : undefined;
        if (!redirectName || !redirectURL) {
            redirectName = '首頁';
            redirectURL = '/';
        }

        this.sucSecHint.innerHTML = `您已註冊成功，稍後會將您導向到${redirectName}。`;
        this.showSection(this.sucSec);
        await wait(200);
        redirect(redirectURL, redirectWithParams);
    }
}

const urlParams = getURLSearchParams();
const registerPage = new RegisterPage(document.querySelector('.login-container'));

registerPage.initialize();
registerPage.showSection(registerPage.accSec);

system.on(System.EVENT.REDIRECT, (params) => {
    if (urlParams.has('redirect_with_params', 'true')) {
        urlParams.forEach((value, key) => {
            params.append(key, value);
        });
    }
});