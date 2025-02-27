"use client";

import React from 'react';
import {
    Document,
    Page,
    PDFDownloadLink,
    StyleSheet,
    Text,
    View,
} from '@react-pdf/renderer';

// Define interfaces for timeline events and daily logs.
export interface DailyLogEvent {
    start_time: string; // ISO string e.g., "2025-02-25T08:30:00Z"
    end_time: string;   // ISO string e.g., "2025-02-25T10:00:00Z"
    status: 'Driving' | 'On Duty' | 'Off Duty' | 'Sleeper';
}

export interface DailyLog {
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

// Helper to convert hours into a percentage width on a 24-hour grid
const hourToPercent = (hour: number): string => ((hour / 24) * 100).toFixed(2) + '%';

// Map statuses to colors.
const statusColors: { [key: string]: string } = {
    Driving: '#a8d5e2',
    'On Duty': '#f3eac2',
    'Off Duty': '#d3e9d7',
    Sleeper: '#c8bfe7',
};

// Define styles for the PDF document
const styles = StyleSheet.create({
    page: {
      padding: 20,
      fontSize: 10,
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
    },
    timeBlock: {
      width: '4.16%', // 100% / 24 hours
      borderRight: '1 solid black',
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logItem: {
      marginTop: 10,
    },
});

// Helper function: given an event and the log's date (assumed in YYYY-MM-DD), compute its left offset and width.
const computePosition = (event: DailyLogEvent, logDate: string): { left: string; width: string } => {
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
  
        {/* Draw 24-hour grid */}
        <View style={styles.grid}>
          {Array.from({ length: 24 }, (_, i) => (
            <View key={i} style={styles.timeBlock}>
              <Text>{i}</Text>
            </View>
          ))}
        </View>
  
        {/* For each log, overlay status blocks.
            For demonstration, we simulate blocks based on total_driving, on_duty, and off_duty values.
            In a production app, you would calculate exact positions from timestamp data. */}
        {logs.map((log) => {
          const drivingWidth = hourToPercent(log.total_driving);
          const onDutyWidth = hourToPercent(log.total_on_duty - log.total_driving);
          const offDutyWidth = hourToPercent(log.total_off_duty);
          return (
            <View key={log.id} style={styles.logItem}>
              <Text>Date: {log.date}</Text>
              <View style={{ flexDirection: 'row', height: 50, border: '1 solid black' }}>
                <View style={{ width: drivingWidth, backgroundColor: '#a8d5e2' }}>
                    <Text>driving</Text>
                </View>
                <View style={{ width: onDutyWidth, backgroundColor: '#f3eac2' }}>
                    <Text>onDuty</Text>
                </View>
                <View style={{ width: offDutyWidth, backgroundColor: '#d3e9d7' }}>
                    <Text>offDuty</Text>
                </View>
              </View>
            </View>
          );
        })}
      </Page>
    </Document>
);

export default function DailyLogPdf({ logs }: DailyLogPdfProps) {
  return (
    <div>
      <PDFDownloadLink document={<DailyLogDocument logs={logs} />} fileName="daily_log.pdf">
        {({ loading }) => (loading ? 'Generating PDF...' : 'Download Daily Log PDF')}
      </PDFDownloadLink>
    </div>
  );
}
