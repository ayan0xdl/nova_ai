import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import tempfile
from typing import Optional, List

# Adjust the path so we can import parser_engine
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from parser_engine import output
from services import llm_service
from services import research_agent

app = FastAPI(title="HIRION API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MatchRequest(BaseModel):
    jd_text: str
    resume_data: dict

class FirstQuestionRequest(BaseModel):
    jd_text: str
    resume_data: dict
    deep_research: dict

class NextQuestionRequest(BaseModel):
    jd_text: str
    deep_research: dict
    resume_data: dict
    qa_history: List[dict] # [{"question": "...", "answer": "..."}]
    question_index: int

class EvaluationRequest(BaseModel):
    jd_text: str
    resume_data: dict
    qa_history: List[dict]

@app.post("/api/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    try:
        # Save uploaded file to a temporary location
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        # Extract raw text using the parser
        from parser_engine import parser
        raw_text = parser.get_text(tmp_path)
        
        # Parse resume using the highly accurate LLM engine
        parsed_data = llm_service.parse_resume_with_llm(raw_text)
        
        # Clean up temp file
        os.unlink(tmp_path)
        
        return {"status": "success", "data": parsed_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/match-jd")
async def match_jd(request: MatchRequest):
    try:
        # Run standard JD vs CV matching
        match_result = llm_service.match_jd_and_cv(request.jd_text, request.resume_data)
        
        # Concurrently or sequentially run deep research on JD
        deep_research_result = research_agent.perform_deep_research(request.jd_text)
        
        return {
            "status": "success", 
            "result": match_result,
            "deep_research": deep_research_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/first-question")
async def generate_first_question(request: FirstQuestionRequest):
    try:
        first_q = llm_service.generate_first_question(request.jd_text, request.resume_data, request.deep_research)
        return {"status": "success", "question": first_q}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/next-question")
async def generate_next_question(request: NextQuestionRequest):
    try:
        adaptive_data = llm_service.generate_next_question_adaptive(
            request.jd_text, 
            request.deep_research, 
            request.resume_data, 
            request.qa_history,
            request.question_index
        )
        return {"status": "success", "adaptive_data": adaptive_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/evaluate-interview")
async def evaluate_interview(request: EvaluationRequest):
    try:
        evaluation = llm_service.evaluate_interview(request.jd_text, request.resume_data, request.qa_history)
        return {"status": "success", "evaluation": evaluation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
