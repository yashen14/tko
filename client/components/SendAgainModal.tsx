import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  RefreshCw, 
  Users, 
  Wrench, 
  AlertCircle,
  Send,
  X
} from "lucide-react";
import { Job } from "@shared/types";

interface SendAgainModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onSendAgain?: (jobId: string, reason: string, additionalNotes?: string, assignTo?: string) => void;
  availableStaff?: Array<{ id: string; name: string; location?: { city: string } }>;
}

const SEND_AGAIN_REASONS = [
  {
    id: "comeback",
    label: "Comeback",
    description: "Follow-up visit required",
    icon: RefreshCw,
    color: "blue"
  },
  {
    id: "reassist",
    label: "Re-assist",
    description: "Additional assistance needed",
    icon: Users,
    color: "orange"
  },
  {
    id: "new-install",
    label: "New Install",
    description: "Fresh installation required",
    icon: Wrench,
    color: "green"
  },
  {
    id: "issue-found",
    label: "Issue Found",
    description: "Problem discovered during work",
    icon: AlertCircle,
    color: "red"
  }
];

export function SendAgainModal({
  open,
  onOpenChange,
  job,
  onSendAgain,
  availableStaff = []
}: SendAgainModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [assignTo, setAssignTo] = useState<string>("keep-current");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!job || !selectedReason) return;

    setSending(true);
    try {
      // Convert "keep-current" back to empty string for backend compatibility
      const finalAssignTo = assignTo === "keep-current" ? "" : assignTo;
      await onSendAgain?.(job.id, selectedReason, additionalNotes, finalAssignTo);
      onOpenChange(false);
      setSelectedReason("");
      setAdditionalNotes("");
      setAssignTo("keep-current");
    } finally {
      setSending(false);
    }
  };

  const selectedReasonData = SEND_AGAIN_REASONS.find(r => r.id === selectedReason);

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Send className="h-5 w-5" />
            <span>Send Job Again</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-120px)] overflow-y-auto">
          <div className="space-y-4 pr-4">
          {/* Job Info */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium">{job.title}</h4>
              <p className="text-sm text-gray-600">{job.insuredName || job.InsuredName}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="outline">{job.claimNo || job.ClaimNo}</Badge>
                <Badge variant="secondary">{job.status}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Reason Selection */}
          <div>
            <Label className="text-base font-medium">Select Reason</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {SEND_AGAIN_REASONS.map((reason) => {
                const Icon = reason.icon;
                const isSelected = selectedReason === reason.id;
                return (
                  <Card
                    key={reason.id}
                    className={`cursor-pointer transition-all ${
                      isSelected 
                        ? `ring-2 ring-${reason.color}-500 bg-${reason.color}-50` 
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedReason(reason.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex flex-col items-center text-center space-y-1">
                        <Icon className={`h-6 w-6 ${
                          reason.color === "blue" ? "text-blue-600" :
                          reason.color === "orange" ? "text-orange-600" :
                          reason.color === "green" ? "text-green-600" :
                          "text-red-600"
                        }`} />
                        <span className="text-sm font-medium">{reason.label}</span>
                        <span className="text-xs text-gray-500">{reason.description}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Assignment Selection */}
          {availableStaff.length > 0 && (
            <div>
              <Label htmlFor="assign-to">Assign To (Optional)</Label>
              <Select value={assignTo} onValueChange={setAssignTo}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Keep current assignment or reassign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keep-current">Keep current assignment</SelectItem>
                  {availableStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} {staff.location && `(${staff.location.city})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional information about why this job is being sent again..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Selected Reason Display */}
          {selectedReasonData && (
            <Card className={`bg-${selectedReasonData.color}-50 border-${selectedReasonData.color}-200`}>
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <selectedReasonData.icon className={`h-4 w-4 text-${selectedReasonData.color}-600`} />
                  <span className={`text-sm font-medium text-${selectedReasonData.color}-800`}>
                    Job will be sent as: {selectedReasonData.label}
                  </span>
                </div>
                <p className={`text-xs text-${selectedReasonData.color}-700 mt-1`}>
                  {selectedReasonData.description}
                </p>
              </CardContent>
            </Card>
          )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!selectedReason || sending}
            className={
              selectedReasonData 
                ? selectedReasonData.color === "blue" ? "bg-blue-600 hover:bg-blue-700" :
                  selectedReasonData.color === "orange" ? "bg-orange-600 hover:bg-orange-700" :
                  selectedReasonData.color === "green" ? "bg-green-600 hover:bg-green-700" :
                  "bg-red-600 hover:bg-red-700"
                : ""
            }
          >
            <Send className="h-4 w-4 mr-1" />
            {sending ? "Sending..." : "Send Again"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
