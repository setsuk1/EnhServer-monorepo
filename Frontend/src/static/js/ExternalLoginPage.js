import { Account } from './Account.js';
import { getURLSearchParams, htmlToFragment, redirect, safeFetch } from './function.js';
import { Message } from './Message.js';
import { MultiSectionPage } from './MultiSectionPage.js';
import { System, system } from './System.js';

export class ExternalLoginPage extends MultiSectionPage {
    /**
     * @type {HTMLDivElement}
     */
    usrSec;

    /**
     * 
     * @param {HTMLDivElement} view 
     */
    constructor(view) {
        super();
        this.view = view;
    }

    initialize() {
        if (!this.view) {
            return;
        }

        this.clearSectionList().forEach(sec => sec.remove());

        this.generateUsrSec();

        this.updateUserButton();
    }

    generateUsrSec() {
        const usrSec = htmlToFragment(`
            <div>
                <div class="section">
                </div>

                <div class="section">
                    <button class="other-login-button">登入其他帳號</button>
                </div>

                <div class="section">
                    <button class="guest-login-button">以訪客登入</button>
                </div>
            </div>
        `).firstElementChild;
        const usrSecAccsec = usrSec.querySelector('.section');
        const [usrSecLogin, usrSecGuest] = usrSec.querySelectorAll('button');

        usrSecLogin.addEventListener('click', () => this.onUsrSecLoginClick());

        usrSecGuest.addEventListener('click', () => this.onUsrSecGuestClick());

        if (!isAllowGuest()) {
            usrSecGuest.classList.add('hidden');
        }

        this.usrSecAccsec = usrSecAccsec;
        this.usrSec = usrSec;

        this.view.append(usrSec);

        this.addSection(usrSec);
    }

    async updateUserButton() {
        const accounts = await Account.getAllAccount();
        if (!accounts.length) {
            this.onUsrSecLoginClick();
            return;
        }

        this.usrSecAccsec.innerHTML = '';

        accounts.forEach((account, index) => {
            const btn = htmlToFragment(`
                <button class="account-button">以${account.account}登入</button>
            `).firstElementChild;
            btn.addEventListener('click', () => this.onUsrSecAccountClick(index, account));
            this.usrSecAccsec.append(btn);
        });
    }

    get isAllowGuest() {
        return isAllowGuest();
    }

    onUsrSecLoginClick() {
        const targetParams = new URLSearchParams();
        targetParams.set('redirect_url', window.location.pathname);
        targetParams.set('redirect_name', '登入頁面');
        targetParams.set('redirect_with_params', 'true');
        redirect('login.html', targetParams);
    }

    /**
     * 
     * @param {number} id 
     * @param {string} account 
     */
    async onUsrSecAccountClick(id, account) {
        const msg = await safeFetch(`api/token/${id}`);

        switch (msg.type) {
            case Message.TYPE.NETWORK_ERROR:
                alert('無法連接到伺服器');
                return;
            case Message.TYPE.GENERIC_ERROR:
                alert('此頁面的資料已過期');
                await this.updateUserButton();
                return;
            case Message.TYPE.SUCCESS:
                sendToken(msg.data);
                break;
            default:
                msg.data && console.error(msg.data);
                alert('出現未知的錯誤，請再試一次');
                return;
        }
    }

    onUsrSecGuestClick() {
        if (!isAllowGuest()) {
            return;
        }

        sendToken('guest');
    }
}

function isAllowGuest() {
    return urlParams.has('allow_guest', 'true');
}

let send = false;
/**
 * 
 * @param {string} token 
 */
function sendToken(token) {
    if (send) {
        return false;
    }
    send = true;
    window.addEventListener('message', ev => {
        if (ev.origin.endsWith('gamelet.online') === false) {
            return;
        }
        ev.source.postMessage(new Message(Message.TYPE.SUCCESS, { token }).toArray(), ev.origin);
    });
}

const urlParams = getURLSearchParams();
const externalLoginPage = new ExternalLoginPage(document.querySelector('.login-container'));

externalLoginPage.initialize();
externalLoginPage.showSection(externalLoginPage.usrSec);

system.on(System.EVENT.REDIRECT, (params) => {
    if (urlParams.has('redirect_with_params', 'true')) {
        urlParams.forEach((value, key) => {
            params.append(key, value);
        });
    }
});