from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

class TaskifyBaseException(Exception):
    """Base class for all application-specific exceptions."""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code

class InvalidVoiceCommand(TaskifyBaseException):
    """Raised when the AI cannot interpret the voice command."""
    def __init__(self, message="Invalid task. Please say a valid task with a deadline."):
        super().__init__(message, status_code=400)

class TaskNotFound(TaskifyBaseException):
    """Raised when a specific task ID does not exist."""
    def __init__(self, task_id: str):
        super().__init__(f"Task with ID {task_id} not found.", status_code=404)

class AuthorizationError(TaskifyBaseException):
    """Raised when a user tries to access resources they don't own."""
    def __init__(self):
        super().__init__("You are not authorized to perform this action.", status_code=403)

# --- Exception Handlers ---

async def taskify_exception_handler(request: Request, exc: TaskifyBaseException):
    """Handles our custom application exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "type": exc.__class__.__name__,
            "message": exc.message,
            "voice_feedback": exc.message # Useful for frontend TTS
        },
    )

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Overrides default FastAPI HTTP exception to match our JSON format."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "type": "HTTPException",
            "message": str(exc.detail),
        },
    )

async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all for unexpected 500 errors."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "type": "InternalServerError",
            "message": "An unexpected error occurred. Please try again later.",
            # In production, log the real error (exc) here
        },
    )