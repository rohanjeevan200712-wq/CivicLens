import React from 'react';
import { AlertTriangle, PhoneCall, ShieldAlert, ArrowRight } from 'lucide-react';

export default function EmergencyBanner({ hazardType, helplineNumber, actionInstruction, departmentName }) {
  const number = helplineNumber || "112";
  const title = hazardType || "Urgent Public Safety Hazard Detected";
  const instructions = actionInstruction || "Stay at a safe distance and alert pedestrians nearby immediately.";
  const dept = departmentName || "Municipal Emergency Control Room";

  return (
    <div 
      role="alert" 
      aria-live="assertive"
      className="bg-red-50 border-2 border-red-500 rounded-xl p-4 sm:p-5 shadow-md mb-6 animate-pulse-subtle"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="p-2.5 bg-red-600 text-white rounded-lg flex-shrink-0">
          <ShieldAlert className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
              Emergency Safety Alert
            </span>
            <span className="text-xs text-red-700 font-semibold">{dept}</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-red-900 mt-1">
            {title}
          </h3>
          <p className="text-sm text-red-800 mt-1 font-medium leading-relaxed">
            {instructions}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a
              href={`tel:${number.replace(/[^0-9]/g, '')}`}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-lg shadow transition tap-target focus:ring-4 focus:ring-red-300"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call Helpline {number} Now</span>
            </a>
            <span className="text-xs text-red-700 font-semibold">
              Toll-Free • 24/7 Rapid Response
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
