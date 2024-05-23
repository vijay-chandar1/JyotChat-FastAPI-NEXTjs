import os
from app.engine.index import get_index
from fastapi import HTTPException

# Initialize top_k with default value from environment variable
top_k = int(os.getenv("TOP_K", 3))

def get_chat_engine():
    system_prompt = os.getenv("SYSTEM_PROMPT")

    index = get_index()
    if index is None:
        raise HTTPException(
            status_code=500,
            detail=str(
                "StorageContext is empty - call 'poetry run generate' to generate the storage first"
            ),
        )

    return index.as_chat_engine(
        similarity_top_k=top_k,
        system_prompt=system_prompt,
        chat_mode="condense_plus_context",
    )

def update_top_k(new_top_k: int):
    global top_k
    top_k = new_top_k
