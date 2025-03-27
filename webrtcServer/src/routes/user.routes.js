import express from 'express';
import { getUserForSideBar, Onlineusers } from '../controllers/user.controller.js';

const router = express.Router();

router.get("/", getUserForSideBar);
router.get("/online", Onlineusers);

export default router;