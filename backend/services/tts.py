import edge_tts
import io

class TTSService:
    def __init__(self, voice="en-US-JennyNeural"):
        self.voice = voice

    async def generate_audio(self, text: str) -> bytes:
        """
        Generates audio bytes from text using Edge TTS.
        """
        communicate = edge_tts.Communicate(text, self.voice)
        audio_stream = io.BytesIO()
        async for chunk in communicate.stream():
             if chunk["type"] == "audio":
                audio_stream.write(chunk["data"])
        
        audio_stream.seek(0)
        return audio_stream.read()

tts_service = TTSService()
