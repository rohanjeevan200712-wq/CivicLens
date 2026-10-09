import React, { useState } from 'react';
import { 
  Camera, Mic, FileText, Send, Sparkles, AlertTriangle, 
  ShieldCheck, Upload, Trash2, ArrowRight, EyeOff, CheckCircle 
} from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';
import MapSelector from './MapSelector';
import PrivacyBlurCanvas from './PrivacyBlurCanvas';
import ComplaintPreviewModal from './ComplaintPreviewModal';
import { compressImage } from '../utils/imageCompressor';
import { analyzeComplaintIntake, submitComplaint } from '../utils/api';

export default function CitizenReportFlow({ 
  onComplaintSubmitted, 
  selectedLanguage, 
  t 
}) {
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [sanitizedDataUrl, setSanitizedDataUrl] = useState(null);
  const [showPrivacyCanvas, setShowPrivacyCanvas] = useState(false);

  const [voiceFile, setVoiceFile] = useState(null);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  const [textDescription, setTextDescription] = useState('');

  const [location, setLocation] = useState({
    lat: 12.9352,
    lng: 77.6245,
    address: '80 Feet Rd, 4th Block, Koramangala, Bengaluru, Karnataka 560034'
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [uploadedMediaResult, setUploadedMediaResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle image selection
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress immediately for < 2s paint & fast upload
      const compressed = await compressImage(file);
      setPhotoFile(compressed);
      const previewUrl = URL.createObjectURL(compressed);
      setPhotoPreview(previewUrl);
      setSanitizedDataUrl(null);
      setErrorMessage('');
    } catch (err) {
      console.error('Compression failed, using original:', err);
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setSanitizedDataUrl(null);
    setShowPrivacyCanvas(false);
  };

  // Demo Presets (enables a non-technical judge to test full flows in seconds)
  const applyPreset = (presetType) => {
    setErrorMessage('');
    if (presetType === 'kannada-pothole') {
      setTextDescription('ಕೋರಮಂಗಲ ೮೦ ಫೀಟ್ ರಸ್ತೆಯಲ್ಲಿ ತುಂಬಾ ದೊಡ್ಡ ಗುಂಡಿ ಬಿದ್ದಿದೆ. ನೆನ್ನೆ ರಾತ್ರಿ ಬೈಕ್ ಸವಾರ ಬಿದ್ದು ಗಾಯಗೊಂಡಿದ್ದಾರೆ. ಬೇಗ ಮುಚ್ಚಿ.');
      setLocation({
        lat: 12.9352,
        lng: 77.6245,
        address: '80 Feet Rd, 4th Block, Koramangala, Bengaluru'
      });
      setPhotoPreview('https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80');
    } else if (presetType === 'hindi-manhole') {
      setTextDescription('इंद्रा नगर मेन रोड पर सीवर का खुला मैनहोल है, ढक्कन गायब है! कोई भी बच्चा गिर सकता है!');
      setLocation({
        lat: 12.9784,
        lng: 77.6408,
        address: '100 Feet Rd, Indiranagar, Bengaluru'
      });
      setPhotoPreview('https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=600&auto=format&fit=crop&q=80');
    } else if (presetType === 'tamil-livewire') {
      setTextDescription('எச்.எஸ்.ஆர் லேஅவுட் மெயின் ரோட்டில் கரண்ட் கம்பி அறுந்து தொங்குகிறது, தீப்பொறி பறக்கிறது! ஆபத்து!');
      setLocation({
        lat: 12.9116,
        lng: 77.6389,
        address: '14th Main Rd, Sector 1, HSR Layout, Bengaluru'
      });
      setPhotoPreview('https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80');
    } else if (presetType === 'blurry-edgecase') {
      setTextDescription('The photo is very blurry and dark. Something seems broken on the pavement.');
      setPhotoPreview('https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop&q=80');
    } else if (presetType === 'abusive-edgecase') {
      setTextDescription('Hey idiots here is my selfie discount crypto ad buy now!');
      setPhotoPreview(null);
    }
  };

  const handleAnalyze = async () => {
    // Check if at least one input is provided
    if (!photoFile && !sanitizedDataUrl && !photoPreview && !voiceFile && !textDescription.trim()) {
      setErrorMessage('Please provide a photo, voice note, or text description to report an issue.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setErrorMessage('');

      // Combine voice transcript with text if available
      let combinedText = textDescription;
      if (voiceTranscript && !combinedText) {
        combinedText = voiceTranscript;
      }

      const res = await analyzeComplaintIntake({
        photoFile: sanitizedDataUrl ? null : photoFile,
        imageBase64: sanitizedDataUrl || (photoPreview?.startsWith('data:') ? photoPreview : null),
        audioFile: voiceFile,
        text: combinedText,
        languageHint: selectedLanguage
      });

      setAnalysisResult(res);
      setUploadedMediaResult(res.uploadedMedia);
    } catch (err) {
      console.error('Analysis error:', err);
      setErrorMessage(err.message || 'Failed to analyze intake. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmSubmit = async (finalPayload) => {
    try {
      setIsSubmitting(true);
      const created = await submitComplaint(finalPayload);
      setIsSubmitting(false);
      setAnalysisResult(null);
      onComplaintSubmitted(created.id);
    } catch (err) {
      setIsSubmitting(false);
      alert('Error submitting complaint: ' + err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Intro Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Multimodal Civic Reporting</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t.tagline}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          {t.subtagline}
        </p>
      </div>

      {/* 1-Click Demo Showcase Presets */}
      <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-2xl p-3.5 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>2-Minute Hackathon Demo Shortcuts (1-Click Presets):</span>
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset('kannada-pothole')}
            className="px-2.5 py-1.5 bg-white hover:bg-sky-100 text-sky-800 text-xs font-bold rounded-lg border border-sky-200 shadow-xs transition"
          >
            ಕನ್ನಡ: Pothole (Koramangala)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('hindi-manhole')}
            className="px-2.5 py-1.5 bg-white hover:bg-sky-100 text-red-700 text-xs font-bold rounded-lg border border-red-200 shadow-xs transition"
          >
            हिंदी: Open Manhole (Safety 5/5)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('tamil-livewire')}
            className="px-2.5 py-1.5 bg-white hover:bg-sky-100 text-amber-800 text-xs font-bold rounded-lg border border-amber-200 shadow-xs transition"
          >
            தமிழ்: Live Wire (HSR Layout)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('blurry-edgecase')}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-xs transition"
          >
            Edge Case: Blurry Photo
          </button>
          <button
            type="button"
            onClick={() => applyPreset('abusive-edgecase')}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-xs transition"
          >
            Edge Case: Irrelevant Upload
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-300 text-red-800 p-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: PHOTO WITH PRIVACY BLUR */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Camera className="w-4 h-4 text-sky-600" />
            <span>{t.photoLabel}</span>
          </label>
          <span className="text-xs text-slate-400">Optional</span>
        </div>

        {!photoPreview ? (
          <label className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-sky-50/50 transition">
            <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mb-2">
              <Upload className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-700">
              {t.takePhoto}
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Supports Camera Snap or Gallery Upload (Compressed automatically)
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="sr-only"
            />
          </label>
        ) : (
          <div className="space-y-3">
            {showPrivacyCanvas ? (
              <PrivacyBlurCanvas
                imageSrc={photoPreview}
                onSanitized={(sanitizedUrl) => {
                  setSanitizedDataUrl(sanitizedUrl);
                  setShowPrivacyCanvas(false);
                }}
                onCancel={() => setShowPrivacyCanvas(false)}
              />
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-h-72 flex justify-center bg-slate-900">
                <img
                  src={sanitizedDataUrl || photoPreview}
                  alt="Issue preview"
                  className="max-h-72 w-auto object-contain"
                />

                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPrivacyCanvas(true)}
                    className="px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg text-xs font-bold backdrop-blur-md flex items-center gap-1.5 shadow"
                  >
                    <EyeOff className="w-3.5 h-3.5 text-sky-400" />
                    <span>{sanitizedDataUrl ? "Edit Privacy Blur" : "Blur Faces & Plates"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow transition"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {sanitizedDataUrl && (
                  <div className="absolute bottom-3 left-3 bg-emerald-600 text-white px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 shadow">
                    <CheckCircle className="w-3 h-3" /> Privacy Blur Applied
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{t.privacyNotice}</span>
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: VOICE RECORDER (MULTILINGUAL) */}
      <VoiceRecorder
        onVoiceRecorded={({ file, transcript }) => {
          setVoiceFile(file);
          if (transcript) setVoiceTranscript(transcript);
        }}
        onClear={() => {
          setVoiceFile(null);
          setVoiceTranscript('');
        }}
        selectedLanguage={selectedLanguage}
        t={t}
      />

      {/* STEP 3: TEXT DESCRIPTION */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
        <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-600" />
          <span>{t.textLabel}</span>
        </label>
        <textarea
          rows={3}
          value={textDescription}
          onChange={(e) => setTextDescription(e.target.value)}
          placeholder={t.textPlaceholder}
          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 transition"
        />
      </div>

      {/* STEP 4: LOCATION CONFIRMATION */}
      <MapSelector
        initialLocation={location}
        onLocationChange={(newLoc) => setLocation(newLoc)}
        t={t}
      />

      {/* SUBMISSION / AI TRIGGER BUTTON */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full tap-target flex items-center justify-center gap-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-extrabold text-base px-6 py-4 rounded-2xl shadow-lg shadow-sky-600/25 active:scale-[0.98] transition focus:ring-4 focus:ring-sky-200 disabled:opacity-60"
        >
          {isAnalyzing ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t.analyzing}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-200" />
              <span>{t.analyzeBtn}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          )}
        </button>
      </div>

      {/* REVIEW & CONFIRM MODAL */}
      {analysisResult && (
        <ComplaintPreviewModal
          analysis={analysisResult}
          location={location}
          uploadedMedia={uploadedMediaResult}
          onSubmit={handleConfirmSubmit}
          onCancel={() => setAnalysisResult(null)}
          t={t}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
