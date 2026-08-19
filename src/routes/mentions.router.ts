import { Router } from 'express';
import { MentionController } from '../controllers/mention.controller';

const router = Router();

router.post('/internal/mentions/bulk', MentionController.bulkIngest);
router.get('/mentions', MentionController.search);

export default router;
