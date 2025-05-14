import React from 'react';

interface ATSMeterProps {
  score: number;
}

/**
 * ATSMeter displays a visual representation of an ATS score (0-100).
 */
const ATSMeter: React.FC<ATSMeterProps> = ({ score }) => {
  // Clamp score between 0 and 100 and round
  const percent = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div className="flex items-center space-x-2">
      <div className="w-32 h-2 bg-gray-200 rounded overflow-hidden">
        <div
          className="h-full bg-reslo-blue"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-sm font-medium">{percent}%</span>
    </div>
  );
};

export default ATSMeter;