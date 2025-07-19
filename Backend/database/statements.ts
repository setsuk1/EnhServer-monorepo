import { accountStatements } from './statement/accountStatements.js';
import { groupStatements } from './statement/groupStatements.js';
import { permissionStatements } from './statement/permissionStatements.js';
import { tokenStatements } from './statement/tokenStatements.js';
import { variableTableStatements } from './statement/variableTableStatements.js';

export const statements = {
    account: accountStatements,
    token: tokenStatements,
    variableTable: variableTableStatements,
    permission: permissionStatements,
    group: groupStatements
};
