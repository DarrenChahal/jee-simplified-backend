import express from 'express';
import cors from 'cors';
import { questionController } from './Controllers/questionController.js';

const app = new express();

app.use(cors());

const PORT = process.env.PORT || 8080;
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: 'JEE Simplified API is running' });
});

// Question endpoints
app.post('/api/questions', questionController.createQuestion);
app.get('/api/questions/:id', questionController.getQuestion);
app.get('/api/questions', questionController.listQuestions);
app.put('/api/questions/:id', questionController.updateQuestion);
app.delete('/api/questions/:id', questionController.deleteQuestion);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});