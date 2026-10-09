import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, Clock, Building2, MapPin, CheckCircle2 } from 'lucide-react';
import { fetchAllComplaints } from '../utils/api';

export default function TicketSearch({ onSelectComplaint, t }) {
  const [ticketInput, setTicketInput] = useState('');
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllComplaints()
      .then((data) => {
        setRecentComplaints(data.slice(0, 6));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (ticketInput.trim()) {
      onSelectComplaint(ticketInput.trim());
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Track Your Civic Complaint
        </h1>
        <p className="text-sm text-slate-600">
          Enter your official ticket reference number to view live status, timeline audit trail, and escalation reminders.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
        <div className="p-3 text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={ticketInput}
          onChange={(e) => setTicketInput(e.target.value)}
          placeholder="e.g. BLR-2026-401821 or BLR-2026-512093"
          className="flex-1 text-sm sm:text-base outline-none font-mono text-slate-800 placeholder-slate-400"
        />
        <button
          type="submit"
          className="px-5 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow"
        >
          Track Ticket
        </button>
      </form>

      {/* Quick Select from Recent Complaints */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Or Select From Recent Civic Reports:
        </h3>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-sm">Loading complaints...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentComplaints.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectComplaint(item.id)}
                className="bg-white border border-slate-200 hover:border-sky-500 rounded-2xl p-4 cursor-pointer transition shadow-xs hover:shadow-sm text-left group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-sky-700">
                    {item.ticketNumber}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                    item.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1 group-hover:text-sky-600 transition">
                  {item.issue_category}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                  {item.responsible_department}
                </p>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{item.upvotes || 1} upvotes</span>
                  <span className="flex items-center gap-1 text-sky-600 font-semibold group-hover:translate-x-1 transition">
                    View <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
