import { BasicLayout } from '../layout/BasicLayout.js';
import { ExternalLoginPage } from '../pages/externalLogin/ExternalLoginPage.js';
import { WebManager } from './WebManager.js';

WebManager.register(new BasicLayout(new ExternalLoginPage()));
