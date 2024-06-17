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
from gtts import gTTS
from langdetect import detect
import os
import uuid
from easygoogletranslate import EasyGoogleTranslate
import azure.cognitiveservices.speech as speechsdk


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

@app.post("/play_audio")
async def play_audio_endpoint(request: Request, background_tasks: BackgroundTasks):
    full_response = responses.get(request.client.host)
    try:
        # Detect the language of full_response
        lang = detect(full_response)
        
        # Convert full_response to speech using gTTS
        tts = gTTS(text=full_response, lang=lang, tld="co.in")
        speech_file_path = f"speech_{uuid.uuid4()}.mp3"
        tts.save(speech_file_path)
        
        # Return the audio file
        response = FileResponse(speech_file_path, media_type="audio/mpeg")

        # Schedule the file to be deleted after the response has been sent
        background_tasks.add_task(os.remove, speech_file_path)

        return response
    except Exception as e:
        print(str(e))  # Log the error
        raise HTTPException(status_code=500, detail="An error occurred while processing the request.")




# responses = {
#     "127.0.0.1": "Hello, this is a test response.",
#     "127.0.0.2": "નમસ્તે, આ એક પરીક્ષણ પ્રતિસાદ છે."  # Example response in Gujarati
#     # Add other client responses as needed
# }

# # Azure TTS credentials from environment variables
# subscription_key = os.getenv("AZURE_SPEECH_KEY")
# region = os.getenv("AZURE_REGION")

# # Define a function to select the appropriate voice based on language
# def get_voice_for_language(lang: str, preferred_voice: str = "hi-IN-MadhurNeural") -> str:
#     if lang == "gu":
#         return "gu-IN-DhwaniNeural"  # Example Gujarati voice
#     elif lang == "en":
#         return "en-IN-NeerjaNeural"  # Example Indian English female voice
#     else:
#         return preferred_voice

# @app.post("/play_audio")
# async def play_audio_endpoint(
#     request: Request,
#     background_tasks: BackgroundTasks,
#     voice: str = Query(None)
# ):
#     full_response = responses.get(request.client.host)
#     try:
#         # Detect the language of full_response
#         lang = detect(full_response)

#         # Set up the speech config with your subscription and region
#         speech_config = speechsdk.SpeechConfig(subscription=subscription_key, region=region)

#         # Select the appropriate voice for the detected language
#         if voice:
#             speech_config.speech_synthesis_voice_name = voice
#         else:
#             speech_config.speech_synthesis_voice_name = get_voice_for_language(lang)

#         # Create a unique file name for the speech output
#         speech_file_path = f"speech_{uuid.uuid4()}.mp3"

#         # Set up the audio output config to write to the file
#         audio_output = speechsdk.audio.AudioOutputConfig(filename=speech_file_path)

#         # Create a speech synthesizer
#         synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_output)

#         # Synthesize the text to speech
#         result = synthesizer.speak_text_async(full_response).get()

#         if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
#             # Return the audio file
#             response = FileResponse(speech_file_path, media_type="audio/mpeg")
#             # Schedule the file to be deleted after the response has been sent
#             background_tasks.add_task(os.remove, speech_file_path)
#             return response
#         elif result.reason == speechsdk.ResultReason.Canceled:
#             cancellation_details = result.cancellation_details
#             raise Exception(f"Speech synthesis canceled: {cancellation_details.reason}. Error details: {cancellation_details.error_details}")
#         else:
#             raise Exception(f"Speech synthesis failed: {result.reason}")

#     except Exception as e:
#         print(f"Error: {str(e)}")  # Log the error
#         raise HTTPException(status_code=500, detail=f"An error occurred while processing the request: {str(e)}")
    





    
@app.post("/translate")
async def translate_text(text: str = Body(..., embed=True), target_language: str = Body('en', embed=True)):
    print(f"Translating text: {text} to language: {target_language}")  # Print the text and target language
    translator = EasyGoogleTranslate(source_language='auto', target_language='target_language')
    try:
        translated_text = translator.translate(text)
    except Exception as e:
        print(f"Error: {str(e)}")  # Print the error message
        raise HTTPException(status_code=500, detail=str(e))

    print(f"Translated text: {translated_text}")  # Print the translated text
    return {"translated_text": translated_text}






app.include_router(chat_router, prefix="/api/chat")


if __name__ == "__main__":
    app_host = os.getenv("APP_HOST", "0.0.0.0")
    app_port = int(os.getenv("APP_PORT", "8000"))
    reload = True if environment == "dev" else False

    uvicorn.run(app="main:app", host=app_host, port=app_port, reload=reload)
