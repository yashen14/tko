import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Using simple div instead of Avatar component
import { Progress } from "@/components/ui/progress";
import { 
  MapPin, 
  Clock, 
  User, 
  CheckCircle, 
  AlertTriangle, 
  Users,
  Calendar,
  Briefcase,
  Target,
  Star,
  TrendingUp,
  X
} from "lucide-react";
import { Job, User as UserType } from "@shared/types";

interface SmartJobAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  availableStaff: UserType[];
  allJobs: Job[];
  onAssignJob?: (jobId: string, staffId: string) => void;
}

interface StaffRecommendation {
  staff: UserType;
  score: number;
  factors: {
    locationMatch: number;
    availability: number;
    workload: number;
    experience: number;
    recentPerformance: number;
  };
  warnings: string[];
  activeJobs: number;
  completionRate: number;
  distance?: string;
  nextAvailable?: string;
}

export function SmartJobAssignmentModal({
  open,
  onOpenChange,
  job,
  availableStaff,
  allJobs,
  onAssignJob
}: SmartJobAssignmentModalProps) {
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  const recommendations = useMemo(() => {
    if (!job) return [];

    const staffRecommendations: StaffRecommendation[] = availableStaff.map(staff => {
      const staffJobs = allJobs.filter(j => j.assignedTo === staff.id);
      const activeJobs = staffJobs.filter(j => j.status !== "completed").length;
      const completedJobs = staffJobs.filter(j => j.status === "completed").length;
      const completionRate = staffJobs.length > 0 ? (completedJobs / staffJobs.length) * 100 : 0;

      // Calculate factors (each out of 100)
      const factors = {
        locationMatch: calculateLocationMatch(job, staff),
        availability: calculateAvailability(staff, activeJobs),
        workload: calculateWorkloadScore(activeJobs),
        experience: calculateExperienceScore(staff, staffJobs),
        recentPerformance: Math.min(completionRate, 100)
      };

      // Calculate weighted score
      const score = (
        factors.locationMatch * 0.3 +
        factors.availability * 0.25 +
        factors.workload * 0.2 +
        factors.experience * 0.15 +
        factors.recentPerformance * 0.1
      );

      // Generate warnings
      const warnings: string[] = [];
      if (factors.locationMatch < 50) {
        warnings.push("Different region - may require travel");
      }
      if (activeJobs > 5) {
        warnings.push("High workload - may cause delays");
      }
      if (staff.schedule?.workingLateShift && new Date().getHours() < 12) {
        warnings.push("Works late shift - may not be immediately available");
      }

      return {
        staff,
        score,
        factors,
        warnings,
        activeJobs,
        completionRate,
        distance: calculateDistance(job, staff),
        nextAvailable: calculateNextAvailable(staff, activeJobs)
      };
    });

    // Sort by score (highest first)
    return staffRecommendations.sort((a, b) => b.score - a.score);
  }, [job, availableStaff, allJobs]);

  const handleAssign = async () => {
    if (!job || !selectedStaff) return;

    setAssigning(true);
    try {
      await onAssignJob?.(job.id, selectedStaff);
      onOpenChange(false);
    } finally {
      setAssigning(false);
    }
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Smart Job Assignment</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Job Info */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">Job Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium">{job.title}</h4>
                  <p className="text-sm text-gray-600">{job.insuredName || job.InsuredName}</p>
                </div>
                <div>
                  <div className="flex items-center space-x-1 text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>{job.address}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-1 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(job.scheduledDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff Recommendations */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Recommended Staff ({recommendations.length})</span>
            </h3>

            {recommendations.map((rec, index) => (
              <Card 
                key={rec.staff.id}
                className={`cursor-pointer transition-all ${
                  selectedStaff === rec.staff.id 
                    ? "ring-2 ring-blue-500 bg-blue-50" 
                    : "hover:bg-gray-50"
                } ${index === 0 ? "border-green-200 bg-green-50" : ""}`}
                onClick={() => setSelectedStaff(rec.staff.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {rec.staff.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{rec.staff.name}</h4>
                          {index === 0 && (
                            <Badge className="bg-green-100 text-green-800">
                              <Star className="h-3 w-3 mr-1" />
                              Best Match
                            </Badge>
                          )}
                          <Badge variant="outline">{rec.staff.role}</Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{rec.staff.location?.city || "Unknown"}</span>
                            {rec.distance && <span>({rec.distance})</span>}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Briefcase className="h-4 w-4" />
                            <span>{rec.activeJobs} active jobs</span>
                          </div>
                        </div>
                        
                        {/* Score Breakdown */}
                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Match Score</span>
                            <span className="text-sm font-bold">{rec.score.toFixed(0)}%</span>
                          </div>
                          <Progress value={rec.score} className="h-2" />
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                              <span>Location:</span>
                              <span className={
                                rec.factors.locationMatch > 70 ? "text-green-600" :
                                rec.factors.locationMatch > 40 ? "text-yellow-600" : "text-red-600"
                              }>
                                {rec.factors.locationMatch.toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Availability:</span>
                              <span className={
                                rec.factors.availability > 70 ? "text-green-600" :
                                rec.factors.availability > 40 ? "text-yellow-600" : "text-red-600"
                              }>
                                {rec.factors.availability.toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Workload:</span>
                              <span className={
                                rec.factors.workload > 70 ? "text-green-600" :
                                rec.factors.workload > 40 ? "text-yellow-600" : "text-red-600"
                              }>
                                {rec.factors.workload.toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Performance:</span>
                              <span className={
                                rec.completionRate > 80 ? "text-green-600" :
                                rec.completionRate > 60 ? "text-yellow-600" : "text-red-600"
                              }>
                                {rec.completionRate.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Warnings */}
                        {rec.warnings.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {rec.warnings.map((warning, idx) => (
                              <div key={idx} className="flex items-center space-x-1 text-xs text-amber-600">
                                <AlertTriangle className="h-3 w-3" />
                                <span>{warning}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Next Available */}
                        {rec.nextAvailable && (
                          <div className="mt-2 flex items-center space-x-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>Next available: {rec.nextAvailable}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {rec.score.toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={assigning}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedStaff || assigning}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            {assigning ? "Assigning..." : "Assign Job"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper functions
function calculateLocationMatch(job: Job, staff: UserType): number {
  if (!job.address || !staff.location?.city) return 50;
  
  // Simple city matching - in production, use proper geo-distance calculation
  const jobCity = extractCity(job.address);
  const staffCity = staff.location.city;
  
  if (jobCity.toLowerCase().includes(staffCity.toLowerCase()) || 
      staffCity.toLowerCase().includes(jobCity.toLowerCase())) {
    return 95;
  }
  
  // Check for common South African city proximity
  const cityGroups = [
    ["johannesburg", "sandton", "randburg", "roodepoort", "soweto"],
    ["cape town", "paarden eiland", "wynberg", "bellville"],
    ["durban", "pinetown", "westville", "chatsworth"],
    ["pretoria", "centurion", "hatfield", "brooklyn"]
  ];
  
  for (const group of cityGroups) {
    if (group.some(city => jobCity.toLowerCase().includes(city)) &&
        group.some(city => staffCity.toLowerCase().includes(city))) {
      return 80;
    }
  }
  
  return 30; // Different regions
}

function calculateAvailability(staff: UserType, activeJobs: number): number {
  const currentHour = new Date().getHours();
  let score = 100;
  
  // Check if currently in working hours
  if (staff.schedule) {
    const startHour = parseInt(staff.schedule.shiftStartTime.split(':')[0]);
    const endHour = parseInt(staff.schedule.shiftEndTime.split(':')[0]);
    
    if (currentHour < startHour || currentHour > endHour) {
      score -= 30; // Outside working hours
    }
  }
  
  // Reduce score based on active jobs
  score -= Math.min(activeJobs * 10, 50);
  
  return Math.max(score, 0);
}

function calculateWorkloadScore(activeJobs: number): number {
  if (activeJobs === 0) return 100;
  if (activeJobs <= 2) return 90;
  if (activeJobs <= 4) return 70;
  if (activeJobs <= 6) return 50;
  return 20;
}

function calculateExperienceScore(staff: UserType, jobs: Job[]): number {
  const totalJobs = jobs.length;
  if (totalJobs === 0) return 40; // New staff member
  if (totalJobs < 5) return 60;
  if (totalJobs < 20) return 80;
  return 95;
}

function extractCity(address: string): string {
  // Extract city from address - simple implementation
  const parts = address.split(',');
  return parts[parts.length - 2]?.trim() || parts[0]?.trim() || address;
}

function calculateDistance(job: Job, staff: UserType): string {
  // Placeholder - in production, use proper geo-distance calculation
  if (!job.address || !staff.location?.city) return "";
  
  const jobCity = extractCity(job.address);
  const staffCity = staff.location.city;
  
  if (jobCity.toLowerCase().includes(staffCity.toLowerCase()) || 
      staffCity.toLowerCase().includes(jobCity.toLowerCase())) {
    return "< 10km";
  }
  
  return "~25km"; // Rough estimate
}

function calculateNextAvailable(staff: UserType, activeJobs: number): string {
  if (activeJobs === 0) return "Available now";
  if (activeJobs <= 2) return "Within 2 hours";
  if (activeJobs <= 4) return "Tomorrow morning";
  return "Next week";
}
