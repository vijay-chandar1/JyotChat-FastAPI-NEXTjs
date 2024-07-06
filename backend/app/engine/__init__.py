import os
from app.engine.index import get_index
from fastapi import HTTPException
# from llama_index.postprocessor.cohere_rerank import CohereRerank

# Initialize top_k with default value from environment variable
top_k = int(os.getenv("TOP_K", 3))

# api_key = os.environ["COHERE_API_KEY"]
# cohere_rerank = CohereRerank(api_key=api_key, top_n=top_k)

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
        # node_postprocessors=[cohere_rerank],
        system_prompt=system_prompt,
        chat_mode="context",
        verbose=True
    )

#system_prompt=system_prompt
def update_top_k(new_top_k: int):
    global top_k
    top_k = new_top_k
