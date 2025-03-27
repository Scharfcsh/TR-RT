import express from "express";
import {Login, signup,Logout} from "../controllers/auth.controller.js";
const authRoutesrouter= express.Router();


authRoutesrouter.post('/login',Login);

authRoutesrouter.post('/signup',signup);

authRoutesrouter.post('/logout',Logout);

export default authRoutesrouter;