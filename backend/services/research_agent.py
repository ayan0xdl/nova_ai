import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GENAI_API_KEY = os.getenv("GEMINI_API_KEY")
if GENAI_API_KEY:
    genai.configure(api_key=GENAI_API_KEY)

MODEL_NAME = "gemini-2.5-flash" # Switched to flash to avoid free-tier quota limits

def get_model():
    return genai.GenerativeModel(MODEL_NAME)

def perform_deep_research(jd_text: str) -> dict:
    """
    Analyzes the Job Description to extract not just explicit requirements, but "Hidden Requirements"
    based on market trends, typical necessary integrations, and unstated soft skills needed.
    """
    model = get_model()
    
    prompt = f"""
    You are an elite, highly experienced Senior Technical Recruiter and Industry Analyst.
    Your task is to perform "Deep Research" on the following Job Description (JD) to extract the *true* underlying needs of the role, including things that are NOT explicitly stated but are required in reality.
    
    Job Description:
    {jd_text}
    
    Analyze the JD and return a JSON object with EXACTLY this structure:
    {{
        "core_stated_skills": ["skill1", "skill2"],
        "hidden_market_requirements": ["<e.g., If React is mentioned, state state-management like Redux/Zustand is implicitly needed>", "<e.g., If Docker is mentioned, CI/CD knowledge is a hidden requirement>"],
        "key_soft_skills_inferred": ["<Based on the tone of the JD, what soft skills are really needed?>"],
        "red_flag_topics_to_probe": ["<What are common areas candidates lie about for this stack that we should grill them on?>"]
    }}
    
    Respond ONLY with valid JSON. Do not include markdown formatting like ```json.
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        print(f"Error in deep research: {e}")
        return {
            "core_stated_skills": [],
            "hidden_market_requirements": ["Advanced debugging", "System architecture"],
            "key_soft_skills_inferred": ["Adaptability"],
            "red_flag_topics_to_probe": ["Depth of experience vs just tutorials"]
        }
