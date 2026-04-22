from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.task import Task
from models.schemas import TaskUpdate

class TaskService:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id

    def create_task(self, task_data: dict):
        # Additional Validation (Model handles basic types, but ensure business rules)
        if not task_data.get('title'):
             raise HTTPException(status_code=400, detail="Task title is mandatory.")
        if not task_data.get('due_date'):
             raise HTTPException(status_code=400, detail="Due date is mandatory.")

        new_task = Task(
            user_id=self.user_id,
            title=task_data['title'],
            due_date=task_data['due_date'],
            due_time=task_data.get('due_time'),
            reminder_time=task_data.get('reminder_time'),
            status="pending"
        )
        
        self.db.add(new_task)
        self.db.commit()
        self.db.refresh(new_task)
        return new_task

    def get_tasks(self):
        return self.db.query(Task).filter(Task.user_id == self.user_id).all()

    def update_task(self, task_id: int, updates: dict):
        task = self.db.query(Task).filter(Task.id == task_id, Task.user_id == self.user_id).first()
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        for key, value in updates.items():
            if value is not None and hasattr(task, key):
                setattr(task, key, value)
        
        self.db.commit()
        self.db.refresh(task)
        return task

    def delete_task(self, task_id: int):
        task = self.db.query(Task).filter(Task.id == task_id, Task.user_id == self.user_id).first()
        
        if not task:
             raise HTTPException(status_code=404, detail="Task not found")
             
        self.db.delete(task)
        self.db.commit()
        return {"status": "success", "message": "Task deleted"}

    def complete_task(self, task_id: int):
        task = self.db.query(Task).filter(Task.id == task_id, Task.user_id == self.user_id).first()

        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        from datetime import timezone
        task.status = "completed"
        task.completed_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(task)
        return task

    def get_productivity_stats(self):
        """
        Computes productivity stats for the user:
        - completed_today (names)
        - completed_this_week (count + names for context)
        - completed_this_month (count)
        """
        from datetime import timezone
        
        # Ensure we are working with UTC aware datetimes
        now = datetime.now(timezone.utc)
        today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
        
        # Start of week (Monday)
        week_start = today_start - timedelta(days=today_start.weekday())
        
        # Start of month
        month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)

        # Fetch all completed tasks (optimization: could filter by date in DB, but fetching all completed for simple app is fine)
        completed_tasks = self.db.query(Task).filter(
            Task.user_id == self.user_id,
            Task.status == 'completed',
            Task.completed_at != None
        ).all()

        today_tasks = []
        week_tasks = []
        month_count = 0

        for task in completed_tasks:
            if not task.completed_at: continue
            
            # Ensure task.completed_at is timezone aware (it should be from DB)
            # If naive (e.g. from older records), make it UTC
            completed_at = task.completed_at
            if completed_at.tzinfo is None:
                completed_at = completed_at.replace(tzinfo=timezone.utc)
            
            # Tasks logic
            if completed_at >= today_start:
                today_tasks.append(task.title)
            
            if completed_at >= week_start:
                week_tasks.append(task.title)
            
            if completed_at >= month_start:
                month_count += 1

        return {
            "completed_today": today_tasks,
            "completed_this_week": week_tasks,
            "completed_this_month_count": month_count
        }