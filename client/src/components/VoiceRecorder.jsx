import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Trash2, Volume2, CheckCircle2 } from 'lucide-react';

export default function VoiceRecorder({ onVoiceRecorded, onClear, t, selectedLanguage }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [liveTranscript, setLiveTranscript] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);

  // Set up speech recognition if supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      const langMap = {
        kn: 'kn-IN',
        hi: 'hi-IN',
        ta: 'ta-IN',
        te: 'te-IN',
        mr: 'mr-IN',
        bn: 'bn-IN',
        en: 'en-IN'
      };
      recognition.lang = langMap[selectedLanguage] || 'en-IN';

      recognition.onresult = (event) => {
        let text = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          text += event.results[i][0].transcript;
        }
        setLiveTranscript(text);
      };

      recognitionRef.current = recognition;
    }
  }, [selectedLanguage]);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      setLiveTranscript('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);

        // Convert blob to file and emit
        const audioFile = new File([blob], `voice-report-${Date.now()}.webm`, { type: 'audio/webm' });
        onVoiceRecorded({ file: audioFile, transcript: liveTranscript });

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Start recognition if available
      try {
        if (recognitionRef.current) recognitionRef.current.start();
      } catch (e) {
        // Recognition might already be running or unpermitted
      }
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Microphone access is required to record a voice complaint. Please enable microphone permissions in your browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      try {
        if (recognitionRef.current) recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  const clearRecording = () => {
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingDuration(0);
    setLiveTranscript('');
    onClear();
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-sky-600" />
          <span>{t.voiceLabel}</span>
        </label>
        {isRecording && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            Recording ({formatTime(recordingDuration)})
          </span>
        )}
      </div>

      {!audioUrl ? (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              aria-label={t.startRecording}
              className="w-full sm:w-auto flex-1 tap-target flex items-center justify-center gap-3 bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-sm transition active:scale-95 focus:ring-4 focus:ring-sky-200"
            >
              <Mic className="w-5 h-5" />
              <span>{t.startRecording}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              aria-label={t.stopRecording}
              className="w-full sm:w-auto flex-1 tap-target flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-md transition active:scale-95 animate-voice-ripple focus:ring-4 focus:ring-red-200"
            >
              <Square className="w-5 h-5 fill-current" />
              <span>{t.stopRecording} ({formatTime(recordingDuration)})</span>
            </button>
          )}

          <div className="text-xs text-slate-500 text-center sm:text-left">
            <span>Speak naturally in Kannada, Hindi, Tamil, Telugu, English or code-mixed.</span>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                {t.voiceRecorded} ({formatTime(recordingDuration)})
              </p>
              <audio controls src={audioUrl} className="h-8 mt-1 max-w-[220px]" />
            </div>
          </div>

          <button
            type="button"
            onClick={clearRecording}
            className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove Voice Note
          </button>
        </div>
      )}

      {/* Live speech preview if available */}
      {liveTranscript && (
        <div className="mt-3 bg-white border border-sky-100 rounded-lg p-2.5 text-xs text-slate-700 italic">
          <span className="font-semibold not-italic text-sky-700 mr-1.5">Live Voice Preview:</span>
          "{liveTranscript}"
        </div>
      )}
    </div>
  );
}
