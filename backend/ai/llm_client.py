import json
from groq import Groq
from core.config import settings
from ai.prompts import get_intent_extraction_prompt
from datetime import datetime

class AIService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        if not self.api_key:
            print("⚠️ Warning: GROQ_API_KEY is missing. AI features will be disabled.")
            self.client = None
        else:
            try:
                self.client = Groq(api_key=self.api_key)
            except Exception as e:
                print(f"❌ Error initializing Groq client: {e}")
                self.client = None

    def process_command(self, text: str, user_name: str, productivity_context: dict = None):
        if not self.client:
            print("🚫 AI Service called but client is not initialized (missing API key).")
            return {
                "intent": "invalid",
                "response_text": "I'm currently disconnected from my AI brain. Please check the Groq API key configuration."
            }

        prompt = get_intent_extraction_prompt(user_name, datetime.now(), productivity_context)
        
        try:
            completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": text}
                ],
                model="llama-3.3-70b-versatile", # Fast and capable
                temperature=0,
                response_format={"type": "json_object"}
            )
            
            return json.loads(completion.choices[0].message.content)
        except Exception as e:
            print(f"❌ Groq API Error: {e}")
            return {
                "intent": "invalid",
                "response_text": f"Sorry, I encountered an error talking to the AI: {str(e)}"
            }