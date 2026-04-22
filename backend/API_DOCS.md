# Taskify Backend API Documentation

## Base URL
`http://localhost:8000`

## Authentication

### Signup
**POST** `/auth/signup`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "secretpassword"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "access_token": "jwt_token_string",
    "token_type": "bearer",
    "user_name": "John Doe"
  }
  ```

### Signin
**POST** `/auth/signin`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "secretpassword"
  }
  ```
- **Response**: `200 OK` (Same as Signup)

## Tasks

### Get Tasks
**GET** `/tasks/`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`
  ```json
  [
    {
      "id": 1,
      "user_id": 1,
      "task_name": "Buy Milk",
      "due_date": "2024-02-20",
      "due_time": "18:00",
      "reminder_time": 15,
      "status": "pending",
      "created_at": "2024-02-10T12:00:00",
      "completed_at": null
    }
  ]
  ```

### Create Task
**POST** `/tasks/create`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "task_name": "Buy Milk",
    "due_date": "2024-02-20",
    "due_time": "18:00",
    "reminder_time": 15
  }
  ```
- **Constraints**: 
    - `task_name` is mandatory.
    - `due_date` is mandatory (YYYY-MM-DD).

### Update Task
**PATCH** `/tasks/{task_id}`
- **Body**: Any subset of fields in Create Task + `status`.

### Delete Task
**DELETE** `/tasks/{task_id}`

### Complete Task
**PUT** `/tasks/{task_id}/complete`
- **Response**:
  ```json
  {
    "status": "success",
    "voice_feedback": "Buy Milk completed. Well done, John Doe."
  }
  ```

## Voice

### Process Command
**POST** `/voice/process`
- **Body**:
  ```json
  {
    "text": "Remind me to call Mom tomorrow at 5pm"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "intent": "create_task",
    "voice_feedback": "Task Call Mom created. I've set the due date, John Doe."
  }
  ```

## Analytics

### Summary
**GET** `/analytics/summary`
- **Response**:
  ```json
  {
    "total_tasks": 10,
    "completed": 5,
    "pending": 5,
    "due_today": 2,
    "ai_insight": "You are productive today, John Doe. Keep it up."
  }
  ```

## Settings

### Get Profile
**GET** `/settings/profile`

### Update Profile
**PUT** `/settings/profile`
- **Body**: `name`, `email`, `voice_settings`.

### Update Voice Settings
**PUT** `/settings/voice`
- **Body**:
  ```json
  {
    "voice_type": "default",
    "voice_speed": 1.0,
    "voice_feedback_enabled": true
  }
  ```
