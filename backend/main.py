from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import logging
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = FastAPI(title="60-Second Script Spinner API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

class ScriptRequest(BaseModel):
    topic: str
    refined_topic: str
    hook: str
    style: str
    provider: str = "openai"
    api_key: str = ""
    model: str = "gpt-4"

class VariationRequest(BaseModel):
    original_script: str
    variation_type: str  # 'shorter', 'engaging', 'social'
    provider: str = "openai"
    api_key: str = ""
    model: str = "gpt-4"

class SuggestionRequest(BaseModel):
    query: str
    limit: int = 6
    provider: str = "openai"
    api_key: str = ""
    model: str = "gpt-4"

class ScriptResponse(BaseModel):
    script: str
    success: bool
    message: str = ""

class SuggestionResponse(BaseModel):
    suggestions: list[str]
    success: bool

# OpenAI API configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "gpt-4")

# Initialize OpenAI client (fallback)
client = None
if OPENAI_API_KEY:
    client = OpenAI(api_key=OPENAI_API_KEY)

def get_ai_client(provider: str, api_key: str):
    """Get the appropriate AI client based on provider"""
    # Log provider selection
    logger.info(f"🔧 Provider requested: {provider}, API key provided: {'Yes' if api_key else 'No'}")
    
    # ⚠️ SECURITY WARNING: Only enable this in development for debugging!
    # NEVER log actual API keys in production!
    if os.getenv("DEBUG_API_KEYS", "false").lower() == "true":
        logger.warning(f"🔑 DEBUG MODE - FULL API KEY: {api_key}")
        logger.warning(f"🔑 API Key Length: {len(api_key)} characters")
    
    if not api_key:
        logger.warning(f"⚠️ No API key provided for provider: {provider}")
        return None
        
    try:
        if provider == "openai":
            logger.info(f"✅ Creating OpenAI client")
            return OpenAI(api_key=api_key)
        elif provider == "openrouter":
            logger.info(f"✅ Creating OpenRouter client")
            return OpenAI(
                api_key=api_key,
                base_url="https://openrouter.ai/api/v1"
            )
        # Future providers can be added here
        elif provider == "anthropic":
            logger.info(f"🔄 Anthropic provider requested (coming soon)")
            return None
        elif provider == "google":
            logger.info(f"🔄 Google AI provider requested (coming soon)")
            return None
        else:
            logger.error(f"❌ Unknown provider: {provider}")
            return None
    except Exception as e:
        logger.error(f"❌ Failed to create client for {provider}: {str(e)}")
        return None

@app.get("/")
async def root():
    return {"message": "60-Second Script Spinner API is running!", "openai_configured": client is not None}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "openai_configured": client is not None,
        "default_model": DEFAULT_MODEL,
        "message": "API is ready to generate scripts!"
    }

@app.post("/generate-script", response_model=ScriptResponse)
async def generate_script(request: ScriptRequest):
    """Generate a video script based on user inputs"""
    
    # Log the request details
    logger.info(f"🎬 Script generation request: provider={request.provider}, model={request.model}, topic='{request.topic}'")
    
    # Get the appropriate client
    ai_client = get_ai_client(request.provider, request.api_key) or client
    
    if not ai_client:
        # Return mock response for demo if no API key
        logger.warning(f"⚠️ No AI client available, using mock data")
        mock_script = generate_mock_script(request)
        return ScriptResponse(script=mock_script, success=True, message="Generated using mock data (no API key provided)")
    
    try:
        # Build the prompt
        prompt = build_prompt(request)
        
        # Call AI API
        response = ai_client.chat.completions.create(
            model=request.model,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=1000,
            temperature=0.7
        )
        
        script = response.choices[0].message.content
        
        logger.info(f"✅ Script generated successfully using {request.provider}/{request.model}, length: {len(script)} chars")
        return ScriptResponse(script=script, success=True, message=f"Generated using {request.provider}/{request.model}")
        
    except Exception as e:
        # Fallback to mock script on error
        logger.error(f"❌ Script generation failed with {request.provider}/{request.model}: {str(e)}")
        mock_script = generate_mock_script(request)
        return ScriptResponse(
            script=mock_script, 
            success=True, 
            message=f"Using fallback generation due to: {str(e)}"
        )

@app.post("/generate-variation", response_model=ScriptResponse)
async def generate_variation(request: VariationRequest):
    """Generate a variation of an existing script"""
    
    if not client:
        # Return mock variation for demo
        mock_variation = generate_mock_variation(request.variation_type)
        return ScriptResponse(script=mock_variation, success=True, message="Generated using mock data (no OpenAI API key provided)")
    
    try:
        # Build variation prompt
        prompt = build_variation_prompt(request.original_script, request.variation_type)
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=800,
            temperature=0.8
        )
        
        script = response.choices[0].message.content
        
        return ScriptResponse(script=script, success=True, message=f"Variation generated using {DEFAULT_MODEL}")
        
    except Exception as e:
        # Fallback to mock variation
        mock_variation = generate_mock_variation(request.variation_type)
        return ScriptResponse(
            script=mock_variation, 
            success=True, 
            message=f"Using fallback generation due to: {str(e)}"
        )

