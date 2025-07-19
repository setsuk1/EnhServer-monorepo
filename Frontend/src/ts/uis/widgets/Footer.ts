import { showAboutUs } from '../../security/warnings.js';
import { HtmlUtil } from '../../utils/HtmlUtil.js';
import { BaseComponent } from '../base/BaseComponent.js';

export class Footer extends BaseComponent {
    public createDomRoot(): void {
        this._dom.root = HtmlUtil.createElement(`
            <footer class="footer">
                <p>
                    <span>© 2025 EnhServer By EnhProject |</span>
                    <a class="btn btn-about-us">關於我們</a>
                    <span>|</span>
                    <a href="https://discord.gg/seJwuzCbWq">Discord 群組</a>
                    <span>|</span>
                    <a href="https://github.com/setsuk1/EnhServer-monorepo">Github</a>
                </p>
            </footer>
        `);

        this.setupListenerForAllAnchor();

        const aboutUsDom = this._dom.root.querySelector('.btn-about-us');
        aboutUsDom.addEventListener('click', showAboutUs);
    }
}
