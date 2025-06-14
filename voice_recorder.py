import pyaudio
import wave
import whisper
import tempfile
import os
import time
import numpy as np
import collections
from typing import List


class VoiceRecorder:
    def __init__(self, model_size="base"):
        """Initialize voice recorder with Whisper model"""
        self.whisper_model = whisper.load_model(model_size)

        # Audio parameters
        self.CHUNK = 1024
        self.FORMAT = pyaudio.paInt16
        self.CHANNELS = 1
        self.RATE = 16000

    def record_and_transcribe(self) -> str:
        try:
            audio = pyaudio.PyAudio()
            stream = audio.open(
                format=self.FORMAT,
                channels=self.CHANNELS,
                rate=self.RATE,
                input=True,
                frames_per_buffer=self.CHUNK
            )

            frames = self._record_with_silence_detection(stream)

            stream.stop_stream()
            stream.close()
            audio.terminate()

            transcription = self._transcribe_frames(frames)
            return transcription

        except Exception as e:
            return f"Error during recording: {str(e)}"

    def _record_with_silence_detection(self, stream) -> List[bytes]:
        frames = []
        start_time = time.time()
        speech_detected = False
        silence_start = None

        MAX_RECORDING_TIME = 30
        SILENCE_TIMEOUT = 2.0
        MIN_SPEECH_TIME = 0.5
        VOLUME_THRESHOLD = 500

        volume_buffer = collections.deque(maxlen=10)

        while True:
            current_time = time.time()
            if current_time - start_time > MAX_RECORDING_TIME:
                break

            try:
                frame = stream.read(self.CHUNK, exception_on_overflow=False)
                frames.append(frame)

                volume = self._get_volume(frame)
                volume_buffer.append(volume)
                avg_volume = sum(volume_buffer) / len(volume_buffer)
                is_speech = avg_volume > VOLUME_THRESHOLD

                if not speech_detected and is_speech:
                    speech_detected = True

                if is_speech:
                    silence_start = None
                elif speech_detected and silence_start is None:
                    silence_start = current_time

                if (speech_detected and
                        silence_start and
                        current_time - silence_start > SILENCE_TIMEOUT and
                        current_time - start_time > MIN_SPEECH_TIME):
                    break

            except Exception as e:
                break

        return frames

    def _get_volume(self, frame) -> float:
        try:
            audio_data = np.frombuffer(frame, dtype=np.int16)
            rms = np.sqrt(np.mean(audio_data ** 2))
            return rms
        except:
            return 0.0

    def _transcribe_frames(self, frames: List[bytes]) -> str:
        if not frames:
            return "No audio recorded"

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            try:
                wf = wave.open(temp_file.name, 'wb')
                wf.setnchannels(self.CHANNELS)
                wf.setsampwidth(pyaudio.get_sample_size(self.FORMAT))
                wf.setframerate(self.RATE)
                wf.writeframes(b''.join(frames))
                wf.close()

                result = self.whisper_model.transcribe(
                    temp_file.name,
                    language="en",
                    temperature=0.0
                )

                return result["text"].strip()

            except Exception as e:
                return f"Transcription error: {str(e)}"
            finally:
                try:
                    os.unlink(temp_file.name)
                except:
                    pass
