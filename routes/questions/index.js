import express from 'express';
import { questionController } from '../../Controllers/questionController.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 3,                 // max 3 images per question
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

const handleUpload = (req, res, next) => {
    upload.array('images')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
             // A Multer error occurred when uploading.
             if (err.code === 'LIMIT_FILE_SIZE') {
                 return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5MB.' });
             }
             if (err.code === 'LIMIT_FILE_COUNT') {
                 return res.status(400).json({ success: false, message: 'Too many files. Maximum is 3 images.' });
             }
             return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
        } else if (err) {
             // An unknown error occurred when uploading.
             return res.status(400).json({ success: false, message: err.message });
        }
        // Everything went fine.
        next();
    });
};

// Question endpoints
router.post('/', handleUpload, questionController.createQuestion);
router.get('/:id', questionController.getQuestion);
router.get('/', questionController.listQuestions);
router.put('/:id', questionController.updateQuestion);
router.delete('/:id', questionController.deleteQuestion);

// pub sub endpoint
router.post('/subscriber', questionController.processQuestionWrite);

export default router;
