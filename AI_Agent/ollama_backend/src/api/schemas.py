"""
Pydantic schemas for API requests and responses
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class Message(BaseModel):
    role: str = Field(..., description="Role of the message sender")
    content: str = Field(..., description="Content of the message")

class CompletionRequest(BaseModel):
    model: str = Field(..., description="Model ID to use")
    prompt: str = Field(..., description="Prompt for completion")
    system_prompt: Optional[str] = Field(None, description="System prompt")
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(2048, ge=1, le=32768)
    stream: bool = Field(False, description="Stream responses")

class ChatRequest(BaseModel):
    model: str = Field(..., description="Model ID to use")
    messages: List[Message] = Field(..., description="Chat messages")
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(2048, ge=1, le=32768)
    stream: bool = Field(False, description="Stream responses")

class Choice(BaseModel):
    text: str
    index: int = 0

class Usage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

class CompletionResponse(BaseModel):
    model: str
    choices: List[Choice]
    usage: Usage

class ChatChoice(BaseModel):
    message: Message
    index: int = 0
    finish_reason: Optional[str] = None

class ChatResponse(BaseModel):
    model: str
    choices: List[ChatChoice]
    usage: Usage

class ModelInfo(BaseModel):
    id: str
    name: str
    context_window: int
    supports_images: bool = False
