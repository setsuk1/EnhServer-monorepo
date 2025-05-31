import { Router } from "express";
import { Message } from "../../other/Message.js";

export const profileRouter = Router();

profileRouter.get("/", (req, res, next) => {
    res.json(new Message(Message.TYPE.SUCCESS, req.session.account).toArray());
});

profileRouter.get("/current", (req, res, next) => {
    const accounts = req.session.account;
    if (!accounts?.length) {
        res.send(new Message(Message.TYPE.GENERIC_ERROR).toArray());
        return;
    }

    res.send(new Message(Message.TYPE.SUCCESS, accounts[req.session.currentAccount]).toArray());
});

profileRouter.all(['/:id', '/:id/*'], (req, res, next) => {
    if (!req.session.account?.[req.params.id]) {
        res.send(new Message(Message.TYPE.GENERIC_ERROR).toArray());
        return;
    }
    next();
});

profileRouter.get("/:id", (req, res, next) => {
    res.send(new Message(Message.TYPE.SUCCESS, req.session.account[req.params.id]).toArray());
});

profileRouter.get('/:id/change', (req, res, next) => {
    const id = +req.params.id;
    const account = req.session.account[id];
    if (!account.isLoggedIn) {
        res.send(new Message(Message.TYPE.HAS_NOT_LOGGED_IN).toArray());
        return;
    }

    req.session.currentAccount = id;

    res.send(new Message(Message.TYPE.SUCCESS).toArray());
});

profileRouter.get('/:id/logout', (req, res, next) => {
    const account = req.session.account[+req.params.id];
    if (!account.isLoggedIn) {
        res.send(new Message(Message.TYPE.HAS_NOT_LOGGED_IN).toArray());
        return;
    }

    account.isLoggedIn = false;

    res.send(new Message(Message.TYPE.SUCCESS).toArray());
});

profileRouter.delete('/:id', (req, res, next) => {
    const id = +req.params.id;
    const accounts = req.session.account;
    const account = accounts[id];

    accounts.splice(id, 1);

    if (accounts.length) {
        const index = accounts.indexOf(account);
        req.session.currentAccount = index === -1 ? 0 : index;
    } else
        req.session.currentAccount = undefined;

    res.send(new Message(Message.TYPE.SUCCESS).toArray());
});