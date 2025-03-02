/* eslint-disable jsx-a11y/alt-text */
"use client";
import React, { JSX } from "react";
import {
  PDFDownloadLink,
  Document,
  Page,
  Image,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

/* ------------------------------------------------------------------
   1) Data Models
------------------------------------------------------------------ */
interface EventItem {
  start_time: string; // ISO datetime
  end_time: string;   // ISO datetime
  status: "Off Duty" | "Sleeper Berth" | "Driving" | "On Duty";
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

interface DailyLogPdfProps {
  trip: Trip;
}

/* ------------------------------------------------------------------
   2) Styles
   We assume an 8.5" x 11" page (612 x 792 points). The background image 
   of the blank log already contains the grid.
------------------------------------------------------------------ */
const styles = StyleSheet.create({
  page: {
    width: "8.5in",
    height: "11in",
    position: "relative",
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "8.5in",
    height: "11in",
  },
  textField: {
    position: "absolute",
    fontSize: 10,
  },
  timelineLine: {
    position: "absolute",
    backgroundColor: "#f00", // red color for timeline lines
  },
  statusTotals: {
    position: "absolute",
    fontSize: 8,
  },
});

/* ------------------------------------------------------------------
   3) Helper Functions
------------------------------------------------------------------ */
// Convert ISO datetime to minutes from midnight (0 to 1440)
function minutesFromMidnight(isoString: string): number {
  const d = new Date(isoString);
  return d.getHours() * 60 + d.getMinutes();
}

// Map status to row index (0=Off Duty, 1=Sleeper Berth, 2=Driving, 3=On Duty)
function getStatusRowIndex(status: string): number {
  switch (status) {
    case "Off Duty":
      return 0;
    case "Sleeper Berth":
      return 1;
    case "Driving":
      return 2;
    case "On Duty":
      return 3;
    default:
      return 0;
  }
}

/**
 * buildFullTimeline creates one continuous timeline covering 24 hours.
 * It fills any gaps with the previous duty status (defaulting to "Off Duty" at midnight)
 * and draws horizontal lines (in the center of the duty row) for continuous segments.
 * At status transitions, a vertical line is drawn.
 * Returns:
 *   - lines: an array of JSX elements (the drawn timeline lines).
 *   - statusMinutes: a record of total minutes spent in each duty status.
 */
function buildFullTimeline(
  events: EventItem[],
  gridLeft: number,
  gridTop: number,
  gridWidth: number,
  rowHeight: number
): { lines: JSX.Element[]; statusMinutes: Record<string, number> } {
  const dayStart = 0;
  const dayEnd = 1440; // 24*60

  // Sort events by start time (in minutes)
  const sorted = [...events].sort(
    (a, b) =>
      minutesFromMidnight(a.start_time) - minutesFromMidnight(b.start_time)
  );

  // Initialize with default status "Off Duty" from midnight
  const segments: { start: number; end: number; status: string }[] = [];
  let prevTime = dayStart;
  let prevStatus = "Off Duty";

  // If there are events and the first event doesn't start at midnight, fill gap with default.
  if (sorted.length === 0 || minutesFromMidnight(sorted[0].start_time) > dayStart) {
    segments.push({
      start: dayStart,
      end: sorted.length > 0 ? minutesFromMidnight(sorted[0].start_time) : dayEnd,
      status: prevStatus,
    });
    prevTime = sorted.length > 0 ? minutesFromMidnight(sorted[0].start_time) : dayEnd;
  }

  // Process each event
  sorted.forEach((evt) => {
    const evtStart = minutesFromMidnight(evt.start_time);
    const evtEnd = minutesFromMidnight(evt.end_time);
    // Fill gap from prevTime to event start if any
    if (evtStart > prevTime) {
      segments.push({ start: prevTime, end: evtStart, status: prevStatus });
      prevTime = evtStart;
    }
    // If status changes at evtStart, add vertical boundary by ending previous segment and starting new one.
    if (evt.status !== prevStatus) {
      // (Vertical line will be drawn later)
      prevStatus = evt.status;
    }
    // Add current event segment
    segments.push({ start: evtStart, end: evtEnd, status: evt.status });
    prevTime = evtEnd;
    prevStatus = evt.status;
  });

  // Fill remainder to midnight
  if (prevTime < dayEnd) {
    segments.push({ start: prevTime, end: dayEnd, status: prevStatus });
  }

  // Build timeline lines (only horizontal and vertical boundaries)
  const lines: JSX.Element[] = [];
  const statusMinutes: Record<string, number> = {
    "Off Duty": 0,
    "Sleeper Berth": 0,
    "Driving": 0,
    "On Duty": 0,
  };
  const ratio = gridWidth / 1440;

  // Draw horizontal segments for each continuous segment
  segments.forEach((seg, i) => {
    const row = getStatusRowIndex(seg.status);
    const x1 = gridLeft + seg.start * ratio;
    const x2 = gridLeft + seg.end * ratio;
    const y = gridTop + row * rowHeight + rowHeight / 2; // center of row
    lines.push(
      <View
        key={`h-${i}`}
        style={[
          styles.timelineLine,
          {
            top: y,
            left: Math.min(x1, x2),
            width: Math.abs(x2 - x1),
            height: 1,
          },
        ]}
      />
    );
    statusMinutes[seg.status] += seg.end - seg.start;

    // If not the first segment and status changes, draw a vertical line at the boundary.
    if (i > 0 && segments[i - 1].status !== seg.status) {
      const boundary = seg.start;
      const x = gridLeft + boundary * ratio;
      const prevRow = getStatusRowIndex(segments[i - 1].status);
      const curRow = row;
      const y1 = gridTop + Math.min(prevRow, curRow) * rowHeight + rowHeight / 2;
      const y2 = gridTop + Math.max(prevRow, curRow) * rowHeight + rowHeight / 2;
      lines.push(
        <View
          key={`v-${i}`}
          style={[
            styles.timelineLine,
            {
              top: y1,
              left: x,
              width: 1,
              height: y2 - y1,
            },
          ]}
        />
      );
    }
  });

  return { lines, statusMinutes };
}

/* ------------------------------------------------------------------
   4) DailyLogPage Component
------------------------------------------------------------------ */
function DailyLogPage({ log, trip }: { log: DailyLog; trip: Trip }) {
  // Set the positions for text fields (adjust to match your blank log)
  const monthPos = { top: 15, left: 220 };
  const dayPos = { top: 15, left: 270 };
  const yearPos = { top: 15, left: 315 };
  const fromPos = { top: 58, left: 105 };
  const toPos = { top: 58, left: 325 };
  const milesPos = { top: 113, left: 95 };
  const mileagePos = { top: 113, left: 190 };
  const vehiclePos = { top: 163, left: 120 };
  const carrierPos = { top: 105, left: 370 };
  const mainOfficePos = { top: 137, left: 360 };
  const homeTerminalPos = { top: 170, left: 360 };
  const manifestPos = { top: 546, left: 125 };
  const shipperPos = { top: 589, left: 125 };

  const offDutyPos = { top: 10, right: 65 };
  const sleeperPos = { top: 37, right: 65 };
  const drivingPos = { top: 63, right: 65 };
  const onDutyPos = { top: 90, right: 65 };
  const totalPos = { top: 135, right: 65 };

  // Timeline area: the timeline covers exactly one day: from midnight to midnight.
  // Here, gridLeft, gridTop, gridWidth, and rowHeight define where the timeline is drawn.
  const gridLeft = 77;
  const gridTop = 285;
  const gridWidth = 464; // width for 24 hours
  const rowHeight = 25;  // each duty status row height

  // Build the full timeline (one continuous timeline for the day)
  const { lines: timelineLines, statusMinutes } = buildFullTimeline(
    log.events,
    gridLeft,
    gridTop,
    gridWidth,
    rowHeight
  );

  // Compute total hours per status
  const offDutyH = statusMinutes["Off Duty"] / 60;
  const sleeperH = statusMinutes["Sleeper Berth"] / 60;
  const drivingH = statusMinutes["Driving"] / 60;
  const onDutyH = statusMinutes["On Duty"] / 60;
  const totalH = offDutyH + sleeperH + drivingH + onDutyH; // should equal 24
  const fmt = (val: number) => val.toFixed(2).replace(".00", "");

  // Format the date as MM/DD/YYYY
  const d = new Date(log.date);
  const logMonth = d.getMonth() + 1;
  const logDay = d.getDate();
  const logYear = d.getFullYear();

  return (
    <Page size={{ width: 612, height: 792 }} style={styles.page}>
      {/* Background image (the blank daily log) */}
      <Image src="/images/blank-drivers-daily-log.png" style={styles.background} />

      {/* Overlay basic fields */}
      <Text style={[styles.textField, { top: monthPos.top, left: monthPos.left }]}>
        {logMonth}
      </Text>
      <Text style={[styles.textField, { top: dayPos.top, left: dayPos.left }]}>
        {logDay}
      </Text>
      <Text style={[styles.textField, { top: yearPos.top, left: yearPos.left }]}>
        {logYear}
      </Text>
      <Text style={[styles.textField, { top: fromPos.top, left: fromPos.left }]}>
        {trip.current_location}
      </Text>
      <Text style={[styles.textField, { top: toPos.top, left: toPos.left }]}>
        {trip.dropoff_location}
      </Text>
      <Text style={[styles.textField, { top: milesPos.top, left: milesPos.left }]}>
        {trip.total_distance}
      </Text>
      <Text style={[styles.textField, { top: mileagePos.top, left: mileagePos.left }]}>
        {trip.total_distance}
      </Text>
      <Text style={[styles.textField, { top: vehiclePos.top, left: vehiclePos.left }]}>
        {trip.vehicle_number}
      </Text>
      <Text style={[styles.textField, { top: carrierPos.top, left: carrierPos.left }]}>
        {trip.name_of_carrier}
      </Text>
      <Text style={[styles.textField, { top: mainOfficePos.top, left: mainOfficePos.left }]}>
        {trip.main_office_address}
      </Text>
      <Text style={[styles.textField, { top: homeTerminalPos.top, left: homeTerminalPos.left }]}>
        {trip.home_terminal_address}
      </Text>
      <Text style={[styles.textField, { top: manifestPos.top, left: manifestPos.left }]}>
        {trip.manifest_number}
      </Text>
      <Text style={[styles.textField, { top: shipperPos.top, left: shipperPos.left }]}>
        {trip.shipper_company} , {trip.commodity}
      </Text>

      {/* Draw the timeline (only the timeline lines, no grid; the background already has grid) */}
      {timelineLines}

      {/* Show total hours for each duty status on the right side */}
      <View style={[styles.statusTotals, { top: gridTop, left: gridLeft + gridWidth + 20 }]}>
        <Text style={[styles.textField, { top: offDutyPos.top, left: offDutyPos.left }]}>{fmt(offDutyH)}</Text>
        <Text style={[styles.textField, { top: sleeperPos.top, left: sleeperPos.left }]}>{fmt(sleeperH)}</Text>
        <Text style={[styles.textField, { top: drivingPos.top, left: drivingPos.left }]}>{fmt(drivingH)}</Text>
        <Text style={[styles.textField, { top: onDutyPos.top, left: onDutyPos.left }]}>{fmt(onDutyH)}</Text>
        <Text style={[styles.textField, { top: totalPos.top, left: totalPos.left }]}>{fmt(totalH)}</Text>
      </View>
    </Page>
  );
}

/* ------------------------------------------------------------------
   5) Document for All Daily Logs
------------------------------------------------------------------ */
function DailyLogDocument({ trip }: { trip: Trip }) {
  return (
    <Document>
      {trip.logs.map((log) => (
        <DailyLogPage key={log.id} log={log} trip={trip} />
      ))}
    </Document>
  );
}

/* ------------------------------------------------------------------
   6) Exported PDFDownloadLink Component
------------------------------------------------------------------ */
export default function DailyLogPdf({ trip }: DailyLogPdfProps) {
  return (
    <PDFDownloadLink
      document={<DailyLogDocument trip={trip} />}
      fileName={`trip_${trip.id}_daily_log.pdf`}
    >
      {({ loading }) => (loading ? "Generating PDF..." : "Download Driver's Daily Log")}
    </PDFDownloadLink>
  );
}
