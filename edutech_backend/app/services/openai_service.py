import openai
from typing import List, Dict, Any, Optional
from app.config import settings
from app.models.chat import MessageRole
import logging

logger = logging.getLogger(__name__)

class OpenAIService:
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
        self.max_tokens = settings.OPENAI_MAX_TOKENS
        self.temperature = settings.OPENAI_TEMPERATURE
        
        # Educational system prompt to optimize for learning domains
        self.system_prompt = """You are EduTech AI Assistant, a specialized educational AI designed to help students learn programming, economics, and various academic subjects. 

Your role:
- Provide clear, concise explanations focused on education
- Help with programming concepts, debugging, and best practices
- Assist with economics concepts, theories, and applications
- Support general learning across academic subjects
- Give practical examples and step-by-step guidance
- Keep responses focused and educational

Guidelines:
- Be concise but thorough in explanations
- Use examples to illustrate concepts
- Encourage critical thinking
- Provide actionable learning advice
- If unsure, suggest reliable educational resources
- Stay within educational domains

Keep responses under 150 tokens when possible to optimize learning efficiency."""

    async def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        user_context: Optional[Dict[str, Any]] = None
    ) -> tuple[str, int]:
        """
        Generate AI response using OpenAI API
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            user_context: Optional user context for personalization
            
        Returns:
            tuple: (response_content, tokens_used)
        """
        try:
            # Prepare messages with system prompt
            full_messages = [
                {"role": "system", "content": self.system_prompt}
            ]
            
            # Add conversation history (limit to last 10 messages for token efficiency)
            recent_messages = messages[-10:] if len(messages) > 10 else messages
            full_messages.extend(recent_messages)
            
            # Add user context if available
            if user_context:
                context_message = self._build_context_message(user_context)
                if context_message:
                    full_messages.insert(1, context_message)
            
            # Make API call
            response = self.client.chat.completions.create(
                model=self.model,
                messages=full_messages,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                stream=False
            )
            
            # Extract response and token usage
            content = response.choices[0].message.content.strip()
            tokens_used = response.usage.total_tokens
            
            logger.info(f"OpenAI API call successful. Tokens used: {tokens_used}")
            return content, tokens_used
            
        except openai.RateLimitError as e:
            logger.error(f"OpenAI rate limit exceeded: {e}")
            raise Exception("AI service is temporarily overloaded. Please try again in a moment.")
            
        except openai.AuthenticationError as e:
            logger.error(f"OpenAI authentication error: {e}")
            raise Exception("AI service configuration error. Please contact support.")
            
        except openai.APIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise Exception("AI service is temporarily unavailable. Please try again later.")
            
        except Exception as e:
            logger.error(f"Unexpected error in OpenAI service: {e}")
            raise Exception("Failed to generate AI response. Please try again.")

    def _build_context_message(self, user_context: Dict[str, Any]) -> Optional[Dict[str, str]]:
        """Build context message from user information"""
        context_parts = []
        
        if user_context.get("name"):
            context_parts.append(f"Student name: {user_context['name']}")
            
        if user_context.get("recent_topics"):
            topics = ", ".join(user_context["recent_topics"][:3])  # Limit to 3 topics
            context_parts.append(f"Recent study topics: {topics}")
            
        if context_parts:
            context_content = "Context: " + " | ".join(context_parts)
            return {"role": "system", "content": context_content}
            
        return None

    def validate_api_key(self) -> bool:
        """Validate if OpenAI API key is properly configured"""
        try:
            if not settings.OPENAI_API_KEY:
                return False
            
            # Just check if the API key is set - don't make actual API call in sync method
            return len(settings.OPENAI_API_KEY.strip()) > 0
            
        except Exception as e:
            logger.error(f"OpenAI API key validation failed: {e}")
            return False

    async def ai_inline_assistance(
        self, 
        text: str, 
        action: str, 
        lesson_context: Optional[str] = None,
        user_context: Optional[Dict[str, Any]] = None
    ) -> tuple[str, int]:
        """
        Generate AI inline assistance for text selection in lessons
        
        Args:
            text: Selected text to process
            action: Type of assistance (explanation, summary, translate, etc.)
            lesson_context: Additional lesson context
            user_context: Optional user context for personalization
            
        Returns:
            tuple: (response_content, tokens_used)
        """
        try:
            # Create specialized prompts based on action
            action_prompts = {
                "explanation": f"""Provide a clear, educational explanation of the following text. Focus on key concepts, terminology, and context that would help a student understand the material better:

Text: "{text}"

Keep the explanation concise but thorough, using examples where helpful.""",

                "summary": f"""Create a concise summary of the following text, highlighting the main points and key takeaways:

Text: "{text}"

Focus on the essential information a student should remember.""",

                "translate_vi": f"""Translate the following text from English to Vietnamese. Maintain educational context and technical terminology accuracy:

Text: "{text}"

Provide a natural, accurate Vietnamese translation.""",

                "translate_en": f"""Translate the following text from Vietnamese to English. Maintain educational context and technical terminology accuracy:

Text: "{text}"

Provide a natural, accurate English translation.""",

                "ask_questions": f"""Generate 3-5 thoughtful questions about the following text that would help a student better understand the material and test their comprehension:

Text: "{text}"

Create questions that encourage critical thinking and deeper understanding."""
            }
            
            prompt = action_prompts.get(action, action_prompts["explanation"])
            
            # Add lesson context if available
            if lesson_context:
                prompt += f"\n\nLesson context: {lesson_context}"
            
            # Prepare messages
            messages = [
                {"role": "system", "content": "You are an AI educational assistant specializing in providing quick, helpful explanations and assistance for students. Keep responses focused, clear, and educational."},
                {"role": "user", "content": prompt}
            ]
            
            # Add user context if available
            if user_context:
                context_message = self._build_context_message(user_context)
                if context_message:
                    messages.insert(1, context_message)
            
            # Optimize token limits based on action type for better responses
            token_limits = {
                "explanation": 350,      # Needs more tokens for detailed explanations
                "summary": 180,          # Concise summaries but enough detail
                "translate_vi": 280,     # Translation might need more space for Vietnamese
                "translate_en": 280,     # Translation might need more space for English  
                "ask_questions": 250     # Multiple questions need adequate space
            }
            
            max_tokens = token_limits.get(action, 250)  # Default fallback
            
            # Make API call with optimized token limit
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.7,
                stream=False
            )
            
            # Extract response and token usage
            content = response.choices[0].message.content.strip()
            tokens_used = response.usage.total_tokens
            
            logger.info(f"AI inline assistance successful. Action: {action}, Tokens used: {tokens_used}")
            return content, tokens_used
            
        except Exception as e:
            logger.error(f"Error in AI inline assistance: {e}")
            raise Exception(f"Failed to generate {action} assistance. Please try again.")

    async def personalized_learning_suggestions(
        self, 
        user_data: Dict[str, Any]
    ) -> tuple[Dict[str, str], int]:
        """
        Generate personalized learning suggestions based on user data
        
        Args:
            user_data: Dictionary containing user learning data
            
        Returns:
            tuple: (suggestions_dict, tokens_used)
        """
        try:
            # Build comprehensive user context
            user_summary = self._build_user_learning_summary(user_data)
            
            prompt = f"""Based on the following student learning data, provide personalized educational recommendations:

{user_summary}

Please provide:
1. NEXT LESSON SUGGESTION: Recommend specific topics or subjects to study next based on their learning history and gaps
2. LEARNING TIPS: Provide 3-4 actionable tips to improve their learning effectiveness based on their patterns
3. KNOWLEDGE GAPS: Identify areas where the student might need additional focus or review
4. PROGRESS SUMMARY: Briefly summarize their current learning progress and achievements

Keep each section concise but actionable. Focus on educational growth and personalized guidance."""
            
            # Prepare messages
            messages = [
                {"role": "system", "content": "You are an AI educational advisor specializing in personalized learning recommendations. Analyze student data to provide tailored guidance for optimal learning outcomes."},
                {"role": "user", "content": prompt}
            ]
            
            # Make API call with optimized tokens for comprehensive suggestions
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=100,  # Adequate tokens for 4 detailed sections
                temperature=0.6,
                stream=False
            )
            
            # Parse response into structured format
            content = response.choices[0].message.content.strip()
            tokens_used = response.usage.total_tokens
            
            # Parse the response into sections
            suggestions = self._parse_learning_suggestions(content)
            
            logger.info(f"Personalized learning suggestions generated. Tokens used: {tokens_used}")
            return suggestions, tokens_used
            
        except Exception as e:
            logger.error(f"Error generating personalized learning suggestions: {e}")
            raise Exception("Failed to generate learning suggestions. Please try again.")

    def _build_user_learning_summary(self, user_data: Dict[str, Any]) -> str:
        """Build a comprehensive summary of user learning data"""
        summary_parts = []
        
        # Basic user info
        if user_data.get("name"):
            summary_parts.append(f"Student: {user_data['name']}")
        
        # Learning statistics
        stats = user_data.get("stats", {})
        if stats:
            summary_parts.append(f"Learning Statistics:")
            summary_parts.append(f"- Total lessons completed: {stats.get('total_lessons', 0)}")
            summary_parts.append(f"- Notes created: {stats.get('total_notes', 0)}")
            summary_parts.append(f"- Categories studied: {stats.get('total_categories', 0)}")
            summary_parts.append(f"- Learning streak: {stats.get('learning_streak', 0)} days")
        
        # Recent activity
        recent_lessons = user_data.get("recent_lessons", [])
        if recent_lessons:
            summary_parts.append(f"Recent lessons studied: {', '.join(recent_lessons[:5])}")
        
        # Categories with focus
        category_focus = user_data.get("category_distribution", [])
        if category_focus:
            top_categories = [f"{cat['name']} ({cat['note_count']} notes)" for cat in category_focus[:3]]
            summary_parts.append(f"Main study areas: {', '.join(top_categories)}")
        
        # Learning goals
        goals = user_data.get("learning_goals", [])
        if goals:
            active_goals = [goal["description"] for goal in goals if goal.get("is_active")][:3]
            if active_goals:
                summary_parts.append(f"Current learning goals: {', '.join(active_goals)}")
        
        # Recent quiz performance
        quiz_performance = user_data.get("quiz_performance", {})
        if quiz_performance:
            summary_parts.append(f"Recent quiz performance: {quiz_performance.get('average_score', 'N/A')}% average")
        
        return "\n".join(summary_parts)

    def _parse_learning_suggestions(self, content: str) -> Dict[str, str]:
        """Parse AI response into structured suggestions"""
        suggestions = {
            "next_lesson_suggestion": "",
            "learning_tips": "",
            "knowledge_gaps": "",
            "user_progress_summary": ""
        }
        
        # Simple parsing based on section headers
        sections = content.split("\n")
        current_section = ""
        
        for line in sections:
            line = line.strip()
            if not line:
                continue
                
            # Detect section headers
            line_lower = line.lower()
            if "next lesson" in line_lower or "recommendation" in line_lower:
                current_section = "next_lesson_suggestion"
                continue
            elif "tip" in line_lower or "learning" in line_lower and "tip" in line_lower:
                current_section = "learning_tips"
                continue
            elif "gap" in line_lower or "knowledge" in line_lower:
                current_section = "knowledge_gaps"
                continue
            elif "progress" in line_lower or "summary" in line_lower:
                current_section = "user_progress_summary"
                continue
            
            # Add content to current section
            if current_section and line:
                if suggestions[current_section]:
                    suggestions[current_section] += "\n" + line
                else:
                    suggestions[current_section] = line
        
        # Fallback: if parsing fails, put everything in next lesson suggestion
        if not any(suggestions.values()):
            suggestions["next_lesson_suggestion"] = content
        
        return suggestions

# Create singleton instance
openai_service = OpenAIService() 