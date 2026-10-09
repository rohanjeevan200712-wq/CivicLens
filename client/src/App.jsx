import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CitizenReportFlow from './components/CitizenReportFlow';
import ComplaintStatusPage from './components/ComplaintStatusPage';
import TicketSearch from './components/TicketSearch';
import AdminDashboard from './components/AdminDashboard';
import { UI_TRANSLATIONS } from './utils/translations';
import { checkServerHealth } from './utils/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('report'); // 'report' | 'track' | 'admin'
  const [currentLanguage, setCurrentLanguage] = useState('kn'); // Default to Kannada (or toggle to Hindi/Tamil/English)
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [serverHealth, setServerHealth] = useState(null);

  useEffect(() => {
    checkServerHealth()
      .then(setServerHealth)
      .catch((err) => console.warn('Health check failed:', err));
  }, []);

  const t = UI_TRANSLATIONS[currentLanguage] || UI_TRANSLATIONS.en;

  const handleComplaintSubmitted = (complaintId) => {
    setActiveTicketId(complaintId);
    setCurrentTab('track');
  };

  const handleSelectComplaint = (complaintId) => {
    setActiveTicketId(complaintId);
    setCurrentTab('track');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Navbar with Language Toggle & Role Switcher */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'track') setActiveTicketId(null);
        }}
        currentLanguage={currentLanguage}
        onSelectLanguage={setCurrentLanguage}
        t={t}
        isGeminiConfigured={serverHealth?.geminiConfigured}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'report' && (
          <CitizenReportFlow
            onComplaintSubmitted={handleComplaintSubmitted}
            selectedLanguage={currentLanguage}
            t={t}
          />
        )}

        {currentTab === 'track' && (
          activeTicketId ? (
            <ComplaintStatusPage
              complaintId={activeTicketId}
              onBack={() => setActiveTicketId(null)}
              t={t}
            />
          ) : (
            <TicketSearch
              onSelectComplaint={handleSelectComplaint}
              t={t}
            />
          )
        )}

        {currentTab === 'admin' && (
          <AdminDashboard
            onSelectComplaint={handleSelectComplaint}
            t={t}
          />
        )}
      </main>

      {/* Accessible Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">
          CivicLens • "Snap it. Say it in your language. We file it correctly."
        </p>
        <p>
          Google for Developers PromptWars 2026 • Open Innovation Track
        </p>
        <p className="text-[11px] text-slate-400">
          Powered by Google Gemini 2.5 Flash Multimodal AI • WCAG 2.1 AA Compliant • Client-Side Privacy Sanitization
        </p>
      </footer>
    </div>
  );
}
