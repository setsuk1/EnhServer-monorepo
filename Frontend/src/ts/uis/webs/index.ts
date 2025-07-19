import { BasicLayout } from '../layout/BasicLayout.js';
import { IndexPage } from '../pages/index/IndexPage.js';
import { WebManager } from './WebManager.js';

WebManager.register(new BasicLayout(new IndexPage()));
