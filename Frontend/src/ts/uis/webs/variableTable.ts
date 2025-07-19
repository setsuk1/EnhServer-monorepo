import { BasicLayout } from '../layout/BasicLayout.js';
import { VariableTablePage } from '../pages/variableTable/VariableTablePage.js';
import { WebManager } from './WebManager.js';

WebManager.register(new BasicLayout(new VariableTablePage()));
