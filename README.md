# Taskify: AI-Powered Task Management

Taskify is a modern, full-stack task management application that combines the power of **FastAPI** and **React** with cutting-edge **AI Voice Commands**. Manage your day effortlessly with natural language, smart analytics, and a beautiful, responsive UI.

---

## Key Features

### AI Voice Command System
*   **Natural Language Interaction**: Create tasks by simply saying "Remind me to call Mom tomorrow at 5pm".
*   **Personalized Feedback**: Get instant voice feedback from the AI (powered by Groq).
*   **Intelligent Parsing**: The system automatically extracts task names, dates, and times from your speech.

### Smart Analytics & Insights
*   **Productivity Dashboard**: Track your progress with visual charts and daily summaries.
*   **AI Insights**: Receive personalized tips based on your productivity patterns.

### Advanced Task Management
*   **Full CRUD**: Create, Update, and Delete tasks with ease.
*   **Smart Reminders**: Never miss a deadline with configurable reminder intervals.
*   **Task Categorization**: Keep your workflows organized and focused.

### Secure & Personalized
*   **JWT Authentication**: Secure user login and signup system.
*   **Customizable Settings**: Adjust voice speed, choose different voice types, and manage your profile settings.

---

## Tech Stack

### Frontend
- **Framework**: [React](https://reactjs.org/) (Vite)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: React Query & Lucide Icons

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via Supabase)
- **ORM**: [SQLAlchemy](https://www.sqlalchemy.org/)
- **AI Engine**: [Groq Cloud](https://groq.com/) (Llama3/Mixtral)

---

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- [Supabase](https://supabase.com/) Account (Postgres DB)
- [Groq](https://console.groq.com/) API Key

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```
*Create a `.env` file in the `backend/` directory using the provided examples.*
```bash
uvicorn main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*The app will be available at `http://localhost:8080`.*

---

## Project Structure
```text
Taskify/
├── backend/            # FastAPI Python Server
│   ├── ai/            # LLM Logic (Groq)
│   ├── api/           # Router endpoints
│   ├── models/        # SQLAlchemy Models
│   ├── services/      # Business Logic
│   └── database/      # DB Connections
└── frontend/           # React TypeScript App
    ├── src/
    │   ├── components/ # Reusable UI
    │   ├── pages/      # Route Views
    │   └── services/   # API Clients
    └── public/         # Static Assets
```

---

## Security & Environment
To run Taskify, you will need to set up several environment variables. 
**Important**: Never commit your `.env` files to version control.

### Backend `.env`
- `SECRET_KEY`: Your JWT secret
- `DATABASE_URL`: Your PostgreSQL connection string
- `GROQ_API_KEY`: Your Groq API key

### Frontend `.env`
- `VITE_SUPABASE_URL`: Your Supabase URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
---

## Authors
- **Rahma Nakhuda**
- **Shubh Dwivedi**