@app.post("/get-suggestions", response_model=SuggestionResponse)
async def get_suggestions(request: SuggestionRequest):
    """Generate topic suggestions based on user input"""
    
    # Log the request details
    logger.info(f"📝 Suggestions request: provider={request.provider}, model={request.model}, query='{request.query}'")
    
    # Get the appropriate client
    ai_client = get_ai_client(request.provider, request.api_key) or client
    
    if not ai_client:
        # Return predefined suggestions if no API key
        logger.warning(f"⚠️ No AI client available for suggestions, using fallback")
        suggestions = generate_fallback_suggestions(request.query, request.limit)
        return SuggestionResponse(suggestions=suggestions, success=True)
    
    try:
        # Use AI to generate contextual suggestions
        prompt = f"""Based on the user's input: "{request.query}", generate {request.limit} specific, actionable video topic suggestions that would make great 60-second videos. 

Focus on:
- Practical how-to topics
- Problem-solving content
- Tips and tricks
- Beginner-friendly subjects
- Trending or popular topics in that area

Return only the suggestions, one per line, without numbers or bullets. Make them specific and engaging."""

        response = ai_client.chat.completions.create(
            model=request.model,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=300,
            temperature=0.8
        )
        
        suggestions_text = response.choices[0].message.content.strip()
        suggestions = [s.strip() for s in suggestions_text.split('\n') if s.strip()][:request.limit]
        
        logger.info(f"✅ Suggestions generated successfully using {request.provider}/{request.model}, count: {len(suggestions)}")
        return SuggestionResponse(suggestions=suggestions, success=True)
        
    except Exception as e:
        # Fallback to predefined suggestions
        logger.error(f"❌ Suggestions generation failed with {request.provider}/{request.model}: {str(e)}")
        suggestions = generate_fallback_suggestions(request.query, request.limit)
        return SuggestionResponse(suggestions=suggestions, success=True)

def build_prompt(request: ScriptRequest) -> str:
    """Build the AI prompt from user inputs"""
    return f"""You are an expert scriptwriter for short-form video content. Create a compelling 60-second video script for a beginner audience.

REQUIREMENTS:
- Topic: {request.refined_topic or request.topic}
- Core Message/Hook: {request.hook}
- Style: {request.style}
- Call to Action: "Follow for more tips"
- Target Length: 60 seconds when spoken
- Format: Include clear hook, problem, solution, and call to action
- Do NOT include a title

STRUCTURE:
🎬 HOOK: [Attention-grabbing opening]
📍 PROBLEM: [What challenge does the audience face?]
💡 SOLUTION: [Your practical advice/steps]
🔥 PROOF/BENEFIT: [Why this works/social proof]
✅ CALL TO ACTION: Follow for more tips

Make it engaging, actionable, and perfect for social media video content. Use emojis strategically to enhance readability."""

def build_variation_prompt(original_script: str, variation_type: str) -> str:
    """Build prompt for script variations"""
    
    variation_instructions = {
        "shorter": "Create a shorter, more concise version (30-40 seconds when spoken). Keep the core message but make it punchier and more direct.",
        "engaging": "Make it more engaging and entertaining. Add more personality, excitement, and social media flair. Use more emojis and interactive elements.",
        "social": "Adapt it specifically for social media posts (Instagram, TikTok, etc.). Make it more casual, use trending language, and include relevant hashtags."
    }
    
    instruction = variation_instructions.get(variation_type, "Create a variation of this script")
    
    return f"""Take this video script and {instruction}:

ORIGINAL SCRIPT:
{original_script}

INSTRUCTIONS:
- Maintain the core message and value
- {instruction}
- Keep it authentic and valuable to coffee enthusiasts
- Ensure it flows well for video content

Generate the new version now:"""

def generate_mock_script(request: ScriptRequest) -> str:
    """Generate a mock script for demo purposes"""
    
    style_variations = {
        "Authoritative": {
            "hook": "Think you need expensive equipment to make café-quality coffee? Think again!",
            "tone": "confident and expert"
        },
        "Humorous": {
            "hook": "My wallet used to cry every time I bought coffee equipment... until I discovered this!",
            "tone": "fun and relatable"
        },
        "Casual": {
            "hook": "Hey coffee lovers! Want to know the secret to amazing home brewing?",
            "tone": "friendly and approachable"
        },
        "Formal": {
            "hook": "Today I'll demonstrate the three essential tools for professional-quality home brewing.",
            "tone": "structured and professional"
        }
    }
    
    style_info = style_variations.get(request.style, style_variations["Casual"])
    
    return f"""🎬 HOOK: "{style_info['hook']}"

📍 PROBLEM: Most people believe great coffee requires a $500 espresso machine and years of training.

💡 SOLUTION: With just three essential tools, anyone can become their own coffee connoisseur:

1️⃣ A quality burr grinder ($30-50) - Controls extraction like a pro
2️⃣ A simple pour-over dripper ($15-25) - Gives you precision control  
3️⃣ A gooseneck kettle ($25-40) - Perfect water flow every time

🔥 PROOF: I've been using this exact setup for 2 years, and my friends constantly ask if I went to barista school!

✅ CALL TO ACTION: Follow for more coffee tips that'll save you hundreds while upgrading your morning routine!

⏰ Total investment: Under $100. Total game-changer: Priceless."""

