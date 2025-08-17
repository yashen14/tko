import { User, Job } from "@shared/types";

export interface StaffAvailability {
  staffId: string;
  staff: User;
  currentJobs: number;
  pendingJobs: number;
  todayJobs: number;
  weekJobs: number;
  availabilityScore: number; // Lower is better (more available)
  isOnShift: boolean;
  canTakeNewJob: boolean;
}

/**
 * Calculate staff availability and return the most available staff member
 */
export function getNextAvailableStaff(
  allStaff: User[],
  allJobs: Job[],
  targetDate?: string,
  preferredLocation?: "Johannesburg" | "Cape Town"
): User | null {
  const availabilityData = calculateStaffAvailability(allStaff, allJobs, targetDate);
  
  // Filter by location if specified
  let filteredStaff = availabilityData;
  if (preferredLocation) {
    filteredStaff = availabilityData.filter(
      staff => staff.staff.location?.city === preferredLocation
    );
  }

  // Filter to only staff who can take new jobs (remove strict shift requirement for scheduling)
  const availableStaff = filteredStaff.filter(
    staff => staff.canTakeNewJob
  );

  if (availableStaff.length === 0) {
    // If no staff in preferred location, try all locations
    if (preferredLocation) {
      const allLocationStaff = availabilityData.filter(staff => staff.canTakeNewJob);
      if (allLocationStaff.length > 0) {
        const lowestScore = Math.min(...allLocationStaff.map(s => s.availabilityScore));
        const bestAvailableStaff = allLocationStaff.filter(s => s.availabilityScore === lowestScore);
        const randomIndex = Math.floor(Math.random() * bestAvailableStaff.length);
        return bestAvailableStaff[randomIndex].staff;
      }
    }
    return null;
  }

  // If multiple staff have the same low availability score, randomly select one
  const lowestScore = Math.min(...availableStaff.map(s => s.availabilityScore));
  const bestAvailableStaff = availableStaff.filter(s => s.availabilityScore === lowestScore);

  if (bestAvailableStaff.length === 1) {
    return bestAvailableStaff[0].staff;
  }

  // Randomly select from equally available staff
  const randomIndex = Math.floor(Math.random() * bestAvailableStaff.length);
  return bestAvailableStaff[randomIndex].staff;
}

/**
 * Calculate detailed availability information for all staff members
 */
export function calculateStaffAvailability(
  allStaff: User[],
  allJobs: Job[],
  targetDate?: string
): StaffAvailability[] {
  const today = targetDate ? new Date(targetDate) : new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Calculate start and end of current week
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Sunday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Saturday

  return allStaff
    .filter(staff => staff.role === 'staff')
    .map(staff => {
      const staffJobs = allJobs.filter(job => job.assignedTo === staff.id);
      
      // Count different types of jobs
      const currentJobs = staffJobs.filter(job => 
        job.status === 'in_progress' || job.status === 'pending'
      ).length;
      
      const pendingJobs = staffJobs.filter(job => job.status === 'pending').length;
      
      const todayJobs = staffJobs.filter(job => {
        if (!job.dueDate) return false;
        const jobDate = new Date(job.dueDate).toISOString().split('T')[0];
        return jobDate === todayStr;
      }).length;
      
      const weekJobs = staffJobs.filter(job => {
        if (!job.dueDate) return false;
        const jobDate = new Date(job.dueDate);
        return jobDate >= weekStart && jobDate <= weekEnd;
      }).length;

      // Check if staff is currently on shift (for scoring, not blocking)
      const isOnShift = isStaffOnShift(staff, today);

      // Calculate availability score (lower = more available)
      let availabilityScore = 0;
      availabilityScore += currentJobs * 3; // Current jobs weigh heavily
      availabilityScore += pendingJobs * 2; // Pending jobs weigh moderately
      availabilityScore += todayJobs * 1.5; // Today's jobs
      availabilityScore += weekJobs * 0.5; // Week's jobs weigh lightly

      // Small penalty for being off shift (but don't block assignment)
      if (!isOnShift) {
        availabilityScore += 5; // Small penalty for off-shift staff
      }

      // Determine if staff can take new jobs (more lenient limits)
      const maxDailyJobs = 15; // Increased daily limit
      const maxWeeklyJobs = 50; // Increased weekly limit
      const canTakeNewJob = todayJobs < maxDailyJobs && weekJobs < maxWeeklyJobs;

      return {
        staffId: staff.id,
        staff,
        currentJobs,
        pendingJobs,
        todayJobs,
        weekJobs,
        availabilityScore,
        isOnShift,
        canTakeNewJob
      };
    })
    .sort((a, b) => a.availabilityScore - b.availabilityScore); // Sort by availability (best first)
}

/**
 * Check if staff member is currently on their shift
 */
