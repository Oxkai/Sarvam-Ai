import { useCallback, useRef, useState } from 'react';

export type RecordingState = 'idle' | 'recording' | 'processing' | 'done' | 'error';

export interface UseAudioRecordingReturn {
  recordingState: RecordingState;
  transcript: string;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
  isSupported: boolean;
}

// Simulates STT transcription of the recorded audio blob.
// Replace with a real Sarvam STT call when available.
function simulateTranscription(_blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('What are the key features of the Sarvam AI inference platform?');
    }, 800);
  });
}

export function useAudioRecording(): UseAudioRecordingReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const isSupported =
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined';

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('Audio recording is not supported in this browser.');
      setRecordingState('error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setRecordingState('processing');
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        try {
          const text = await simulateTranscription(blob);
          setTranscript(text);
          setRecordingState('done');
        } catch {
          setError('Failed to transcribe audio.');
          setRecordingState('error');
        } finally {
          streamRef.current?.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };

      recorder.start();
      setRecordingState('recording');
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Microphone access denied.';
      setError(msg);
      setRecordingState('error');
    }
  }, [isSupported]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const resetRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    chunksRef.current = [];
    setRecordingState('idle');
    setTranscript('');
    setError(null);
  }, []);

  return {
    recordingState,
    transcript,
    error,
    startRecording,
    stopRecording,
    resetRecording,
    isSupported,
  };
}
