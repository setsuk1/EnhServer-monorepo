import { userManager } from '../../messages/managers/UserManager.js';
import { UserManagerEventList } from '../../messages/managers/UserManagerEventList.js';
import { UserVo } from '../../messages/vo/UserVo.js';
import { showAboutUs } from '../../security/warnings.js';
import { FileUtil } from '../../utils/FileUtil.js';
import { HtmlUtil } from '../../utils/HtmlUtil.js';
import { LocalStorageEventList } from '../../utils/storage/localStorage/LocalStorageEventList.js';
import { ILocalStorageValueList, LocalStorageKeyList } from '../../utils/storage/localStorage/LocalStorageKeyList.js';
import { LocalStorageUtil } from '../../utils/storage/localStorage/LocalStorageUtil.js';
import { UrlUtil } from '../../utils/UrlUtil.js';
import { BaseComponent, IComponentDom } from '../base/BaseComponent.js';

export interface INavBarDom extends IComponentDom {
    root: HTMLElement;
    appInfo: HTMLDivElement;
    links: HTMLDivElement;
    right: HTMLDivElement;
}

export class NavBar extends BaseComponent<INavBarDom> {
    public static readonly logoUrl = `/static/img/1010111emoji-${HtmlUtil.isChromium() && 'smart' || 'rainbow'}.svg`;

    constructor(render?: boolean) {
        super(render);

        userManager.emitter.on(UserManagerEventList.USER_REFRESH, this.onUserRefresh, this);
        userManager.emitter.on(UserManagerEventList.SWITCH_CURRENT_USER, this.onSwitchCurrentUser, this);
    }

    protected onUserRefresh(): void {
        this.updateLoginStatus();
        this.updateAccountList();
    }

    protected onSwitchCurrentUser(): void {
        this.updateLoginStatus();
        this.updateAccountList();
    }

    public createDomRoot(): void {
        this._dom.root = HtmlUtil.createElement(`
            <nav class="nav-bar"></nav>
        `)

        this.createDomAppInfo();
        this.createDomLinks();
        this.createDomRight();

        this.setupListenerForAllAnchor();

        this.setTheme();

        if (UrlUtil.locationSearch.has('hide_nav_bar', 'true')) {
            this.hide();
        }
    }

    protected createDomAppInfo(): void {
        this._dom.appInfo = HtmlUtil.createElement(`
            <div class="nav-app-info">
                <a class="nav-logo" href="/"></a>
                <h1 class="nav-title">EnhServer</h1>
            </div>
        `);

        this._dom.root.append(this._dom.appInfo);

        this.updateLogo();
    }

    protected createDomLinks(): void {
        this._dom.links = HtmlUtil.createElement(`
            <div class="nav-links">
                <a href="/">首頁</a>
                <a href="variableTableList.html">變數表總表</a>
                <a class="btn btn-about-us">關於我們</a>
            </div>
        `);

        this._dom.root.append(this._dom.links);

        const aboutUsDom = this._dom.links.querySelector('.btn-about-us');
        aboutUsDom.addEventListener('click', showAboutUs);
    }

