from dotenv import load_dotenv

load_dotenv()

import logging
import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from app.api.routers.chat import chat_router
from app.settings import init_settings
from app.observability import init_observability
from app.settings import init_cohere 
from pydantic import BaseModel
from app.engine import update_top_k

app = FastAPI()

init_settings()
init_observability()

environment = os.getenv("ENVIRONMENT", "dev")  # Default to 'development' if not set

# Define a model for temperature update request
class TemperatureUpdate(BaseModel):
    temperature: float
class TopKUpdate(BaseModel):
    topK: int
class ModelSelection(BaseModel):
    model: str

# Function to update temperature in settings
def update_temperature(temperature: float):
    init_cohere(temperature=temperature)  # Update temperature in settings

# Function to update topK in settings
def update_topK(topK: int):
    # Update the top_k variable in the __init__.py module
    update_top_k(topK)

if environment == "dev":
    logger = logging.getLogger("uvicorn")
    logger.warning("Running in development mode - allowing CORS for all origins")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Redirect to documentation page when accessing base URL
    @app.get("/")
    async def redirect_to_docs():
        return RedirectResponse(url="/docs")

@app.post("/update_temperature")
async def update_temperature_endpoint(update: TemperatureUpdate):
    update_temperature(temperature=update.temperature)
    return {"message": "Temperature updated successfully"}


@app.post("/update_topk")
async def update_topk_endpoint(update: TopKUpdate):
    update_topK(update.topK)
    return {"message": "topK updated successfully"}

@app.post("/select_model")
async def select_model_endpoint(selection: ModelSelection):
    # Call the function to update the model in settings
    init_cohere(model_name=selection.model)
    return {"message": "Model updated successfully"}

app.include_router(chat_router, prefix="/api/chat")


if __name__ == "__main__":
    app_host = os.getenv("APP_HOST", "0.0.0.0")
    app_port = int(os.getenv("APP_PORT", "8000"))
    reload = True if environment == "dev" else False

    uvicorn.run(app="main:app", host=app_host, port=app_port, reload=reload)
