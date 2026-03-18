import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini API
GENAI_API_KEY = os.getenv("GEMINI_API_KEY")
if GENAI_API_KEY:
    genai.configure(api_key=GENAI_API_KEY)
else:
    print("WARNING: GEMINI_API_KEY not found in environment variables.")

# Use Gemini 2.5 Flash as standard for the hackathon
MODEL_NAME = "gemini-3.1-flash-lite-preview"

def get_model():
    return genai.GenerativeModel(MODEL_NAME)

def match_jd_and_cv(jd_text: str, resume_data: dict) -> dict:
    """
    Matches the JD with the CV and returns a fit score and reasoning.
    """
    model = get_model()
    
    prompt = f"""
    You are an expert HR recruiter AI. 
    Analyze the following Job Description (JD) and the extracted resume data.
    
    Job Description:
    {jd_text}
    
    Resume Data:
    {json.dumps(resume_data, indent=2)}
    
    Evaluate the candidate's fit for the role. Return a JSON object with EXACTLY this structure:
    {{
        "fit_score": <integer from 0 to 100>,
        "reasoning": "<string explaining the score, highlighting pros and cons>",
        "missing_skills": ["<skill1>", "<skill2>"]
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
        print(f"Error in match_jd_and_cv: {e}")
        return {"fit_score": 0, "reasoning": "Error generating match evaluation due to API Quota limits. Please wait a minute and try again.", "missing_skills": []}

def parse_resume_with_llm(raw_text: str) -> dict:
    """
    Replaces the brittle SpaCy NER parser. Uses LLM to extract perfectly structured JSON from raw text.
    """
    model = get_model()
    prompt = f"""
    You are an expert HR Data Extraction AI. 
    Analyze the following raw text extracted from a parsed PDF resume.
    
    Raw Text:
    {raw_text}
    
    Extract the candidate's information and return a JSON object with EXACTLY this structure:
    {{
        "candidate_name": "<string>",
        "Email": "<string>",
        "Phone": "<string>",
        "LinkedIn": "<string>",
        "portfolio": "<string>",
        "address": "<string>",
        "education": [
            {{"university": "<string>", "degree": "<string>", "graduation_date": "<string>"}}
        ],
        "professional_experience": [
            {{"company_name": "<string>", "role": "<string>", "start_end_date": "<string>", "description": "<string>"}}
        ],
        "technical_skills": ["<skill1>", "<skill2>"],
        "soft_skills": ["<skill1>", "<skill2>"],
        "projects": [
            {{"name": "<string>", "description": "<string>"}}
        ],
        "certifications": ["<cert1>", "<cert2>"]
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
        print(f"Error in parse_resume_with_llm: {e}")
        return {
            "candidate_name": "Error Parsing Resume",
            "Email": "",
            "professional_experience": [],
            "education": [],
            "technical_skills": []
        }

def generate_first_question(jd_text: str, resume_data: dict, deep_research: dict) -> str:
    """
    Generates just the very first personalized ice-breaker/introductory question.
    """
    model = get_model()
    
    prompt = f"""
    You are an expert HR Technical Interviewer.
    Based on the following Job Description, Deep Market Research, and the candidate's Resume Data, generate the VERY FIRST interview question.
    This should be a personalized, BASIC and EASY ice-breaker that touches on their background and introduces them to a core stated skill. The goal is to build their confidence at the start of the interview before increasing the difficulty.
    
    CRITICAL TONE INSTRUCTION FOR REALISM & EMOTION:
    Do NOT sound like an AI or use stiff, corporate jargon. Speak exactly like a supportive, empathetic human being chatting over a Zoom call.
    - Start naturally with genuine warmth (e.g., "Hi there!", "It's so great to meet you.", "Wow, I was just checking out your background...").
    - Use conversational fillers naturally ("Um", "Ah", "Okay", "So...").
    - Express human emotion, enthusiasm, or thoughtfulness (e.g., "That's really impressive", "I'd love to hear more about").
    - NEVER use hyphens (-), dashes, or semicolons (;). They make the voice engine glitch and sound robotic. Use commas or ellipses (...) for natural speaking pauses.
    - Keep the phrasing casual, warm, and highly engaging.
    
    Job Description:
    {jd_text}
    
    Deep Research Insights:
    {json.dumps(deep_research)}
    
    Resume Data:
    {json.dumps(resume_data)}
    
    Return ONLY a single string (the spoken question itself). No JSON, no quotes, just the conversational spoken text.
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Remove quotes if the model wrapped it in quotes
        if text.startswith('"') and text.endswith('"'):
            text = text[1:-1]
        return text
    except Exception as e:
        print(f"Error in generate_first_question: {e}")
        return "Could you introduce yourself and walk me through your relevant experience?"

def generate_next_question_adaptive(jd_text: str, deep_research: dict, resume_data: dict, qa_history: list, question_index: int) -> dict:
    """
    Analyzes the latest answer, flags any BS, and generates the next follow-up question.
    """
    model = get_model()
    
    latest_qa = qa_history[-1] if qa_history else None
    
    prompt = f"""
    You are an expert, piercing HR Technical Interviewer. 
    You are conducting question #{question_index + 1} of the interview.
    
    Context:
    - Deep Research Insights: {json.dumps(deep_research)}
    - Candidate Resume Summary: {json.dumps(resume_data.get('summary', ''))}
    
    Here is what you just asked: "{latest_qa['question'] if latest_qa else 'N/A'}"
    Here is how the candidate answered: "{latest_qa['answer'] if latest_qa else 'N/A'}"
    
    Task 1: REAL-TIME FACT CHECK & BS DETECTION
    Evaluate their latest answer. Did they confidently state something contradictory, highly improbable, or factually incorrect given their resume? Are they using too many buzzwords without substance?
    Provide a boolean `is_bs_flagged`, a `confidence_score` (0-100, where 100 means they sounded incredibly competent and truthful, 0 means total BS), and a brief `eval_reasoning`.

    Task 2: GENERATE NEXT QUESTION
    If they gave a weak or suspicious answer, drill down into it! Ask for specific examples.
    If they gave a great answer, pivot to a new topic from the Deep Research Insights.
    CRITICAL INSTRUCTION: The difficulty of the questions MUST PROGRESSIVELY INCREASE. Since this is question #{question_index + 1}/5, the technical depth and difficulty MUST be noticeably harder and more advanced than the previous questions.
    If this is question #5 (the final question), wrap it up or ask a highly advanced, high-level system design or situational question.
    
    CRITICAL TONE INSTRUCTION FOR REALISM & EMOTION:
    Do NOT sound like a robotic script or use formal corporate jargon. Speak exactly like an empathetic, thoughtful human interviewer.
    - Acknowledge their previous answer with genuine human emotion (e.g., "Wow, that's a really fascinating approach.", "Hmm, I see exactly what you mean.", "Ah, okay, that makes total sense.").
    - Use natural conversational fillers ("Um", "Right", "Okay", "So...").
    - NEVER use hyphens (-), dashes, or semicolons (;). They break the text-to-speech engine's natural flow. Use commas or ellipses (...) to simulate organic breathing pauses.
    - Keep your tone casual, genuinely curious, and warm.
    
    Return a JSON object with EXACTLY this structure:
    {{
        "is_bs_flagged": <boolean>,
        "confidence_score": <integer 0-100>,
        "eval_reasoning": "<brief internal thought on their answer>",
        "next_question": "<the actual text of the next question to ask them>"
    }}
    
    Respond ONLY with valid JSON.
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
        print(f"Error in generate_next_question_adaptive: {e}")
        return {
            "is_bs_flagged": False,
            "confidence_score": 50,
            "eval_reasoning": "Fallback due to API error.",
            "next_question": "Can you provide a specific example of a time you overcame a major technical hurdle?"
        }

def evaluate_interview(jd_text: str, resume_data: dict, qa_history: list) -> dict:
    """
    Evaluates the complete interview and generates a scorecard.
    """
    model = get_model()
    
    prompt = f"""
    You are an expert HR evaluator. Evaluate the following interview based on the JD and candidate's resume.
    
    Job Description:
    {jd_text}
    
    Resume Data:
    {json.dumps(resume_data, indent=2)}
    
    Interview Q&A History:
    {json.dumps(qa_history, indent=2)}
    
    Return a JSON object with EXACTLY this structure:
    {{
        "overall_score": <integer from 0 to 100>,
        "technical_rating": "<Poor|Fair|Good|Excellent>",
        "communication_rating": "<Poor|Fair|Good|Excellent>",
        "radar_metrics": {{
            "Problem Solving": <integer 0-100>,
            "Technical Depth": <integer 0-100>,
            "Communication": <integer 0-100>,
            "Adaptability": <integer 0-100>,
            "System Design": <integer 0-100>
        }},
        "strengths": ["<strength1>", "<strength2>"],
        "areas_for_improvement": ["<area1>", "<area2>"],
        "roadmap_steps": [
            {{"timeframe": "3 Months", "focus": "<specific actionable goal based on weak points>"}},
            {{"timeframe": "6 Months", "focus": "<mid-term skill acquisition>"}},
            {{"timeframe": "12 Months", "focus": "<long-term mastery goal>"}}
        ],
        "final_recommendation": "<Hire|Hold|Reject>",
        "summary": "<A brief summary paragraph for the recruiter>",
        "market_value_estimate": "<A realistic base salary range in USD based on their demonstrated interview skill level, e.g., '$110,000 - $130,000'>",
        "alternative_role_pivot": "<If they are not a perfect fit for this JD, what OTHER role are they a perfect fit for based on their answers? Be extremely specific. If they are a perfect fit, just say 'N/A: Direct Fit'>"
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
        print(f"Error in evaluate_interview: {e}")
        return {
            "overall_score": 0,
            "technical_rating": "N/A",
            "communication_rating": "N/A",
            "radar_metrics": { "Problem Solving": 0, "Technical Depth": 0, "Communication": 0, "Adaptability": 0, "System Design": 0 },
            "strengths": [],
            "areas_for_improvement": [],
            "roadmap_steps": [],
            "final_recommendation": "Hold",
            "summary": "Error generating evaluation.",
            "market_value_estimate": "N/A",
            "alternative_role_pivot": "N/A"
        }
