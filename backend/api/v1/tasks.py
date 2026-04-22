from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from api.dependencies import get_current_user
from services.task_service import TaskService
from models.schemas import TaskCreate, TaskResponse, TaskUpdate
from database.postgres import get_db
from models.user import User


router = APIRouter()

@router.get("/", response_model=List[TaskResponse])
def get_tasks(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    service = TaskService(db, current_user.id)
    return service.get_tasks()

@router.post("/create", response_model=TaskResponse)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print("📥 Incoming task payload:", task)
    print("👤 Current user ID:", current_user.id)
    service = TaskService(db, current_user.id)
    return service.create_task(task.model_dump())


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_update: TaskUpdate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    service = TaskService(db, current_user.id)
    return service.update_task(task_id, task_update.model_dump(exclude_unset=True))

@router.delete("/{task_id}")
def delete_task(task_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    service = TaskService(db, current_user.id)
    return service.delete_task(task_id)

@router.put("/{task_id}/complete")
def complete_task(task_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    service = TaskService(db, current_user.id)
    updated_task = service.complete_task(task_id)
    
    # Requirement: Voice feedback trigger on completion
    return {
        "status": "success",
        "voice_feedback": f"{updated_task.title} completed. Well done, {current_user.name}."
    }