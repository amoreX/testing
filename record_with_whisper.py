from voice_recorder import VoiceRecorder

if __name__ == "__main__":
    recorder = VoiceRecorder(model_size="base")
    transcription = recorder.record_and_transcribe()
    print(transcription)
