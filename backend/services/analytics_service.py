from sqlalchemy.orm import Session
from models.task import Task
from datetime import datetime

class AnalyticsService:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id

    def get_summary(self):
        tasks = self.db.query(Task).filter(Task.user_id == self.user_id).all()
        
        total = len(tasks)
        completed = sum(1 for t in tasks if t.status == 'completed')
        
        today_str = datetime.now().strftime("%Y-%m-%d")
        due_today = sum(1 for t in tasks if t.due_date == today_str and t.status != 'completed')
        
        pending = total - completed
        
        return {
            "total": total,
            "completed": completed,
            "pending": pending,
            "due_today": due_today
        }

    def generate_insight(self, metrics: dict, user_name: str):
        # Simple rule-based insight generation
        if metrics['due_today'] > 3:
            return f"Heavy day ahead, {user_name}. You have {metrics['due_today']} tasks due today."
        elif metrics['pending'] == 0 and metrics['total'] > 0:
            return f"You are all caught up! Great job, {user_name}."
        elif metrics['completed'] > metrics['pending']:
            return f"You are productive today, {user_name}. Keep it up."
        else:
            return f"Let's focus on clearing your pending tasks, {user_name}."