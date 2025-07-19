import { showWarning } from '../../security/warnings.js';
import { FileUtil } from '../../utils/FileUtil.js';
import { HtmlUtil } from '../../utils/HtmlUtil.js';
import { LocalStorageEventList } from '../../utils/storage/localStorage/LocalStorageEventList.js';
import { LocalStorageKeyList } from '../../utils/storage/localStorage/LocalStorageKeyList.js';
import { LocalStorageUtil } from '../../utils/storage/localStorage/LocalStorageUtil.js';
import { TimeUtil } from '../../utils/TimeUtil.js';
import { BaseComponent } from '../base/BaseComponent.js';

let registered = false;

export class WebManager {
    public static register(component: BaseComponent): boolean {
        if (registered) {
            alert('你這個……封弊者！');
            return false;
        }

        this.initialize();

        showWarning();

        component.render();
        document.body.append(component.dom.root);

        loadIcon();

        registered = true;
        return true;
    }

    public static initialize() {
        if (registered) {
            alert('你這個……封弊者！');
            return false;
        }

        this.onThemeChanged();
        TimeUtil.wait().then(() => this.onThemeTransitionMethodChanged());

        LocalStorageUtil.emitter.on(LocalStorageEventList.THEME_CHANGED, this.onThemeChanged, this);
        LocalStorageUtil.emitter.on(LocalStorageEventList.THEME_TRANSITION_METHOD_CHANGED, this.onThemeTransitionMethodChanged, this);
    }

    protected static onThemeChanged(theme = LocalStorageUtil.getItem(LocalStorageKeyList.THEME)): void {
        document.documentElement.dataset.theme = theme;
    }

    protected static onThemeTransitionMethodChanged(method = LocalStorageUtil.getItem(LocalStorageKeyList.THEME_TRANSITION_METHOD)) {
        document.documentElement.dataset.themeTransitionMethod = method + '';
    }
}

const favicons: string[] = [];

async function loadIcon() {
    if (favicons.length) {
        return;
    }

    const images = await Promise.all(new Array(16).fill(0).map((_, i) => FileUtil.fetchBase64(`${location.origin}/static/img/favicon/favicon${(i + '').padStart(2, '0')}.png`) as Promise<string>));
    favicons.push(...images);

    changeIcon();
}

function changeIcon(n = 0) {
    const link: HTMLLinkElement = document.querySelector('link[rel="icon"]');
    if (link) {
        link.href = favicons[n];
    } else {
        document.head.append(HtmlUtil.createElement(`<link rel="icon" type="image/png" href="${favicons[n]}">`));
    }
    TimeUtil.wait(100).then(() => changeIcon((n + 1) % 16));
}
