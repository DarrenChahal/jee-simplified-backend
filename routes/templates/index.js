import express from 'express';
import { templateController } from '../../Controllers/templateController.js';

const router = express.Router();

router.post('/', templateController.createTemplate);
router.get('/', templateController.getAllTemplates);
router.get('/:id', templateController.getTemplateById);
router.put('/:id', templateController.updateTemplate);
router.delete('/:id', templateController.deleteTemplate);
export default router;