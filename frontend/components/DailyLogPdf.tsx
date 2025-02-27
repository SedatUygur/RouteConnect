"use client";

import React from 'react';

interface DailyLog {
    id: number;
    date: string;
    total_driving: number;
    total_on_duty: number;
    total_off_duty: number;
    total_sleeper_berth: number;
}

interface DailyLogPdfProps {
    logs: DailyLog[];
}

export default function DailyLogPdf() {
  return (
    <div>
      <h1>Daily Log PDF</h1>
    </div>
  );
}
