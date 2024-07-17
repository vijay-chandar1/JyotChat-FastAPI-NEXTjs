from dotenv import load_dotenv

load_dotenv()

import logging
import os
import uvicorn
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, FileResponse
from app.api.routers.chat import chat_router
from app.settings import init_settings
from app.observability import init_observability
from app.settings import init_cohere 
from pydantic import BaseModel
from app.engine import update_top_k
from app.api.routers.chat import responses
# from gtts import gTTS
from langdetect import detect
import os
import uuid
from easygoogletranslate import EasyGoogleTranslate
import azure.cognitiveservices.speech as speechsdk
# import asyncio


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
class TextToSpeech(BaseModel):
    text: str

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
else:
    logger = logging.getLogger("uvicorn")
    logger.warning("Running in development mode - allowing CORS for all origins")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["https://jyotchat.azurewebsites.net/"],
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

# Set up your Azure subscription key and service region
def synthesize_speech(text: str, lang: str, output_file: str):
    # Set up Azure Cognitive Services Speech SDK configuration
    speech_key = os.getenv("AZURE_SPEECH_KEY")
    
    service_region = os.getenv("AZURE_REGION")
    
    speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=service_region)
    # Use language-specific voice
    if lang == "hi":
        voice_name = "hi-IN-MadhurNeural"
    elif lang == "gu":
        voice_name = "gu-IN-NiranjanNeural"
    else:
        voice_name = "en-IN-PrabhatNeural"  # Default to English
    speech_config.speech_synthesis_voice_name = voice_name

    # Create an audio output configuration
    audio_config = speechsdk.audio.AudioOutputConfig(filename=output_file)
    speech_synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)

    # Synthesize speech and get the result
    result = speech_synthesizer.speak_text_async(text).get()

    # Check if the synthesis was successful
    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        print(f"Speech synthesis completed successfully. Audio saved to {output_file}")
    else:
        print("Speech synthesis failed.")
        if result.reason == speechsdk.ResultReason.Canceled:
            cancellation_details = result.cancellation_details
            print(f"Speech synthesis canceled: {cancellation_details.reason}")
            if cancellation_details.reason == speechsdk.CancellationReason.Error and cancellation_details.error_details:
                print(f"Error details: {cancellation_details.error_details}")


@app.post("/play_audio")
async def play_audio_endpoint(request: Request, background_tasks: BackgroundTasks):
    try:
        data = await request.json()
        message = data.get('message')
        
        if not message:
            raise HTTPException(status_code=400, detail="Message content is required")

        lang = detect(message)
        speech_file_path = f"speech_{uuid.uuid4()}.wav"
        synthesize_speech(message, lang, speech_file_path)
        
        response = FileResponse(speech_file_path, media_type="audio/wav")
        background_tasks.add_task(os.remove, speech_file_path)
        
        return response
    except Exception as e:
        print(str(e))
        raise HTTPException(status_code=500, detail="An error occurred while processing the request.")
    
@app.post("/translate")
async def translate_text(text: str = Body(..., embed=True), target_language: str = Body('en', embed=True)):
    print(f"Translating text: {text} to language: {target_language}")  # Print the text and target language
    # logger.info(f"Translating text: {text} to language: {target_language}")
    translator = EasyGoogleTranslate(source_language='auto', target_language='target_language')
    try:
        translated_text = translator.translate(text)
    except Exception as e:
        print(f"Error: {str(e)}")  # Print the error message
        # logger.error(f"Error: {str(e)}")  # Log the error message
        raise HTTPException(status_code=500, detail=str(e))
    
    logger.info(f"Translated text: {translated_text}")  # Log the translated text
    print(f"Translated text: {translated_text}")  # Print the translated text
    return {"translated_text": translated_text}

app.include_router(chat_router, prefix="/api/chat")


if __name__ == "__main__":
    app_host = os.getenv("APP_HOST", "0.0.0.0")
    app_port = int(os.getenv("APP_PORT", "8000"))
    reload = True if environment == "dev" else False
    # logger.info(f"Starting server at {app_host}:{app_port}")
    uvicorn.run(app="main:app", host=app_host, port=app_port, reload=reload)



# async def delete_file_after_delay(file_path: str, delay: int = 10):
#     await asyncio.sleep(delay)
#     try:
#         os.remove(file_path)
#         print(f"File {file_path} deleted successfully.")
#     except Exception as e:
#         print(f"Error deleting file {file_path}: {e}")

# @app.post("/play_audio")
# async def play_audio_endpoint(request: Request, background_tasks: BackgroundTasks):
#     full_response = responses.get(request.client.host)
#     try:
#         # Detect the language of full_response
#         lang = detect(full_response)
        
#         # Convert full_response to speech using gTTS
#         tts = gTTS(text=full_response, lang=lang, tld="co.in")
#         speech_file_path = f"speech_{uuid.uuid4()}.mp3"
#         tts.save(speech_file_path)
        
#         # Return the audio file
#         response = FileResponse(speech_file_path, media_type="audio/mpeg")

#         # Schedule the file to be deleted after the response has been sent
#         background_tasks.add_task(os.remove, speech_file_path)

#         return response
#     except Exception as e:
#         print(str(e))  # Log the error
#         raise HTTPException(status_code=500, detail="An error occurred while processing the request.")