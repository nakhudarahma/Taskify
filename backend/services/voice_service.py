from sqlalchemy.orm import Session
from ai.llm_client import AIService
from services.task_service import TaskService
from models.user import User

class VoiceService:
    def __init__(self, db: Session, user: User, ai_service: AIService):
        self.db = db
        self.user = user
        self.ai = ai_service
        self.task_service = TaskService(db, user.id)

    def handle_voice_command(self, audio_text: str):
        # 0. Fetch Context
        stats = self.task_service.get_productivity_stats()

        # 1. Extract Intent via Groq
        nlp_result = self.ai.process_command(audio_text, self.user.name, productivity_context=stats)
        print(f"🤖 Debug: NLP Result: {nlp_result}")
        intent = nlp_result.get('intent')
        data = nlp_result.get('task_data', {})
        response_text = nlp_result.get('response_text', '')

        # 2. Enforce Rule #4 (Invalid Input)
        if intent == "invalid":
            return {
                "success": False,
                "voice_feedback": response_text or "Something went wrong. Please try again."
            }
        
        # 3. Handle Chat explicitly
        if intent == "chat":
            return {
                "success": True,
                "intent": "chat",
                "voice_feedback": response_text
            }

        # 4. Route to Logic
        voice_feedback = response_text # Default to LLM response

        
        if intent == "create_task":
            # Map LLM keys to DB keys
            # STRICT VALIDATION: task_name and due_date are mandatory
            task_name = data.get('title')
            due_date = data.get('date')

            if not task_name or not due_date:
                 voice_feedback = "I need a task name and a due date to create a task."
                 return {
                    "success": False,
                    "voice_feedback": voice_feedback
                }

            task_payload = {
                "task_name": task_name,
                "due_date": due_date,
                "due_time": data.get('time'),
                "reminder_time": data.get('reminder_minutes')
            }
            try:
                print(f"📝 Debug: Creating task with payload: {task_payload}")
                self.task_service.create_task(task_payload)
                # Personalized success message
                voice_feedback = f"Task {task_name} created. I've set the due date, {self.user.name}."
            except Exception as e:
                print(f"❌ Error creating voice task: {e}")
                voice_feedback = "I could not create the task. Please specify a date."
                return {
                    "success": False,
                    "voice_feedback": voice_feedback
                }

        elif intent == "complete_task":
            # For simplicity, we might need to search by name or assume context.
            # Currently strict on ID for API, but voice might be fuzzy.
            # Skipping fuzzy implementation for now strictly to backend refactor.
            voice_feedback = f"Please complete tasks via the dashboard for accuracy, {self.user.name}."

        return {
            "success": True,
            "intent": intent,
            "voice_feedback": voice_feedback
        }

    def parse_command(self, audio_text: str):
        nlp_result = self.ai.process_command(audio_text, self.user.name)
        intent = nlp_result.get('intent')
        data = nlp_result.get('task_data', {})
        voice_feedback = nlp_result.get('response_text', '')

        return {
            "intent": intent,
            "title": data.get('title'),
            "date": data.get('date'),
            "time": data.get('time'),
            "reminder_minutes": data.get('reminder_minutes'),
            "voice_feedback": voice_feedback
        }