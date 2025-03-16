# JEE Simplified Backend

This is the backend for the JEE Simplified platform, using Firebase Firestore as the database.

## Setup

1. Install dependencies:
```
npm install
```

2. Configure Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Generate a new private key from Project Settings > Service Accounts
   - Update the `.env` file with your Firebase project details and service account JSON

3. Start the server:
```
npm start
```

## API Endpoints

### Questions

- `GET /api/questions` - List all questions (with optional filters)
- `GET /api/questions/:id` - Get a specific question by ID
- `POST /api/questions` - Create a new question
- `PUT /api/questions/:id` - Update an existing question
- `DELETE /api/questions/:id` - Delete a question

## Question Schema

```json
{
  "_id": "q123",
  "subject": "Physics",
  "for_class": "JEE Advanced",
  "topic": "Mechanics",
  "difficulty": "Medium",
  "origin": "platform", 
  "test_info": null,
  "question_text": "A block slides down an incline. Determine its acceleration given friction and gravitational force.",
  "attachments": [
    "https://example.com/incline_diagram.png"
  ],
  "answer_metadata": {
    "answer_type": "input",
    "options": []
  },
  "tags": ["JEE", "Mechanics", "Friction"],
  "created_by": "email_id",
  "createdAt": "2025-03-15T10:00:00Z",
  "updatedAt": "2025-03-15T12:00:00Z"
}
```
