import { Router } from 'express';
import mentionRouter from './mentions.router';

const router = Router();

router.use(mentionRouter);

export default router;
