import React from "react";
import { Job, User } from "@shared/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Target, Send } from "lucide-react";

interface JobListViewProps {
  jobs: Job[];
  staff: User[];
  user: User | null;
  effectiveUser: User | null;
  searchTerm: string;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
  handleJobEdit: (job: Job) => void;
  handleJobPDFDownload: (job: Job) => void;
  handleJobContextMenu: (e: React.MouseEvent, job: Job) => void;
  setSelectedJobForTimeEdit: (job: Job | null) => void;
  setShowJobTimeEditor: (show: boolean) => void;
  setSelectedJobForAssignment: (job: Job | null) => void;
  setShowSmartAssignment: (show: boolean) => void;
  setSelectedJobForSendAgain: (job: Job | null) => void;
  setShowSendAgain: (show: boolean) => void;
}

const JobCard = ({ 
  job, 
  staff, 
  user, 
  effectiveUser, 
  getPriorityColor, 
  getStatusColor, 
  handleJobEdit,
  handleJobPDFDownload,
  handleJobContextMenu,
  setSelectedJobForTimeEdit,
  setShowJobTimeEditor,
  setSelectedJobForAssignment,
  setShowSmartAssignment,
  setSelectedJobForSendAgain,
  setShowSendAgain
}: {
  job: Job;
  staff: User[];
  user: User | null;
  effectiveUser: User | null;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
  handleJobEdit: (job: Job) => void;
  handleJobPDFDownload: (job: Job) => void;
  handleJobContextMenu: (e: React.MouseEvent, job: Job) => void;
  setSelectedJobForTimeEdit: (job: Job | null) => void;
  setShowJobTimeEditor: (show: boolean) => void;
  setSelectedJobForAssignment: (job: Job | null) => void;
  setShowSmartAssignment: (show: boolean) => void;
  setSelectedJobForSendAgain: (job: Job | null) => void;
  setShowSendAgain: (show: boolean) => void;
}) => (
  <div
    className="border rounded-lg p-4 space-y-2 cursor-pointer hover:bg-gray-50 transition-colors"
    onDoubleClick={() => {
      if (user?.role === "admin") {
        setSelectedJobForTimeEdit(job);
        setShowJobTimeEditor(true);
      } else {
        handleJobEdit(job);
      }
    }}
    onContextMenu={(e) => handleJobContextMenu(e, job)}
    title={
      user?.role === "admin" ||
      user?.role === "supervisor"
        ? "Double-click to edit | Right-click for options"
        : "Double-click to edit job"
    }
  >
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <h3 className="font-medium" title={job.title}>
          {job.title.length > 12
            ? `${job.title.substring(0, 12)}..`
            : job.title}
        </h3>
        <p className="text-sm text-gray-600">
          {job.description}
        </p>
        <div className="text-xs text-gray-500 space-y-1">
          {job.claimNo && <p>Claim: {job.claimNo}</p>}
          {job.insuredName && (
            <p>Client: {job.insuredName}</p>
          )}
          {job.riskAddress && (
            <p>Address: {job.riskAddress}</p>
          )}
          {job.excess && (
            <p className="text-green-600">
              Excess: {job.excess}
            </p>
          )}
          {job.duration && (
            <p className="text-blue-600">
              Duration: {Math.round(job.duration / 60 * 100) / 100}h
            </p>
          )}
        </div>
      </div>
      <div className="flex space-x-2">
        <Badge variant={getPriorityColor(job.priority)}>
          {job.priority}
        </Badge>
        <Badge
          className={getStatusColor(job.status)}
          variant="secondary"
        >
          {job.status.replace("_", " ")}
        </Badge>
      </div>
    </div>
    <div className="flex justify-between items-center text-sm text-gray-500">
      <span>
        Assigned to:{" "}
        {staff.find((s) => s.id === job.assignedTo)
          ?.name || "Unassigned"}
      </span>
      <div className="flex items-center space-x-2">
        <span>
          Created: {new Date(job.createdAt).toLocaleDateString()}
        </span>
        {job.dueDate && (
          <span className="text-blue-600">
            Due: {new Date(job.dueDate).toLocaleDateString()} {new Date(job.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        <div className="flex space-x-1">
          {job.status === "completed" && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleJobPDFDownload(job);
              }}
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              <FileText className="h-3 w-3 mr-1" />
              PDF
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleJobEdit(job);
            }}
          >
            {effectiveUser?.role === 'staff' ? 'View' : 'Edit'}
          </Button>
          {effectiveUser?.role !== 'staff' && !job.assignedTo && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedJobForAssignment(job);
                setShowSmartAssignment(true);
              }}
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              <Target className="h-3 w-3 mr-1" />
              Smart Assign
            </Button>
          )}
          {effectiveUser?.role !== 'staff' && job.assignedTo && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedJobForSendAgain(job);
                setShowSendAgain(true);
              }}
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <Send className="h-3 w-3 mr-1" />
              Send Again
            </Button>
          )}
        </div>
      </div>
    </div>
  </div>
);

export function JobListView({
  jobs,
  staff,
  user,
  effectiveUser,
  searchTerm,
  getPriorityColor,
  getStatusColor,
  handleJobEdit,
  handleJobPDFDownload,
  handleJobContextMenu,
  setSelectedJobForTimeEdit,
  setShowJobTimeEditor,
  setSelectedJobForAssignment,
  setShowSmartAssignment,
  setSelectedJobForSendAgain,
  setShowSendAgain
}: JobListViewProps) {
  const currentJobs = jobs.filter(job => job.status !== 'completed');
  const completedJobs = jobs.filter(job => job.status === 'completed');

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {searchTerm
          ? `No jobs found matching "${searchTerm}"`
          : "No jobs found. Create your first job to get started."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Jobs Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Current Jobs</h3>
          <Badge variant="outline">
            {currentJobs.length} active
          </Badge>
        </div>
        <div className="space-y-4">
          {currentJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No current jobs. All jobs are completed.
            </div>
          ) : (
            currentJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                staff={staff}
                user={user}
                effectiveUser={effectiveUser}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
                handleJobEdit={handleJobEdit}
                handleJobPDFDownload={handleJobPDFDownload}
                handleJobContextMenu={handleJobContextMenu}
                setSelectedJobForTimeEdit={setSelectedJobForTimeEdit}
                setShowJobTimeEditor={setShowJobTimeEditor}
                setSelectedJobForAssignment={setSelectedJobForAssignment}
                setShowSmartAssignment={setShowSmartAssignment}
                setSelectedJobForSendAgain={setSelectedJobForSendAgain}
                setShowSendAgain={setShowSendAgain}
              />
            ))
          )}
        </div>
      </div>

      {/* Completed Jobs Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Completed Jobs</h3>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {completedJobs.length} completed
          </Badge>
        </div>
        <div className="space-y-4">
          {completedJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No completed jobs yet.
            </div>
          ) : (
            completedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                staff={staff}
                user={user}
                effectiveUser={effectiveUser}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
                handleJobEdit={handleJobEdit}
                handleJobPDFDownload={handleJobPDFDownload}
                handleJobContextMenu={handleJobContextMenu}
                setSelectedJobForTimeEdit={setSelectedJobForTimeEdit}
                setShowJobTimeEditor={setShowJobTimeEditor}
                setSelectedJobForAssignment={setSelectedJobForAssignment}
                setShowSmartAssignment={setShowSmartAssignment}
                setSelectedJobForSendAgain={setSelectedJobForSendAgain}
                setShowSendAgain={setShowSendAgain}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
