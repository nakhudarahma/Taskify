from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app
from api.dependencies import get_current_user

client = TestClient(app)

# Mock user
mock_user = {
    "userId": "test_user_id",
    "email": "test@example.com",
    "name": "Test User"
}

# Override auth dependency
app.dependency_overrides[get_current_user] = lambda: mock_user

def test_get_tasks():
    with patch("api.v1.tasks.TaskService") as MockService:
        mock_instance = MockService.return_value
        mock_instance.get_tasks.return_value = [
            {
                "id": "task_1",
                "user_id": "test_user_id",
                "title": "Test Task",
                "status": "pending",
                "created_at": "2023-01-01T00:00:00"
            }
        ]
        
        response = client.get("/tasks/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Test Task"

def test_create_task():
    with patch("api.v1.tasks.TaskService") as MockService:
        mock_instance = MockService.return_value
        mock_instance.create_task.return_value = {
            "id": "new_task_id",
            "user_id": "test_user_id",
            "title": "New Task",
            "status": "pending",
            "created_at": "2023-01-01T00:00:00"
        }
        
        payload = {"title": "New Task"}
        response = client.post("/tasks/create", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["id"] == "new_task_id"
        assert data["title"] == "New Task"

def test_update_task():
    with patch("api.v1.tasks.TaskService") as MockService:
        mock_instance = MockService.return_value
        mock_instance.update_task.return_value = {
            "id": "task_1",
            "user_id": "test_user_id",
            "title": "Updated Task",
            "status": "pending",
            "created_at": "2023-01-01T00:00:00",
            "updated_at": "2023-01-02T00:00:00"
        }
        
        payload = {"title": "Updated Task"}
        response = client.patch("/tasks/task_1", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Task"

def test_delete_task():
    with patch("api.v1.tasks.TaskService") as MockService:
        mock_instance = MockService.return_value
        mock_instance.delete_task.return_value = {"status": "success", "message": "Task deleted"}
        
        response = client.delete("/tasks/task_1")
        assert response.status_code == 200
        assert response.json() == {"status": "success", "message": "Task deleted"}

def test_complete_task():
    with patch("api.v1.tasks.TaskService") as MockService:
        mock_instance = MockService.return_value
        mock_instance.complete_task.return_value = {
            "id": "task_1",
            "user_id": "test_user_id",
            "title": "Task 1",
            "status": "completed",
            "created_at": "2023-01-01T00:00:00",
            "completed_at": "2023-01-02T00:00:00"
        }
        
        response = client.put("/tasks/task_1/complete")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "voice_feedback" in data
