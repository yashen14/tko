import { RequestHandler } from "express";
import { TimeLog, StaffTimeRecord, TimeTrackingExport } from "@shared/types";
import { users } from "./auth";

// In-memory storage for time logs - in production, use a proper database
export const timeLogs: TimeLog[] = [];

let timeLogIdCounter = 1;

export const handleCheckIn: RequestHandler = (req, res) => {
  try {
    const { staffId } = req.params;
    const { latitude, longitude, address } = req.body;

    // Verify staff exists
    const staff = users.find(u => u.id === staffId);
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Check if already checked in today
    const today = new Date().toISOString().split('T')[0];
    const existingCheckIn = timeLogs.find(
      log => log.staffId === staffId && 
             log.type === "check_in" && 
             log.timestamp.startsWith(today) &&
             !timeLogs.some(
               checkout => checkout.staffId === staffId && 
                          checkout.type === "check_out" && 
                          checkout.timestamp > log.timestamp
             )
    );

    if (existingCheckIn) {
      return res.status(400).json({ error: "Already checked in today" });
    }

    const timeLog: TimeLog = {
      id: `time-log-${timeLogIdCounter++}`,
      staffId,
      type: "check_in",
      timestamp: new Date().toISOString(),
      location: latitude && longitude ? {
        latitude,
        longitude,
        address
      } : undefined
    };

    timeLogs.push(timeLog);
    res.json(timeLog);
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleCheckOut: RequestHandler = (req, res) => {
  try {
    const { staffId } = req.params;
    const { latitude, longitude, address } = req.body;

    // Verify staff exists
    const staff = users.find(u => u.id === staffId);
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Check if checked in today
    const today = new Date().toISOString().split('T')[0];
    const todaysCheckIn = timeLogs.find(
      log => log.staffId === staffId && 
             log.type === "check_in" && 
             log.timestamp.startsWith(today)
    );

    if (!todaysCheckIn) {
      return res.status(400).json({ error: "No check-in found for today" });
    }

    // Check if already checked out
    const existingCheckOut = timeLogs.find(
      log => log.staffId === staffId && 
             log.type === "check_out" && 
             log.timestamp.startsWith(today) &&
             log.timestamp > todaysCheckIn.timestamp
    );

    if (existingCheckOut) {
      return res.status(400).json({ error: "Already checked out today" });
    }

    // End any active jobs
    const activeJobLogs = timeLogs.filter(
      log => log.staffId === staffId && 
             log.type === "job_start" && 
             log.timestamp.startsWith(today) &&
             !timeLogs.some(
               endLog => endLog.staffId === staffId && 
                        endLog.type === "job_end" && 
                        endLog.jobId === log.jobId &&
                        endLog.timestamp > log.timestamp
             )
    );

    // Auto-end active jobs
    activeJobLogs.forEach(jobLog => {
      if (jobLog.jobId) {
        const endJobLog: TimeLog = {
          id: `time-log-${timeLogIdCounter++}`,
          staffId,
          type: "job_end",
          timestamp: new Date().toISOString(),
          jobId: jobLog.jobId,
          location: latitude && longitude ? {
            latitude,
            longitude,
            address
          } : undefined,
          notes: "Auto-ended due to check-out"
        };
        timeLogs.push(endJobLog);
      }
    });

    const timeLog: TimeLog = {
      id: `time-log-${timeLogIdCounter++}`,
      staffId,
      type: "check_out",
      timestamp: new Date().toISOString(),
      location: latitude && longitude ? {
        latitude,
        longitude,
        address
      } : undefined
    };

    timeLogs.push(timeLog);
    res.json(timeLog);
  } catch (error) {
    console.error("Check-out error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleTimeLog: RequestHandler = (req, res) => {
  try {
    const { staffId } = req.params;
    const { type, jobId, location, notes } = req.body;

    // Verify staff exists
    const staff = users.find(u => u.id === staffId);
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Validate type
    if (!["job_start", "job_end"].includes(type)) {
      return res.status(400).json({ error: "Invalid time log type" });
    }

    // For job logs, jobId is required
    if ((type === "job_start" || type === "job_end") && !jobId) {
      return res.status(400).json({ error: "Job ID is required for job time logs" });
    }

    const timeLog: TimeLog = {
      id: `time-log-${timeLogIdCounter++}`,
      staffId,
      type: type as "job_start" | "job_end",
      timestamp: new Date().toISOString(),
      jobId,
      location,
      notes
    };

    timeLogs.push(timeLog);
    res.json(timeLog);
  } catch (error) {
    console.error("Time log error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetTimeRecords: RequestHandler = (req, res) => {
  try {
    const { startDate, endDate, staffId } = req.query;

    // Verify admin access
    const token = req.headers.authorization?.replace("Bearer ", "");
    const userId = token ? token.replace("mock-token-", "") : "";
    const user = users.find(u => u.id === userId);
    
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Only administrators can view time records" });
    }

    let filteredLogs = timeLogs;

    // Filter by date range
    if (startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= `${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= `${endDate}T23:59:59.999Z`);
    }

    // Filter by staff ID
    if (staffId) {
      filteredLogs = filteredLogs.filter(log => log.staffId === staffId);
    }

    // Group logs by staff and date
    const staffRecords: StaffTimeRecord[] = [];
    const staffMap = new Map<string, Map<string, TimeLog[]>>();

    // Organize logs by staff and date
    filteredLogs.forEach(log => {
      const date = log.timestamp.split('T')[0];
      
      if (!staffMap.has(log.staffId)) {
        staffMap.set(log.staffId, new Map());
      }
      
      const staffDateMap = staffMap.get(log.staffId)!;
      if (!staffDateMap.has(date)) {
        staffDateMap.set(date, []);
      }
      
      staffDateMap.get(date)!.push(log);
    });

    // Build staff records
    staffMap.forEach((dateMap, staffId) => {
      const staff = users.find(u => u.id === staffId);
      if (!staff) return;

      dateMap.forEach((logs, date) => {
        const checkInLog = logs.find(log => log.type === "check_in");
        const checkOutLog = logs.find(log => log.type === "check_out");
        const jobStartLogs = logs.filter(log => log.type === "job_start");
        const jobEndLogs = logs.filter(log => log.type === "job_end");

        // Calculate total work hours
        let totalWorkHours = 0;
        if (checkInLog && checkOutLog) {
          const checkInTime = new Date(checkInLog.timestamp);
          const checkOutTime = new Date(checkOutLog.timestamp);
          totalWorkHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
        }

        // Build job logs
        const jobLogs = jobStartLogs.map(startLog => {
          const endLog = jobEndLogs.find(log => log.jobId === startLog.jobId);
          let duration = undefined;
          
          if (endLog) {
            const startTime = new Date(startLog.timestamp);
            const endTime = new Date(endLog.timestamp);
            duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
          }

          return {
            jobId: startLog.jobId || "",
            jobTitle: `Job ${startLog.jobId}`, // In production, fetch actual job title
            startTime: startLog.timestamp,
            endTime: endLog?.timestamp,
            duration
          };
        });

        const record: StaffTimeRecord = {
          staffId,
          staffName: staff.name,
          date,
          checkInTime: checkInLog?.timestamp,
          checkOutTime: checkOutLog?.timestamp,
          totalWorkHours: totalWorkHours > 0 ? Math.round(totalWorkHours * 100) / 100 : undefined,
          jobLogs
        };

        staffRecords.push(record);
      });
    });

    // Sort by date and staff name
    staffRecords.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.staffName.localeCompare(b.staffName);
    });

    res.json(staffRecords);
  } catch (error) {
    console.error("Get time records error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleExportTimeRecords: RequestHandler = (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Verify admin access
    const token = req.headers.authorization?.replace("Bearer ", "");
    const userId = token ? token.replace("mock-token-", "") : "";
    const user = users.find(u => u.id === userId);
    
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Only administrators can export time records" });
    }

    let filteredLogs = timeLogs;

    // Filter by date range
    if (startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= `${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= `${endDate}T23:59:59.999Z`);
    }

    // Generate CSV content
    const csvRows = [
      'Staff Name,Date,Check In Time,Check Out Time,Total Work Hours,Job ID,Job Start Time,Job End Time,Job Duration (minutes)'
    ];

    // Group logs by staff and date
    const staffMap = new Map<string, Map<string, TimeLog[]>>();

    filteredLogs.forEach(log => {
      const date = log.timestamp.split('T')[0];
      
      if (!staffMap.has(log.staffId)) {
        staffMap.set(log.staffId, new Map());
      }
      
      const staffDateMap = staffMap.get(log.staffId)!;
      if (!staffDateMap.has(date)) {
        staffDateMap.set(date, []);
      }
      
      staffDateMap.get(date)!.push(log);
    });

    // Build CSV rows
    staffMap.forEach((dateMap, staffId) => {
      const staff = users.find(u => u.id === staffId);
      if (!staff) return;

      dateMap.forEach((logs, date) => {
        const checkInLog = logs.find(log => log.type === "check_in");
        const checkOutLog = logs.find(log => log.type === "check_out");
        const jobStartLogs = logs.filter(log => log.type === "job_start");
        const jobEndLogs = logs.filter(log => log.type === "job_end");

        // Calculate total work hours
        let totalWorkHours = '';
        if (checkInLog && checkOutLog) {
          const checkInTime = new Date(checkInLog.timestamp);
          const checkOutTime = new Date(checkOutLog.timestamp);
          const hours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
          totalWorkHours = (Math.round(hours * 100) / 100).toString();
        }

        const checkInTime = checkInLog ? new Date(checkInLog.timestamp).toLocaleTimeString() : '';
        const checkOutTime = checkOutLog ? new Date(checkOutLog.timestamp).toLocaleTimeString() : '';

        if (jobStartLogs.length === 0) {
          // Add row without job data
          csvRows.push(`"${staff.name}","${date}","${checkInTime}","${checkOutTime}","${totalWorkHours}","","","",""`);
        } else {
          // Add row for each job
          jobStartLogs.forEach(startLog => {
            const endLog = jobEndLogs.find(log => log.jobId === startLog.jobId);
            const jobStartTime = new Date(startLog.timestamp).toLocaleTimeString();
            const jobEndTime = endLog ? new Date(endLog.timestamp).toLocaleTimeString() : '';
            let duration = '';
            
            if (endLog) {
              const startTime = new Date(startLog.timestamp);
              const endTime = new Date(endLog.timestamp);
              duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)).toString();
            }

            csvRows.push(`"${staff.name}","${date}","${checkInTime}","${checkOutTime}","${totalWorkHours}","${startLog.jobId || ''}","${jobStartTime}","${jobEndTime}","${duration}"`);
          });
        }
      });
    });

    const csvContent = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="time-records-${startDate || 'all'}-to-${endDate || 'all'}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error("Export time records error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
