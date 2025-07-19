import { BasicLayout } from '../layout/BasicLayout.js';
import { VariableTableListPage } from '../pages/variableTableList/VariableTableListPage.js';
import { WebManager } from './WebManager.js';

WebManager.register(new BasicLayout(new VariableTableListPage()));
