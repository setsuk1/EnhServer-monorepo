import { BasicLayout } from '../layout/BasicLayout.js';
import { RegisterPage } from '../pages/register/RegisterPage.js';
import { WebManager } from './WebManager.js';

WebManager.register(new BasicLayout(new RegisterPage()));
