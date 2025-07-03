import os
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
import torch

router = APIRouter(prefix="/ask-ai", tags=["ai"])

class AIRequest(BaseModel):
    question: str

load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")
model = AutoModelForSeq2SeqLM.from_pretrained("Adisauz/flan-t5-recipes", token=HF_TOKEN)
tokenizer = AutoTokenizer.from_pretrained("Adisauz/flan-t5-recipes", token=HF_TOKEN)

def get_ai_answer(prompt: str) -> str:
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, padding=True)
    outputs = model.generate(**inputs, max_new_tokens=100)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

@router.post("/")
async def ask_ai(request: AIRequest):
    try:
        answer = get_ai_answer(request.question)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 