import React, { useState } from 'react';
import { 
  CheckCircle, AlertTriangle, ShieldCheck, HelpCircle, 
  Building2, Gauge, Globe, FileText, Send, X, Edit3, ArrowRight 
} from 'lucide-react';
import EmergencyBanner from './EmergencyBanner';

export default function ComplaintPreviewModal({ 
  analysis, 
  location, 
  uploadedMedia, 
  onSubmit, 
  onCancel, 
  t, 
  isSubmitting 
}) {
  const [formalDraft, setFormalDraft] = useState(analysis.formal_complaint_draft || '');
  const [translatedDraft, setTranslatedDraft] = useState(analysis.translated_copy || '');
  const [clarifyingAnswer, setClarifyingAnswer] = useState('');
  const [isEditingDraft, setIsEditingDraft] = useState(false);

  // If rejected as abusive or irrelevant
  if (analysis.is_abusive_or_irrelevant) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-red-200">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Cannot File Civic Grievance
          </h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {analysis.rejection_reason || "CivicLens is dedicated to public municipal infrastructure (roads, lighting, garbage, water leaks). The submitted content does not qualify for official municipal action."}
          </p>
          <div className="mt-6 flex justify-end">
            <button
              onClick={onCancel}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-sm transition"
            >
              Back to Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleFinalSubmit = () => {
    let finalFormal = formalDraft;
    let finalTranslated = translatedDraft;

    // Append clarification if provided
    if (analysis.is_unclear_image && clarifyingAnswer.trim()) {
      finalFormal += `\n[Citizen Clarification]: ${clarifyingAnswer.trim()}`;
      finalTranslated += `\n[ಸ್ಪಷ್ಟೀಕರಣ / स्पष्टीकरण]: ${clarifyingAnswer.trim()}`;
    }

    const payload = {
      ...analysis,
      formal_complaint_draft: finalFormal,
      translated_copy: finalTranslated,
      clarifying_answer: clarifyingAnswer,
      location,
      imageUrl: uploadedMedia?.imageUrl || null,
      audioUrl: uploadedMedia?.audioUrl || null,
    };

    onSubmit(payload);
  };

  const severityColors = {
    1: 'bg-emerald-500',
    2: 'bg-lime-500',
    3: 'bg-amber-500',
    4: 'bg-orange-500',
    5: 'bg-red-600',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-700 to-indigo-800 px-5 sm:px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <ShieldCheck className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                Review & Confirm Complaint
              </h3>
              <p className="text-xs text-sky-200">
                AI analyzed • Ready for official municipal ticket filing
              </p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            aria-label="Close"
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Emergency Safety Banner if safety_risk is true */}
          {analysis.safety_risk && (
            <EmergencyBanner
              hazardType={`CRITICAL HAZARD: ${analysis.issue_category}`}
              helphoneNumber={analysis.department_helpline || "112"}
              actionInstruction={analysis.safety_risk_reason}
              departmentName={analysis.responsible_department}
            />
          )}

          {/* Clarifying Question from Gemini if image is blurry */}
          {analysis.is_unclear_image && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-amber-900 text-sm">
                    {t?.clarifyingNotice || "AI Needs ONE Clarification"}
                  </h4>
                  <p className="text-xs sm:text-sm text-amber-800 mt-1 font-medium">
                    {analysis.clarifying_question || "The photo is somewhat unclear. Could you specify the exact defect?"}
                  </p>
                  <input
                    type="text"
                    value={clarifyingAnswer}
                    onChange={(e) => setClarifyingAnswer(e.target.value)}
                    placeholder={t?.clarifyingPlaceholder || "Type quick answer (e.g. 'It is a 2-foot pothole with standing water')"}
                    className="mt-3 w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Key Classification Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Category & Severity */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Detected Category
              </span>
              <p className="text-base font-bold text-slate-900 mt-1">
                {analysis.issue_category}
              </p>

              {/* Severity Gauge */}
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5" /> Severity Score
                  </span>
                  <span className="font-bold text-slate-900">
                    Level {analysis.severity} / 5
                  </span>
                </div>
                {/* 5-bar rating visual */}
                <div className="flex gap-1.5 mt-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      className={`h-2 flex-1 rounded-full transition-all ${
                        lvl <= analysis.severity ? (severityColors[analysis.severity] || 'bg-sky-600') : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-slate-600 mt-2 italic">
                  "{analysis.severity_justification}"
                </p>
              </div>
            </div>

            {/* Municipal Department & SLA */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Routing Department
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Building2 className="w-4 h-4 text-sky-700 flex-shrink-0" />
                <p className="text-sm font-bold text-slate-900 line-clamp-1">
                  {analysis.responsible_department}
                </p>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                  {analysis.department_code || "PWD-CIVIC"}
                </span>
                {analysis.department_verified ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    ✓ Verified Official Desk
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                    Needs Verification
                  </span>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Official SLA:</span> Resolution target within <strong className="text-slate-900">{analysis.escalation_days || 7} days</strong>.
              </div>
            </div>
          </div>

          {/* Draft Grievance (English + Regional) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                <span>{t?.formalDraftLabel || "Official Complaint Draft (English)"}</span>
              </label>
              <button
                type="button"
                onClick={() => setIsEditingDraft(!isEditingDraft)}
                className="text-xs text-sky-700 hover:text-sky-800 font-semibold flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                {isEditingDraft ? "Done Editing" : "Edit Draft"}
              </button>
            </div>

            {isEditingDraft ? (
              <textarea
                value={formalDraft}
                onChange={(e) => setFormalDraft(e.target.value)}
                rows={3}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-sky-500"
              />
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-800 leading-relaxed font-mono">
                {formalDraft}
              </div>
            )}

            {/* Translated Copy */}
            {translatedDraft && (
              <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-800 mb-1">
                  <Globe className="w-3.5 h-3.5" />
                  <span>{t?.translatedDraftLabel || "Draft in Your Language"} ({analysis.detected_language})</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {translatedDraft}
                </p>
              </div>
            )}
          </div>

          {/* Location Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-center justify-between">
            <span className="truncate pr-2 font-medium">
              📍 {location?.address || "Selected Ward Location"}
            </span>
            <span className="text-[11px] text-slate-400 flex-shrink-0">
              Coordinates Locked
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-6 py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 text-slate-600 hover:text-slate-800 text-sm font-semibold transition"
          >
            Cancel / Edit Input
          </button>

          <button
            type="button"
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto tap-target inline-flex items-center justify-center gap-2 px-7 py-3 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold rounded-xl shadow-md transition focus:ring-4 focus:ring-sky-200"
          >
            {isSubmitting ? (
              <span>Filing Official Complaint...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Confirm & File Complaint</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
