"use client";
import React from "react";
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

interface EventItem {
  start_time: string;
  end_time: string;
  status: "Off Duty" | "Sleeper Berth" | "Driving" | "On Duty";
  remarks: string;
}

interface DailyLog {
  id: number;
  date: string; // "YYYY-MM-DD"
  total_driving: number;
  total_on_duty: number;
  total_off_duty: number;
  total_sleeper_berth: number;
  events: EventItem[];
}

interface Trip {
  id: number;
  current_location: string;
  dropoff_location: string;
  total_distance: number;
  vehicle_number: string;
  name_of_carrier: string;
  main_office_address: string;
  home_terminal_address: string;
  manifest_number: string;
  shipper_company: string;
  commodity: string;
  logs: DailyLog[];
}

interface Props {
  trip: Trip;
}

// 4 horizontal rows for statuses
const statusRows = ["Off Duty", "Sleeper Berth", "Driving", "On Duty"];

const styles = StyleSheet.create({
  page: {
    fontSize: 8,
    padding: 20,
    fontFamily: "Helvetica",
  },
  header: {
    textAlign: "center",
    marginBottom: 10,
    fontSize: 12,
    fontWeight: "bold",
  },
  gridContainer: {
    border: "1 solid black",
    position: "relative",
    height: 80,
    marginBottom: 10,
  },
  // Each row is 1/4 of the height
  row: {
    borderBottom: "1 solid black",
    height: "25%",
    position: "relative",
  },
  hourLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "black",
  },
  statusBlock: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  remarksSection: {
    marginTop: 5,
    padding: 5,
    border: "1 solid black",
    minHeight: 50,
  },
  remarksText: {
    fontSize: 7,
  },
});

function getRowIndex(status: string): number {
  // 0 = Off Duty, 1 = Sleeper, 2 = Driving, 3 = On Duty
  return statusRows.indexOf(status);
}

// Convert a timestamp to minutes from midnight
function minutesFromMidnight(ts: string): number {
  const d = new Date(ts);
  return d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60;
}

function DailyLogPage({ log }: { log: DailyLog }) {
  // We'll render a 24-hour grid. Each hour is subdivided into 15-min increments => 96 columns.
  // Each row => one of the 4 statuses.
  const lines = Array.from({ length: 25 }, (_, i) => i); // 0..24 hour lines

  // We'll render the event blocks by absolute positioning
  const blocks: React.ReactNode[] = [];
  const remarks: string[] = [];

  log.events.forEach((evt, idx) => {
    const startMin = minutesFromMidnight(evt.start_time);
    const endMin = minutesFromMidnight(evt.end_time);
    const rowIndex = getRowIndex(evt.status);

    // If rowIndex < 0, default to 0 (Off Duty)
    const safeRow = rowIndex >= 0 ? rowIndex : 0;
    // Convert minutes to a percentage of 1440 total minutes in a day
    const leftPct = (startMin / 1440) * 100;
    const widthPct = ((endMin - startMin) / 1440) * 100;
    blocks.push(
      <View
        key={idx}
        style={[
          styles.statusBlock,
          {
            left: `${leftPct}%`,
            width: `${widthPct}%`,
            top: `${(safeRow * 25).toFixed(2)}%`,
            backgroundColor: "rgba(0, 0, 255, 0.2)", // semi-transparent
          },
        ]}
      />
    );
    // Save remarks for the remarks area
    if (evt.remarks) {
      remarks.push(
        `${evt.status} from ${evt.start_time} to ${evt.end_time}: ${evt.remarks}`
      );
    }
  });

  return (
    <View wrap={false}>
      <Text style={styles.header}>
        Daily Log for {log.date} (Miles: Driving {log.total_driving}, On Duty{" "}
        {log.total_on_duty}, Off Duty {log.total_off_duty}, Sleeper{" "}
        {log.total_sleeper_berth})
      </Text>

      <View style={styles.gridContainer}>
        {/* 4 rows for 4 statuses */}
        {statusRows.map((_, rowIndex) => (
          <View
            key={rowIndex}
            style={[
              styles.row,
              rowIndex === statusRows.length - 1 ? { borderBottom: "none" } : {},
            ]}
          />
        ))}
        {/* Hour lines (vertical) */}
        {lines.map((line) => {
          const left = (line / 24) * 100;
          return (
            <View
              key={line}
              style={[
                styles.hourLine,
                { left: `${left}%` },
                line === 24 ? { backgroundColor: "red" } : {},
              ]}
            />
          );
        })}
        {/* status blocks */}
        {blocks}
      </View>

      <View style={styles.remarksSection}>
        {remarks.map((r, i) => (
          <Text key={i} style={styles.remarksText}>
            {r}
          </Text>
        ))}
      </View>
    </View>
  );
}

function DailyLogDocument({ trip }: { trip: Trip }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>
          Driver’s Daily Log - Trip {trip.id} - Vehicle #{trip.vehicle_number}
        </Text>
        <Text style={{ marginBottom: 5, fontSize: 8 }}>
          Carrier: {trip.name_of_carrier}, Main Office: {trip.main_office_address}, Home Terminal:{" "}
          {trip.home_terminal_address}, Manifest #: {trip.manifest_number}, Shipper: {trip.shipper_company}, Commodity: {trip.commodity}
        </Text>

        {trip.logs.map((log) => (
          <DailyLogPage key={log.id} log={log} />
        ))}
      </Page>
    </Document>
  );
}

export default function DailyLogPdf({ trip }: Props) {
  return (
    <PDFDownloadLink
      document={<DailyLogDocument trip={trip} />}
      fileName={`trip_${trip.id}_daily_log.pdf`}
    >
      {({ loading }) => (loading ? "Generating PDF..." : "Download Daily Log PDF")}
    </PDFDownloadLink>
  );
}
