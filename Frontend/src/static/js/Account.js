import { safeFetch } from './function.js';
import { Message } from './Message.js';

export class Account {
    /**
     * 
     * @returns {Account[]}
     */
    static async getAllAccount() {
        const msg = await safeFetch('api/user');
        if (!msg.checkType(Message.TYPE.SUCCESS) || !msg.data) {
            return [];
        }
        return msg.data.map(json => new Account(json));
    }

    /**
     * 
     * @returns {Account}
     */
    static async getCurrentAccount() {
        const msg = await safeFetch('api/user/current');
        if (!msg.checkType(Message.TYPE.SUCCESS) || !msg.data) {
            return;
        }
        return new Account(msg.data);
    }

    /**
     * 
     * @param {number} index 
     * @returns {Account}
     */
    static async getAccount(index) {
        const msg = await safeFetch(`api/user/${index}`);
        if (!msg.checkType(Message.TYPE.SUCCESS) || !msg.data) {
            return;
        }
        return new Account(msg.data);
    }

    /**
     * 
     * @param {number} index 
     */
    static async deleteAccount(index) {
        const msg = await safeFetch(`api/user/${index}/logout`);
        if (!msg.checkType(Message.TYPE.SUCCESS)) {
            return false;
        }
        return true;
    }

    /**
     * 
     * @param {number} index 
     */
    static async deleteAccount(index) {
        const msg = await safeFetch(`api/user/${index}`, {
            method: 'DELETE'
        });
        if (!msg.checkType(Message.TYPE.SUCCESS)) {
            return false;
        }
        return true;
    }

    /**
     * 
     * @param {{ account:string, isLoggedIn:boolean }} json 
     */
    constructor(json) {
        this.account = json.account;
        this.isLoggedIn = json.isLoggedIn;
    }
}