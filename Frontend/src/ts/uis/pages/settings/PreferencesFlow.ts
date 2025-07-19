import { HtmlUtil } from '../../../utils/HtmlUtil.js';
import { LocalStorageEventList } from '../../../utils/storage/localStorage/LocalStorageEventList.js';
import { ILocalStorageValueList, LocalStorageKeyList } from '../../../utils/storage/localStorage/LocalStorageKeyList.js';
import { LocalStorageUtil } from '../../../utils/storage/localStorage/LocalStorageUtil.js';
import { IComponentDom } from '../../base/BaseComponent.js';
import { BaseFlowComponent } from '../../base/flow/BaseFlowComponent.js';
import { FlowSharedData } from '../../base/flow/FlowManager.js';

export interface IPreferencesFlowDom extends IComponentDom {
    root: HTMLDivElement;
    theme: HTMLSelectElement;
    themeTransitionMethod: HTMLSelectElement;
}

export class PreferencesFlow extends BaseFlowComponent<FlowSharedData, IPreferencesFlowDom> {
    protected createDomRoot(): void {
        Object.assign(this._dom, HtmlUtil.createDom(`
            <div class="preferences flow">
                <div class="user-interface">
                    <span class="text-title">介面設定</span>
                    <div class="padding-2">
                        <div>
                            <label>
                                佈景主題
                                <select data-enh-label="theme">
                                    <option value="light">明亮</option>
                                    <option value="dark">暗黑</option>
                                </select>
                            </label>
                        </div>
                        <div>
                            <label>
                                切換佈景主題的方式
                                <select data-enh-label="themeTransitionMethod">
                                    <option value="0">無過渡動畫</option>
                                    <option value="1">漸變</option>
                                </select>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `));

        this._dom.theme.value = LocalStorageUtil.getItem(LocalStorageKeyList.THEME) + '';
        this._dom.themeTransitionMethod.value = LocalStorageUtil.getItem(LocalStorageKeyList.THEME_TRANSITION_METHOD) + '';

        this._dom.theme.addEventListener('change', this.onThemeDomChanged.bind(this));
        this._dom.themeTransitionMethod.addEventListener('change', this.onThemeTransitionMethodDomChanged.bind(this));

        LocalStorageUtil.emitter.off(LocalStorageEventList.THEME_CHANGED, this.onThemeChanged, this);
        LocalStorageUtil.emitter.on(LocalStorageEventList.THEME_CHANGED, this.onThemeChanged, this);
        LocalStorageUtil.emitter.off(LocalStorageEventList.THEME_TRANSITION_METHOD_CHANGED, this.onThemeTransitionMethodChanged, this);
        LocalStorageUtil.emitter.on(LocalStorageEventList.THEME_TRANSITION_METHOD_CHANGED, this.onThemeTransitionMethodChanged, this);
    }

    protected onThemeDomChanged() {
        LocalStorageUtil.setItem(LocalStorageKeyList.THEME, this._dom.theme.value as ILocalStorageValueList[LocalStorageKeyList.THEME]);
    }

    protected onThemeChanged(theme = LocalStorageUtil.getItem(LocalStorageKeyList.THEME)) {
        this._dom.theme.value = theme + '';
    }

    protected onThemeTransitionMethodDomChanged() {
        LocalStorageUtil.setItem(LocalStorageKeyList.THEME_TRANSITION_METHOD, +this._dom.themeTransitionMethod.value as ILocalStorageValueList[LocalStorageKeyList.THEME_TRANSITION_METHOD]);
    }

    protected onThemeTransitionMethodChanged(method = LocalStorageUtil.getItem(LocalStorageKeyList.THEME_TRANSITION_METHOD)) {
        this._dom.themeTransitionMethod.value = method + '';
    }
}
