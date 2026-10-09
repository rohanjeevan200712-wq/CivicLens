import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Clock, AlertTriangle, ArrowLeft, Share2, ThumbsUp, 
  Building2, MapPin, Calendar, ShieldCheck, ChevronRight, Copy, Check
} from 'lucide-react';
import { fetchComplaintById, upvoteComplaint } from '../utils/api';

export default function ComplaintStatusPage({ complaintId, onBack, t }) {
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  useEffect(() => {
    loadData();
  }, [complaintId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchComplaintById(complaintId);
      setComplaint(data);
      setError(null);
    } catch (err) {
      setError('Could not load complaint details. Please check the ticket number.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (hasUpvoted || !complaint) return;
    try {
      const res = await upvoteComplaint(complaint.id);
      setComplaint({ ...complaint, upvotes: res.upvotes });
      setHasUpvoted(true);
    } catch (err) {
      console.error('Failed to upvote:', err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Loading ticket tracking details...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Ticket Not Found</h3>
        <p className="text-sm text-slate-600 mt-1">{error}</p>
        <button
          onClick={onBack}
          className="mt-5 px-5 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-bold shadow"
        >
          Back to Search
        </button>
      </div>
    );
  }

  const lifecycleStages = ['Submitted', 'Acknowledged', 'In Progress', 'Resolved'];
  const currentStageIndex = lifecycleStages.indexOf(complaint.status);

  // SLA Calculation
  const createdDate = new Date(complaint.createdAt);
  const escalationDate = new Date(complaint.escalationDueAt || (createdDate.getTime() + (complaint.escalation_days || 7) * 86400000));
  const now = new Date();
  const diffDays = Math.ceil((escalationDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
  const isBreached = diffDays <= 0 && complaint.status !== 'Resolved';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg shadow-sm transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? "Link Copied!" : "Share Status Page"}</span>
        </button>
      </div>

      {/* Main Ticket Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Official Grievance Ticket
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 font-mono">
                {complaint.ticketNumber}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {complaint.issue_category}
            </h2>
          </div>

          {/* Status Badge */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              complaint.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
              complaint.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
              complaint.status === 'Acknowledged' ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' :
              'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              ● {complaint.status}
            </span>
            <span className="text-[11px] text-slate-400 mt-1">
              {new Date(complaint.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* 4-Step Lifecycle Progress Tracker */}
        <div className="py-6">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-0 h-1 bg-sky-600 -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${Math.max(0, (currentStageIndex / (lifecycleStages.length - 1)) * 100)}%` }}
            />

            {lifecycleStages.map((stage, idx) => {
              const isPast = idx <= currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div key={stage} className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isPast 
                      ? 'bg-sky-600 text-white shadow-md' 
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                  } ${isCurrent ? 'ring-4 ring-sky-100 scale-110' : ''}`}>
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`text-[11px] mt-2 font-semibold ${isCurrent ? 'text-sky-700 font-bold' : isPast ? 'text-slate-800' : 'text-slate-400'}`}>
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* SLA Escalation Timeline Banner */}
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 ${
          complaint.status === 'Resolved' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          isBreached ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-sky-50 border-sky-200 text-sky-900'
        }`}>
          <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            {complaint.status === 'Resolved' ? (
              <p className="font-semibold">
                Grievance successfully resolved and verified by municipal authority.
              </p>
            ) : isBreached ? (
              <div>
                <p className="font-bold text-red-900">
                  ⚠️ SLA Target Breached! Auto-Escalation Active
                </p>
                <p className="text-xs text-red-700 mt-0.5">
                  This issue exceeded the {complaint.escalation_days || 7}-day municipal SLA and has been forwarded to the Zonal Commissioner & Vigilance Cell.
                </p>
              </div>
            ) : (
              <div>
                <p className="font-bold text-sky-950">
                  {t?.escalationNotice || "Official SLA Reminder Timeline:"} {diffDays} {t?.days || "days remaining"}
                </p>
                <p className="text-xs text-sky-800 mt-0.5">
                  If unresolved by {escalationDate.toLocaleDateString()}, CivicLens automated escalation fires directly to the Municipal Commissioner desk.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Community Endorsement / Upvote */}
        <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">
              {complaint.upvotes || 1} citizens
            </span>
            <span className="text-xs text-slate-500">
              affected by this problem
            </span>
          </div>

          <button
            type="button"
            onClick={handleUpvote}
            disabled={hasUpvoted}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm tap-target sm:min-h-0 ${
              hasUpvoted 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-sky-600 hover:bg-sky-700 text-white active:scale-95'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{hasUpvoted ? "You Endorsed (+1)" : (t?.upvoteBtn || "I Have This Problem Too (+1)")}</span>
          </button>
        </div>
      </div>

      {/* Complaint Details Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <Building2 className="w-4 h-4 text-sky-600" />
          <span>Department & Routing Details</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 font-medium">Assigned Authority:</span>
            <p className="font-bold text-slate-800 mt-0.5">{complaint.responsible_department}</p>
            <span className="text-[11px] text-sky-700 font-mono font-semibold">{complaint.department_code}</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 font-medium">Helpline / Escalation Desk:</span>
            <p className="font-bold text-slate-800 mt-0.5">{complaint.department_helpline || "1912"}</p>
            <span className="text-[11px] text-emerald-700 font-semibold">✓ Official Municipal Contact</span>
          </div>
        </div>

        {/* English Grievance */}
        <div className="mt-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Official English Grievance
          </label>
          <p className="mt-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-mono leading-relaxed">
            {complaint.formal_complaint_draft}
          </p>
        </div>

        {/* Regional Translation */}
        {complaint.translated_copy && (
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Citizen Transcript / Translated ({complaint.detected_language})
            </label>
            <p className="mt-1 p-3 bg-sky-50/50 border border-sky-100 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed">
              {complaint.translated_copy}
            </p>
          </div>
        )}

        {/* Attached Photo if available */}
        {complaint.imageUrl && (
          <div className="mt-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Attached Photo (Privacy Protected)
            </label>
            <img 
              src={complaint.imageUrl} 
              alt="Civic issue photo" 
              className="mt-2 rounded-2xl max-h-64 w-full object-cover border border-slate-200 shadow-sm"
            />
          </div>
        )}
      </div>

      {/* Audit Trail Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-sm">
        <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-sky-600" />
          <span>Timeline Audit Trail</span>
        </h3>

        <div className="space-y-4">
          {complaint.timeline?.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 relative pb-4 last:pb-0">
              {idx < complaint.timeline.length - 1 && (
                <div className="absolute top-4 left-3.5 bottom-0 w-0.5 bg-slate-200" />
              )}
              <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold relative z-10">
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{item.title}</h4>
                  <span className="text-[11px] text-slate-400">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
