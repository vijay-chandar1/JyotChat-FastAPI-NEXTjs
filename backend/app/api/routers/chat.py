from pydantic import BaseModel
from typing import List, Any, Optional, Dict, Tuple
from fastapi import APIRouter, Depends, HTTPException, Request, status
from llama_index.core.chat_engine.types import (
    BaseChatEngine,
    StreamingAgentChatResponse,
)
from llama_index.core.schema import NodeWithScore
from llama_index.core.llms import ChatMessage, MessageRole
from app.engine import get_chat_engine
from app.api.routers.vercel_response import VercelStreamResponse
from app.api.routers.messaging import EventCallbackHandler
from aiostream import stream
from datetime import datetime
import os
import hashlib

chat_router = r = APIRouter()

ENABLE_LOGGING = True
HASH_KEY = "jyotchat"  # Your fixed hash key

def hash_ip(ip_address: str) -> str:
    # Create a hash object
    hash_object = hashlib.sha256()
    # Update the hash object with the IP address and fixed key
    hash_object.update((ip_address + HASH_KEY).encode('utf-8'))
    # Return the hexadecimal digest of the hash
    return hash_object.hexdigest()

def get_log_file_path(client_id: str) -> str:
    hashed_ip = hash_ip(client_id)
    return f"output_{hashed_ip}.txt"

def log_to_file(file_path: str, data: str):
    if ENABLE_LOGGING:
        with open(file_path, "a", encoding="utf-8") as f:
            f.write(data + "\n")

def clear_file_if_not_empty(file_path: str):
    if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
        open(file_path, "w").close()

class _Message(BaseModel):
    role: MessageRole
    content: str

class _ChatData(BaseModel):
    messages: List[_Message]

    class Config:
        json_schema_extra = {
            "example": {
                "messages": [
                    {
                        "role": "user",
                        "content": "What standards for letters exist?",
                    }
                ]
            }
        }

class _SourceNodes(BaseModel):
    id: str
    metadata: Dict[str, Any]
    score: Optional[float]
    text: str

    @classmethod
    def from_source_node(cls, source_node: NodeWithScore):
        return cls(
            id=source_node.node.node_id,
            metadata=source_node.node.metadata,
            score=source_node.score,
            text=source_node.node.text,  # type: ignore
        )

    @classmethod
    def from_source_nodes(cls, source_nodes: List[NodeWithScore]):
        return [cls.from_source_node(node) for node in source_nodes]

class _Result(BaseModel):
    result: _Message
    nodes: List[_SourceNodes]

async def parse_chat_data(data: _ChatData) -> Tuple[str, List[ChatMessage]]:
    # check preconditions and get last message
    if len(data.messages) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No messages provided",
        )
    last_message = data.messages.pop()
    if last_message.role != MessageRole.USER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Last message must be from user",
        )
    # convert messages coming from the request to type ChatMessage
    messages = [
        ChatMessage(
            role=m.role,
            content=m.content,
        )
        for m in data.messages
    ]
    return last_message.content, messages

responses = {}

@r.post("")
async def chat(
    request: Request,
    data: _ChatData,
    chat_engine: BaseChatEngine = Depends(get_chat_engine),
):
    client_id = request.client.host  # Using client IP address as unique identifier
    log_file_path = get_log_file_path(client_id)
    
    clear_file_if_not_empty(log_file_path)
    
    last_message_content, messages = await parse_chat_data(data)

    log_to_file(log_file_path, f"{datetime.now()} - User Query: {last_message_content}")
    log_to_file(log_file_path, f"------------------------------------------------------------------------")
    event_handler = EventCallbackHandler()
    chat_engine.callback_manager.handlers.append(event_handler)  # type: ignore
    response = await chat_engine.astream_chat(last_message_content, messages)

    async def content_generator():
        full_response = ''
        async def _text_generator():
            nonlocal full_response
            async for token in response.async_response_gen():
                yield VercelStreamResponse.convert_text(token)
                full_response += token
            event_handler.is_done = True
            log_to_file(log_file_path, f"{datetime.now()} - Generated Response: {full_response}")
            log_to_file(log_file_path, f"------------------------------------------------------------------------")
            log_to_file(log_file_path, f"------------------------------------------------------------------------")
            os.system(f"python ./database_update.py {log_file_path}")
        for node in response.source_nodes:
            log_to_file(log_file_path, f"{datetime.now()} - Context Text: {node.node.text} - Page: {node.node.metadata.get('page_label', 'N/A')} FilePath: {node.node.metadata.get('file_path', 'N/A')}")
            log_to_file(log_file_path, f"------------------------------------------------------------------------")
        async def _event_generator():
            async for event in event_handler.async_event_gen():
                yield VercelStreamResponse.convert_data(
                    {
                        "type": "events",
                        "data": {"title": event.get_title()},
                    }
                )

        combine = stream.merge(_text_generator(), _event_generator())
        async with combine.stream() as streamer:
            async for item in streamer:
                if await request.is_disconnected():
                    break
                yield item

        yield VercelStreamResponse.convert_data(
            {
                "type": "sources",
                "data": {
                    "nodes": [
                        _SourceNodes.from_source_node(node).dict()
                        for node in response.source_nodes
                    ]
                },
            }
        )

    return VercelStreamResponse(content=content_generator())

@r.post("/request")
async def chat_request(
    request: Request,
    data: _ChatData,
    chat_engine: BaseChatEngine = Depends(get_chat_engine),
) -> _Result:
    client_id = request.client.host  # Using client IP address as unique identifier
    log_file_path = get_log_file_path(client_id)
    
    clear_file_if_not_empty(log_file_path)
    
    last_message_content, messages = await parse_chat_data(data)

    response = await chat_engine.achat(last_message_content, messages)
    return _Result(
        result=_Message(role=MessageRole.ASSISTANT, content=response.response),
        nodes=_SourceNodes.from_source_nodes(response.source_nodes),
    )
