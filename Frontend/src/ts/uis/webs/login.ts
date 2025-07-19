import { BasicLayout } from '../layout/BasicLayout.js';
import { LoginPage } from '../pages/login/LoginPage.js';
import { WebManager } from './WebManager.js';

WebManager.register(new BasicLayout(new LoginPage()));