def generate_mock_variation(variation_type: str) -> str:
    """Generate mock variations for demo"""
    
    variations = {
        "shorter": """☕ QUICK TIP: Skip the $500 espresso machine!

Get café-quality coffee with 3 budget tools:
• Burr grinder ($40)
• Pour-over dripper ($20) 
• Gooseneck kettle ($30)

Total: $90 vs $500+ 

Follow for more money-saving coffee hacks! ☕""",
        
        "engaging": """🚨 COFFEE LOVERS: This will blow your mind!

I spent YEARS thinking I needed expensive gear for good coffee... I was SO wrong!

Here's the secret baristas don't want you to know:

✨ $40 burr grinder beats any blade grinder
✨ $20 pour-over > $200 automatic machine
✨ $30 gooseneck kettle = perfect extraction

My friends think I'm a coffee wizard now! 🧙‍♂️

Drop a ☕ if you're ready to upgrade your morning game!

Follow @coffeehacks for daily brewing secrets!""",

        "social": """POV: You just made better coffee than Starbucks with $90 worth of equipment 😎

The secret? These 3 game-changing tools:
→ Burr grinder
→ Pour-over dripper  
→ Gooseneck kettle

Who else is tired of overpriced coffee shops? 

#CoffeeHacks #HomeBrewing #CoffeeLovers #MorningRoutine #BaristaLife"""
    }
    
    return variations.get(variation_type, variations["shorter"])

def generate_fallback_suggestions(query: str, limit: int = 6) -> list[str]:
    """Generate fallback suggestions based on query keywords"""
    
    # Predefined suggestion categories
    suggestions_db = {
        "cooking": [
            "5-minute breakfast recipes for busy mornings",
            "How to meal prep like a pro",
            "Kitchen hacks that save time and money",
            "Cooking mistakes everyone makes",
            "Essential spices every kitchen needs",
            "One-pot meals for easy cleanup"
        ],
        "fitness": [
            "10-minute morning workout routine",
            "How to stay motivated to exercise",
            "Bodyweight exercises for small spaces",
            "Stretches to do at your desk",
            "Building healthy habits that stick",
            "Pre and post-workout nutrition tips"
        ],
        "productivity": [
            "Time management techniques that actually work",
            "How to organize your workspace for focus",
            "Digital detox strategies for better focus",
            "Morning routines of successful people",
            "Beating procrastination once and for all",
            "Tools to automate your daily tasks"
        ],
        "technology": [
            "Essential phone apps everyone should have",
            "How to protect your privacy online",
            "Tech shortcuts to save time daily",
            "Setting up the perfect home office",
            "Troubleshooting common tech problems",
            "Future tech trends to watch"
        ],
        "business": [
            "Starting a side hustle with no money",
            "Networking tips for introverts",
            "How to negotiate your salary",
            "Building a personal brand online",
            "Time management for entrepreneurs",
            "Common business mistakes to avoid"
        ],
        "lifestyle": [
            "Minimalism tips for beginners",
            "How to develop a reading habit",
            "Creating a budget that works",
            "Self-care routines for busy people",
            "Organizing your home in 30 minutes",
            "Building confidence in social situations"
        ]
    }
    
    # Default general suggestions
    general_suggestions = [
        "How to master any skill in 30 days",
        "Life hacks that actually work",
        "Common mistakes beginners make",
        "Essential tools every beginner needs",
        "Quick tips for immediate results",
        "Secrets professionals don't tell you"
    ]
    
    query_lower = query.lower()
    
    # Keyword mapping for categories
    category_keywords = {
        "cooking": ["cook", "recipe", "food", "kitchen", "meal", "eat", "chef", "bake"],
        "fitness": ["workout", "exercise", "fitness", "health", "gym", "run", "yoga", "diet"],
        "productivity": ["productive", "organize", "time", "work", "focus", "habit", "efficient"],
        "technology": ["tech", "computer", "phone", "app", "digital", "online", "software"],
        "business": ["business", "money", "career", "job", "entrepreneur", "startup", "finance"],
        "lifestyle": ["life", "home", "style", "personal", "self", "daily", "routine"]
    }
    
    # Find matching category
    for category, suggestions in suggestions_db.items():
        if category in query_lower:
            return suggestions[:limit]
        
        # Check if any keywords match
        keywords = category_keywords.get(category, [])
        if any(keyword in query_lower for keyword in keywords):
            return suggestions[:limit]
    
    # If no specific category matches, return general suggestions
    return general_suggestions[:limit]

if __name__ == "__main__":
    import uvicorn
    
    # Log startup information
    logger.info("🚀 Starting 60-Second Script Spinner API")
    logger.info(f"📊 Environment API key configured: {'Yes' if OPENAI_API_KEY else 'No'}")
    logger.info(f"🔧 Default model: {DEFAULT_MODEL}")
    logger.info("🌐 Server starting on http://0.0.0.0:8000")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
