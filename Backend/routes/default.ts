import { Router } from "express";

export const defaultRouter = Router();

defaultRouter.get("/", (req, res) => {
    res.send("Please access through /api route")
})