    protected createDomRight(): void {
        this._dom.right = HtmlUtil.createElement(`
            <div class="nav-right">
                <div class="nav-options">
                    <i class="material-icons nav-theme"></i>
                </div>
                <div class="nav-auth">
                    <div class="nav-auth-not hidden">
                        <a class="nav-btn btn-register" href="register.html">註冊</a>
                        <a class="nav-btn btn-login" href="login.html">登入</a>
                    </div>
                    <div class="nav-auth-success hidden">
                        <div class="nav-user-area">
                            <button class="nav-nickname-wrapper">
                                <span class="nav-nickname"></span>
                            </button>
                            <div class="nav-user-dropdown">
                                <div class="nav-switch-account-wrapper">
                                    <a class="nav-switch-account">
                                        <i class="material-icons">switch_account</i>
                                        <span>切換帳號</span>
                                    </a>
                                    <div class="nav-account-list"></div>
                                </div>
                                <a href="settings.html">
                                    <i class="material-icons">construction</i>
                                    <span>設定</span>
                                </a>
                                <a class="nav-logout disabled">
                                    <i class="material-icons">logout</i>
                                    <span></span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        this._dom.root.append(this._dom.right);

        const themeDom = this._dom.right.querySelector('.nav-theme');
        themeDom.addEventListener('click', this.switchTheme.bind(this));
        LocalStorageUtil.emitter.off(LocalStorageEventList.THEME_CHANGED, this.onThemeChanged, this);
        LocalStorageUtil.emitter.on(LocalStorageEventList.THEME_CHANGED, this.onThemeChanged, this);

        const userAreaDom = this._dom.right.querySelector('.nav-user-area');
        userAreaDom.addEventListener('mouseenter', this.onUserAreaMouseEnter.bind(this));

        const switchAccountWrapperDom = this._dom.right.querySelector('.nav-switch-account-wrapper');
        switchAccountWrapperDom.addEventListener('mouseenter', this.onSwitchAccountWrapperMouseEnter.bind(this));

        this.updateLoginStatus();
        this.updateAccountList();
    }

    public async updateLogo(): Promise<void> {
        const logoDom = this._dom.appInfo.querySelector('.nav-logo');
        const svgHtml = await FileUtil.fetchText(NavBar.logoUrl);
        logoDom.innerHTML = svgHtml;
    }

    public switchTheme(): void {
        let theme: ILocalStorageValueList[LocalStorageKeyList.THEME];
        switch (LocalStorageUtil.getItem(LocalStorageKeyList.THEME)) {
            case 'light':
                theme = 'dark';
                break;
            case 'dark':
            default:
                theme = 'light';
                break;
        }
        this.setTheme(theme);
    }

    public setTheme(theme = LocalStorageUtil.getItem(LocalStorageKeyList.THEME)): void {
        LocalStorageUtil.setItem(LocalStorageKeyList.THEME, theme);
    }

    protected onThemeChanged(theme: string): void {
        let iconText = 'dark_mode';
        switch (theme) {
            case 'light':
                break;
            case 'dark':
                iconText = 'light_mode';
                break;
            default:
                theme = 'light';
                break;
        }

        const themeDom = this._dom.right.querySelector('.nav-theme');
        themeDom.textContent = iconText;
    }

    public async updateLoginStatus(): Promise<void> {
        await userManager.ready();
        const user = await userManager.getCurrentUser();
        if (!user) {
            this.setNickname('');
            this.setLoginStatus(false);
        } else {
            this.setNickname(user.account);
            this.setLoginStatus(true);
        }
    }

    protected setNickname(name = ''): void {
        const navNicknameDom = this._dom.right.querySelector('.nav-nickname');
        navNicknameDom.textContent = name + '';
    }

    protected setLoginStatus(login: boolean): void {
        const authNotDom = this._dom.right.querySelector('.nav-auth-not');
        authNotDom.classList.toggle('hidden', login);

        const authSuccessDom = this._dom.right.querySelector('.nav-auth-success');
        authSuccessDom.classList.toggle('hidden', !login);
    }

    protected onUserAreaMouseEnter(): void {
        const userDropdownDom = this._dom.right.querySelector('.nav-user-dropdown');
        userDropdownDom.classList.remove('align-left');

        const rect = userDropdownDom.getBoundingClientRect();
        if (rect.left < 0) {
            userDropdownDom.classList.add('align-left');
        }
    }

    protected onSwitchAccountWrapperMouseEnter(): void {
        const accountListDom = this._dom.right.querySelector('.nav-account-list');
        accountListDom.classList.remove('align-left');

        const rect = accountListDom.getBoundingClientRect();
        if (rect.left < 0) {
            accountListDom.classList.add('align-left');
        }
    }

    public async updateAccountList(): Promise<void> {
        const accountListDom = this._dom.right.querySelector('.nav-account-list');

        const [myuser, users] = await Promise.all([userManager.getCurrentUser(), userManager.getUsers()]);

        accountListDom.innerHTML = '';

        if (myuser && users.length) {
            accountListDom.append(...users.map((user, index) => this.createAccountItem(index, user, user.index === myuser.index)));
        }

        accountListDom.append(this.createAccountItemOther());
    }

    protected createAccountItem(index: number, user: UserVo, current = false): HTMLDivElement {
        const accountItemDom = HtmlUtil.createElement(`
            <div class="nav-account-item logged-${user.isLoggedIn ? 'in' : 'out'}${current ? ' current' : ''}">
                <span class="nav-account-nickname">${user.account}</span>
                <span class="nav-account-status">${current ? '使用中' : (user.isLoggedIn ? '已' : '未') + '登入'}</span>
            </div>
        `) as HTMLDivElement;

        if (!current) {
            accountItemDom.addEventListener('click', async () => {
                await userManager.ready();
                const newUser = await userManager.getUserByIndex(index);
                if (newUser?.isLoggedIn) {
                    userManager.switcCurrenthUserByIndex(index);
                } else {
                    UrlUtil.redirectBase('login.html');
                }
            });
        }

        return accountItemDom;
    }

    protected createAccountItemOther(): HTMLAnchorElement {
        const loginOtherDom = HtmlUtil.createElement(`
            <a class="nav-account-item login-other" href="login.html">登入其他帳號</a>
        `) as HTMLAnchorElement;

        this.setupListenerForAnchor(loginOtherDom);

        return loginOtherDom;
    }
}
