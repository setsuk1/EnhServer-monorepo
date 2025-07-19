import { BasicLayout } from '../layout/BasicLayout.js';
import { SettingsPage } from '../pages/settings/SettingsPage.js';
import { WebManager } from './WebManager.js';

WebManager.register(new BasicLayout(new SettingsPage()));
