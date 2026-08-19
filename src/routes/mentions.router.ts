import { Router } from 'express';
import { MentionController } from '../controllers/mention.controller';

const router = Router();

router.post('/internal/mentions/bulk', MentionController.bulkIngest);
router.get('/mentions', MentionController.search);
router.get('/mentions/stats', MentionController.getStats);

export default router;
