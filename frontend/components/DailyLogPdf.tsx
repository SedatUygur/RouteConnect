'use client';

import React from 'react';
import {
  Document,
  Page,
  PDFDownloadLink,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

export interface DailyLog {
  id: number;
  date: string;
  events: DailyLogEvent[];
}

interface DailyLogPdfProps {
  logs: DailyLog[];
}

// Define interfaces for timeline events and daily logs.
export interface DailyLogEvent {
  start_time: string; // ISO string e.g., "2025-02-25T08:30:00Z"
  end_time: string; // ISO string e.g., "2025-02-25T10:00:00Z"
  status: 'Break' | 'Driving' | 'Dropoff' | 'Pickup' | 'Fuel';
}

// Define styles for the PDF document
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  header: {
    textAlign: 'center',
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    borderBottom: '1 solid black',
    borderTop: '1 solid black',
    position: 'relative',
    height: 50,
    marginTop: 5,
  },
  timeBlock: {
    width: '4.16%', // 100% / 24 hours
    borderRight: '1 solid black',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventBlock: {
    position: 'absolute',
    top: 0,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logItem: {
    marginTop: 20,
  },
});

// Map statuses to colors.
const statusColors: { [key: string]: string } = {
  Break: '#c8bfe7',
  Fuel: '#d3e9d7',
  Driving: '#a8d5e2',
  Dropoff: '#f7d4d4',
  Pickup: '#f3eac2',
};

// Helper function: given an event and the log's date (assumed in YYYY-MM-DD), compute its left offset and width.
const computePosition = (
  event: DailyLogEvent,
  logDate: string,
): { left: string; width: string } => {
  const midnight = new Date(logDate + 'T00:00:00'); // local midnight for that day
  const eventStart = new Date(event.start_time);
  const eventEnd = new Date(event.end_time);
  const totalDayMs = 24 * 3600 * 1000;

  const leftMs = Math.max(eventStart.getTime() - midnight.getTime(), 0);
  const widthMs = eventEnd.getTime() - eventStart.getTime();

  const leftPercent = (leftMs / totalDayMs) * 100;
  const widthPercent = (widthMs / totalDayMs) * 100;

  return {
    left: leftPercent.toFixed(2) + '%',
    width: widthPercent.toFixed(2) + '%',
  };
};

const DailyLogDocument = ({ logs }: { logs: DailyLog[] }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Driver’s Daily Log</Text>

      {logs.map((log) => (
        <View key={log.id} style={styles.logItem}>
          <Text>Date: {log.date}</Text>
          <View style={styles.grid}>
            {/* Render 24 grid blocks for each hour */}
            {Array.from({ length: 24 }, (_, i) => (
              <View key={i} style={styles.timeBlock}>
                <Text>{i}</Text>
              </View>
            ))}
            {/* Overlay each event based on its actual timestamp data */}
            {log.events?.map((event, idx) => {
              const pos = computePosition(event, log.date);
              return (
                <View
                  key={idx}
                  style={[
                    styles.eventBlock,
                    {
                      left: pos.left,
                      width: pos.width,
                      backgroundColor: statusColors[event.status] || '#ccc',
                    },
                  ]}
                >
                  <Text style={{ fontSize: 6, color: 'black' }}>{event.status}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </Page>
  </Document>
);

export default function DailyLogPdf({ logs }: DailyLogPdfProps) {
  return (
    <div className="mt-4">
      <PDFDownloadLink
        className="inline-block rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        document={<DailyLogDocument logs={logs} />}
        fileName="daily_log.pdf"
      >
        {({ loading }) => (loading ? 'Generating PDF...' : 'Download Daily Log PDF')}
      </PDFDownloadLink>
    </div>
  );
}
