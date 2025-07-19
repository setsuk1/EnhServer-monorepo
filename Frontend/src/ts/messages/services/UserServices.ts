import { Message } from '../Message.js';
import { IUserVo } from '../vo/UserVo.js';
import { APIServices } from './APIServices.js';

export class UserServices {
    public static register(account: string, password: string): Promise<Message<number>> {
        return APIServices.safeFetch('/api/user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ account, password })
        });
    }

    public static login(account: string, password: string): Promise<Message<number>> {
        return APIServices.safeFetch('/api/user', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ account, password })
        });
    }

    public static fetchAllUser(): Promise<Message<IUserVo[]>> {
        return APIServices.safeFetch('/api/user');
    }

    public static fetchUser(index: number): Promise<Message<IUserVo>> {
        return APIServices.safeFetch(`/api/user/${index}`);
    }

    public static deleteUser(index: number): Promise<Message> {
        return APIServices.safeFetch(`/api/user/${index}`, {
            method: 'DELETE'
        });
    }

    public static logoutUser(index: number): Promise<Message> {
        return APIServices.safeFetch(`/api/user/${index}/logout`, {
            method: 'PUT'
        });
    }

    public static renameUser(index: number, nickname: string): Promise<Message> {
        return APIServices.safeFetch(`/api/user/${index}/nickname`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ nickname })
        });
    }

    public static changeUserPassword(index: number, password: string, newPassword: string): Promise<Message> {
        return APIServices.safeFetch(`/api/user/${index}/password`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ password, newPassword })
        });
    }

    public static changeUserAllowPassword(index: number, allowPassword: boolean, password: string): Promise<Message> {
        return APIServices.safeFetch(`/api/user/${index}/allow-password`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ allowPassword, password })
        });
    }
}
