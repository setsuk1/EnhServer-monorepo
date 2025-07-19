import { TypeUtil } from '../../utils/TypeUtil.js';
import { Message } from '../Message.js';
import { VariableTableInfoVo } from '../vo/VaraibleTableInfoVo.js';
import { VariableTableEntryVo } from '../vo/VariableTableEntryVo.js';
import { APIServices } from './APIServices.js';

export class VariableTableServices {
    public static async fetchAllVariableTableInfo(userIndex?: number): Promise<VariableTableInfoVo[]> {
        const msg = await APIServices.safeFetch(`/api/variable-table${TypeUtil.isUint(userIndex) ? `?userIndex=${userIndex}` : ''}`);
        if (!msg.isSuccess() || !Array.isArray(msg.data)) {
            return [];
        }
        return msg.data.map(vo => new VariableTableInfoVo(vo));
    }

    public static async fetchMyUserAllVariableTableInfo(userIndex: number): Promise<VariableTableInfoVo[]> {
        const msg = await APIServices.safeFetch(`/api/user/${userIndex}/variable-table`);
        if (!msg.isSuccess() || !Array.isArray(msg.data)) {
            return [];
        }
        return msg.data.map(vo => new VariableTableInfoVo(vo));
    }

    public static createVariableTable(userIndex: number, nickname = 'Variable Table'): Promise<Message<number>> {
        return APIServices.safeFetch(`/api/user/${userIndex}/variable-table`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ nickname })
        });
    }

    public static async fetchVariableTableInfo(userIndex: number, id: number): Promise<VariableTableInfoVo> {
        const msg = await APIServices.safeFetch(`/api/user/${userIndex}/variable-table/${id}`);
        if (!msg.isSuccess() || !msg.data) {
            return undefined;
        }
        return new VariableTableInfoVo(msg.data);
    }

    public static deleteVariableTable(userIndex: number, id: number): Promise<Message> {
        return APIServices.safeFetch(`/api/user/${userIndex}/variable-table/${id}`, {
            method: 'DELETE'
        });
    }

    public static renameVariableTable(userIndex: number, id: number, nickname: string): Promise<Message> {
        return APIServices.safeFetch(`/api/user/${userIndex}/variable-table/${id}/nickname`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ nickname })
        });
    }



    public static async fetchAllVariableTableEntry(userIndex: number, varTblId: number): Promise<VariableTableEntryVo[]> {
        const msg = await APIServices.safeFetch(`/api/user/${userIndex}/variable-table/${varTblId}/variable`);
        if (!msg.isSuccess() || !Array.isArray(msg.data)) {
            return [];
        }
        return msg.data.map(vo => new VariableTableEntryVo(vo));
    }

    public static createVariableTableEntry(userIndex: number, varTblId: number, key: string, value: any): Promise<Message> {
        return APIServices.safeFetch(`/api/user/${userIndex}/variable-table/${varTblId}/variable`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ key, value })
        });
    }

    public static async fetchVariableTableEntry(userIndex: number, varTblId: number, id: number): Promise<VariableTableEntryVo> {
        const msg = await APIServices.safeFetch(`/api/user/${userIndex}/variable-table/${varTblId}/variable/${id}`);
        if (!msg.isSuccess() || !msg.data) {
            return undefined;
        }
        return new VariableTableEntryVo(msg.data);
    }

    public static deleteVariableTableEntry(userIndex: number, varTblId: number, id: number): Promise<Message> {
        return APIServices.safeFetch(`/api/user/${userIndex}/variable-table/${varTblId}/variable/${id}`, {
            method: 'DELETE'
        });
    }

    public static changeVariableTableEntry(userIndex: number, varTblId: number, id: number, value: any): Promise<Message> {
        return APIServices.safeFetch(`/api/user/${userIndex}/variable-table/${varTblId}/variable/${id}`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ value })
        });
    }
}