function isStaffOnShift(staff: User, targetTime: Date): boolean {
  const schedule = staff.schedule;
  if (!schedule) {
    // Default shift if no schedule specified - assume available during business hours
    const hour = targetTime.getHours();
    return hour >= 5 && hour < 17; // 5 AM to 5 PM default
  }

  // For job scheduling purposes, be more lenient than strict shift times
  // Consider staff available if it's a reasonable working hour
  const hour = targetTime.getHours();

  // If it's a reasonable working hour (6 AM to 8 PM), consider them available
  if (hour >= 6 && hour <= 20) {
    return true;
  }

  // For early morning or late evening, check their actual shift
  const currentHour = targetTime.getHours();
  const currentMinute = targetTime.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  // Parse shift times
  const [startHour, startMinute] = (schedule.shiftStartTime || '05:00').split(':').map(Number);
  const startTimeInMinutes = startHour * 60 + startMinute;

  const [endHour, endMinute] = (schedule.shiftEndTime || '17:00').split(':').map(Number);
  const endTimeInMinutes = endHour * 60 + endMinute;

  // Check if current time is within shift hours
  if (startTimeInMinutes <= endTimeInMinutes) {
    // Normal shift (doesn't cross midnight)
    return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
  } else {
    // Night shift (crosses midnight)
    return currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes < endTimeInMinutes;
  }
}

/**
 * Get availability summary for display purposes
 */
export function getAvailabilitySummary(availability: StaffAvailability): string {
  if (!availability.isOnShift) {
    return "Off Shift";
  }
  
  if (!availability.canTakeNewJob) {
    return "At Capacity";
  }
  
  if (availability.currentJobs === 0) {
    return "Available";
  }
  
  if (availability.currentJobs <= 2) {
    return "Lightly Loaded";
  }
  
  if (availability.currentJobs <= 4) {
    return "Moderately Loaded";
  }
  
  return "Heavily Loaded";
}

/**
 * Auto-assign staff based on job details and location
 */
export function autoAssignStaff(
  allStaff: User[],
  allJobs: Job[],
  jobLocation?: string,
  targetDate?: string
): { staffId: string; staffName: string; reason: string } | null {
  // Try to determine preferred location from job address
  let preferredLocation: "Johannesburg" | "Cape Town" | undefined;

  if (jobLocation) {
    const locationLower = jobLocation.toLowerCase();
    if (locationLower.includes('johannesburg') || locationLower.includes('jhb') ||
        locationLower.includes('sandton') || locationLower.includes('roodepoort') ||
        locationLower.includes('randburg') || locationLower.includes('midrand')) {
      preferredLocation = "Johannesburg";
    } else if (locationLower.includes('cape town') || locationLower.includes('milnerton') ||
               locationLower.includes('bellville') || locationLower.includes('parow') ||
               locationLower.includes('wynberg') || locationLower.includes('fish hoek')) {
      preferredLocation = "Cape Town";
    }
  }

  // Debug: Calculate all staff availability for troubleshooting
  const availabilityData = calculateStaffAvailability(allStaff, allJobs, targetDate);
  console.log('Staff availability debug:', {
    totalStaff: allStaff.length,
    staffCount: allStaff.filter(s => s.role === 'staff').length,
    availabilityData: availabilityData.map(a => ({
      name: a.staff.name,
      location: a.staff.location?.city,
      canTakeNewJob: a.canTakeNewJob,
      isOnShift: a.isOnShift,
      currentJobs: a.currentJobs,
      todayJobs: a.todayJobs,
      availabilityScore: a.availabilityScore
    })),
    preferredLocation
  });

  const availableStaff = getNextAvailableStaff(allStaff, allJobs, targetDate, preferredLocation);

  if (!availableStaff) {
    console.log('No available staff found despite having staff members');
    return null;
  }

  // Generate reason for assignment
  const availability = calculateStaffAvailability(allStaff, allJobs, targetDate)
    .find(a => a.staffId === availableStaff.id)!;
    
  let reason = `Auto-assigned to ${availableStaff.name}`;
  
  if (preferredLocation) {
    reason += ` (${preferredLocation} area)`;
  }
  
  const summary = getAvailabilitySummary(availability);
  reason += ` - ${summary}`;
  
  if (availability.todayJobs > 0) {
    reason += ` (${availability.todayJobs} jobs today)`;
  }

  return {
    staffId: availableStaff.id,
    staffName: availableStaff.name,
    reason
  };
}

/**
 * Simple staff assignment fallback when full availability data isn't available
 */
export function getFirstAvailableStaff(
  allStaff: User[],
  preferredLocation?: "Johannesburg" | "Cape Town"
): { staffId: string; staffName: string; reason: string } | null {
  const staffMembers = allStaff.filter(user => user.role === 'staff');

  if (staffMembers.length === 0) {
    return null;
  }

  // Try to find staff in preferred location first
  if (preferredLocation) {
    const locationStaff = staffMembers.filter(staff =>
      staff.location?.city === preferredLocation
    );

    if (locationStaff.length > 0) {
      const randomStaff = locationStaff[Math.floor(Math.random() * locationStaff.length)];
      return {
        staffId: randomStaff.id,
        staffName: randomStaff.name,
        reason: `Assigned to ${randomStaff.name} (${preferredLocation} region)`
      };
    }
  }

  // Fallback to any available staff
  const randomStaff = staffMembers[Math.floor(Math.random() * staffMembers.length)];
  return {
    staffId: randomStaff.id,
    staffName: randomStaff.name,
    reason: `Assigned to ${randomStaff.name} (available staff)`
  };
}
