import { getURLSearchParams, htmlToFragment, redirect, safeFetch, wait } from './function.js';
import { Message } from './Message.js';
import { MultiSectionPage } from './MultiSectionPage.js';
import { reqAuthOpts, verifyAuthOpts } from './passkey.js';
import { System, system } from './System.js';

export class LoginPage extends MultiSectionPage {
    /**
     * @type {HTMLDivElement} 
     */
    accSec;

    /**
     * @type {HTMLDivElement} 
     */
    pwdSec;

    /**
     * @type {HTMLDivElement} 
     */
    pskSec;

    /**
     * @type {HTMLDivElement} 
     */
    sucSec;

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
        this.generatePwdSec();
        this.generatePskSec();
        this.generateSucSec();
    }

    generateAccSec() {
        const accSec = htmlToFragment(`
            <div>
                <span class="bold large-text">Link Start</span>
                <hr>
                <form target="">
                    <input type="text" placeholder="Account" name="username" autocomplete="username" required>
                    <input class="hidden" type="password">
                    <span>沒有帳號嗎？可以前往<a href="register.html">此處</a>註冊</span>
                    <button class="full">下一步</button>
                </form>
            </div>
        `).firstElementChild;
        const accSecForm = accSec.querySelector('form');
        const accSecInput = accSec.querySelector('input');
        const accSecLink = accSec.querySelector('a');
        const accSecNext = accSec.querySelector('button');

        accSecForm.addEventListener('submit', ev => ev.preventDefault());

        accSecLink.addEventListener('click', ev => {
            ev.preventDefault();
            redirect(accSecLink.href);
        });

        accSecNext.addEventListener('click', () => this.onAccSecNextClick());

        this.accSec = accSec;
        this.accSecInput = accSecInput;

        this.view.appendChild(accSec);

        this.addSection(accSec);
    }

    generatePwdSec() {
        const pwdSec = htmlToFragment(`
            <div>
                <span class="bold large-text">使用密碼登入</span>
                <hr>
                <form target="">
                    <input type="password" placeholder="Password" required>
                    <br>
                    <div class="row">
                        <button class="left">取消</button>
                        <button class="right">登入</button>
                    </div>
                </form>
            </div>
        `).firstElementChild;
        const pwdSecForm = pwdSec.querySelector('form');
        const pwdSecInput = pwdSec.querySelector('input');
        const [pwdSecBtnrowCancel, pwdSecBtnrowOK] = pwdSec.querySelectorAll('button');

        pwdSecForm.addEventListener('submit', ev => ev.preventDefault());

        pwdSecBtnrowCancel.addEventListener('click', () => this.showSection(this.accSec));

        pwdSecBtnrowOK.addEventListener('click', () => this.onPwdSecBtnrowOKClick());

        this.pwdSec = pwdSec;
        this.pwdSecInput = pwdSecInput;

        this.view.appendChild(pwdSec);

        this.addSection(pwdSec);
    }

    generatePskSec() {
        const pskSec = htmlToFragment(`
            <div>
                <span class="bold large-text">使用密碼金鑰登入</span>
                <hr>
                <div>您應該會看到密碼管理工具已跳出登入要求，若沒有出現可點選重試。</div>
                <br>
                <div class="row">
                    <button class="left">使用密碼<br>登入</button>
                    <button class="right">重試</button>
                </div>
            </div>
        `).firstElementChild;
        const [pskSecBtnrowUsepwd, pskSecBtnrowRetry] = pskSec.querySelectorAll('button');

        pskSecBtnrowUsepwd.addEventListener('click', () => this.showSection(this.pwdSec));

        pskSecBtnrowRetry.addEventListener('click', () => this.onAccSecNextClick());

        this.pskSec = pskSec;

        this.view.appendChild(pskSec);

        this.addSection(pskSec);
    }

    generateSucSec() {
        const sucSec = htmlToFragment(`
            <div>
                <span class="bold large-text">歡迎回來</span>
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
        const account = this.accSecInput.value;
        if (!account.length) {
            return;
        }

        const optsMsg = await reqAuthOpts(account);

        switch (optsMsg.type) {
            case Message.TYPE.NETWORK_ERROR:
                alert('無法連接到伺服器');
                return;
            case Message.TYPE.HAS_LOGGED_IN:
                alert('您已登入此帳號');
                this.accSecInput.value = '';
                this.pwdSecInput.value = '';
                return;
            case Message.TYPE.GENERIC_ERROR:
            case Message.TYPE.NO_PASSKEY_CRED:
                this.showSection(this.pwdSec);
                return;
            case Message.TYPE.SUCCESS:
                this.showSection(this.pskSec);
                break;
            default:
                optsMsg.data && console.error(optsMsg.data);
                alert('出現未知的錯誤，請再試一次');
                return;
        }

        const verifyMsg = await verifyAuthOpts(optsMsg.data);

        switch (verifyMsg.type) {
            case Message.TYPE.PASSKEY_LOGIN_START_AUTH_FAILED:
                return;
            case Message.TYPE.NETWORK_ERROR:
                alert('無法連接到伺服器');
                return;
            case Message.TYPE.GENERIC_ERROR:
                alert('錯誤的憑證');
                return;
            case Message.TYPE.HAS_LOGGED_IN:
                alert('您已登入此帳號');
                this.accSecInput.value = '';
                this.pwdSecInput.value = '';
                return;
            case Message.TYPE.SUCCESS:
                this.loginSuccess(account);
                break;
            default:
                verifyMsg.data && console.error(verifyMsg.data);
                alert('出現未知的錯誤，請再試一次');
                return;
        }
    }

    async onPwdSecBtnrowOKClick() {
        const account = this.accSecInput.value;
        const password = this.pwdSecInput.value;
        if (!account || !password) {
            return;
        }

        const body = {
            acc: account,
            pwd: password
        };

        const msg = await safeFetch(`api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
            mode: "cors"
        });

        switch (msg.type) {
            case Message.TYPE.INVALID_DATA:
                alert('無效的登入資料');
                return;
            case Message.TYPE.ACCOUNT_OR_PASSWORD_ERROR:
                alert('帳號或密碼錯誤');
                return;
            case Message.TYPE.HAS_LOGGED_IN:
                alert('您已登入此帳號');
                this.accSecInput.value = '';
                this.pwdSecInput.value = '';
                this.showSection(this.accSec);
                return;
            case Message.TYPE.SUCCESS:
                this.loginSuccess(account);
                break;
            default:
                msg.data && console.error(msg.data);
                alert('出現未知的錯誤，請再試一次');
                return;
        }
    }

    /**
     * 
     * @param {string} account 
     */
    async loginSuccess(account) {
        let redirectName = urlParams.get('redirect_name');
        let redirectURL = urlParams.get('redirect_url');
        if (!redirectName || !redirectURL) {
            redirectName = '首頁';
            redirectURL = '/';
        }

        this.sucSecHint.innerHTML = `您已成功登入${account}，稍後會將您導向到${redirectName}。`;
        this.showSection(this.sucSec);
        await wait(200);
        redirect(redirectURL);
    }
}

const urlParams = getURLSearchParams();
const loginPage = new LoginPage(document.querySelector('.login-container'));

loginPage.initialize();
loginPage.showSection(loginPage.accSec);

system.on(System.EVENT.REDIRECT, (params) => {
    if (urlParams.has('redirect_with_params', 'true')) {
        urlParams.forEach((value, key) => {
            params.append(key, value);
        });
    }
});