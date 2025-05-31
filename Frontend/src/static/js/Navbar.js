import { getURLSearchParams, htmlToFragment, isChrome, redirect } from './function.js';

export class Navbar {
    /**
     * @type {HTMLDivElement}
     */
    title;

    /**
     * @type {HTMLDivElement}
     */
    links;

    /**
     * @type {HTMLDivElement}
     */
    opts;

    /**
     * @type {HTMLDivElement}
     */
    auth;

    /**
     * 
     * @param {HTMLDivElement} view 
     */
    constructor(view) {
        this.view = view;
    }

    initialize() {
        if (!this.view) {
            return;
        }

        this.generateTitle();
        this.generateLinks();
        this.generateOptions();
        this.generateAuth();

        this.setOptsShowMode();
    }

    generateTitle() {
        const title = htmlToFragment(`
            <div class="title">
                <h1>EnhServer</h1>
            </div>
        `).firstElementChild;

        this.getLogoSvg().then(html => {
            title.innerHTML = `
             ${html}
             <h1>EnhServer</h1>
            `;
            const logoSvg = title.querySelector('svg');

            logoSvg.addEventListener('click', () => redirect('/'));
        });

        this.title = title;

        this.view.append(title);
    }

    generateLinks() {
        const links = htmlToFragment(`
            <div class="nav-links">
                <a href="/">首頁</a>
                <a href="aboutUs.html">關於我們</a>
            </div>
        `).firstElementChild;

        this.links = links;

        this.view.append(links);
    }

    generateOptions() {
        const opts = htmlToFragment(`
            <div class="nav-options">
                <i class="material-icons"></i>
            </div>
        `).firstElementChild;
        const optsShow = opts.querySelector('i');

        optsShow.addEventListener('click', () => this.switchOptsShowMode());

        this.opts = opts;
        this.optsShow = optsShow;

        this.view.append(opts);
    }

    generateAuth() {
        const auth = htmlToFragment(`
            <div class="auth">
                <div class="auth-not">
                    <a href="register.html">註冊</a>
                    <a href="login.html">登入</a>
                </div>
                <div class="auth-suc hidden">
                    <span></span>
                </div>
                <div class="dropdown hidden">
                    <a href="">切換帳號</a>
                    <a href="settings.html">設定</a>
                    <a href="logout.html">登出</a>
                </div>
            </div>
        `).firstElementChild;
        const authNot = auth.querySelector('.auth-not');
        const authSuc = auth.querySelector('.auth-suc');
        const authSucName = authSuc.querySelector('span');
        const authDrop = auth.querySelector('.dropdown');
        const [authDropSwitchAcc, authDropSettings, authDropLogout] = authDrop.querySelectorAll('a');

        authSuc.addEventListener('click', () => this.switchAuthDropShowMode());

        this.auth = auth;
        this.authNot = authNot;
        this.authSuc = authSuc;
        this.authSucName = authSucName;
        this.authDrop = authDrop;
        this.authDropSwitchAcc = authDropSwitchAcc;

        this.view.append(auth);
    }

    async getLogoSvg() {
        const res = await (fetch(`static/img/1010111emoji-${isChrome() && 'smart' || 'rainbow'}.svg`));
        const html = await res.text();
        return html;
    }

    switchOptsShowMode() {
        this.setOptsShowMode(localStorage.getItem('showMode') !== 'true');
    }

    setOptsShowMode(black = localStorage.getItem('showMode') === 'true') {
        localStorage.setItem('showMode', !!black);
        this.optsShow.textContent = black && 'light_mode' || 'dark_mode';

        if (black) {
            document.body.classList.add('black');
        } else {
            document.body.classList.remove('black');
        }
    }

    /**
     * 
     * @param {string} name 
     */
    setAuthSucName(name = '') {
        this.authSucName.textContent = name + '';
    }

    showAuthSuc() {
        this.authNot.classList.add('hidden');
        this.authSuc.classList.remove('hidden');
    }

    switchAuthDropShowMode() {
        this.authDrop.classList.toggle('hidden');
    }

    hidden() {
        this.view.classList.add('hidden');
    }

    show() {
        this.view.classList.remove('hidden');
    }
}

const urlParams = getURLSearchParams();
const navbar = new Navbar(document.querySelector('.navbar'));

navbar.initialize();

if (urlParams.has('hide_navbar', 'true')) {
    navbar.hidden();
}