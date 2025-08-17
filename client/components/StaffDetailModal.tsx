import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Calendar, 
  Edit, 
  Save, 
  X, 
  Trash2, 
  Key, 
  Briefcase,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Users,
  Settings
} from "lucide-react";
import { User as UserType, Job } from "@shared/types";

interface StaffDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: UserType | null;
  jobs: Job[];
  onStaffUpdate?: (staff: UserType) => void;
  onStaffDelete?: (staffId: string) => void;
  onJobRemove?: (jobId: string, staffId: string) => void;
}

export function StaffDetailModal({
  open,
  onOpenChange,
  staff,
  jobs,
  onStaffUpdate,
  onStaffDelete,
  onJobRemove
}: StaffDetailModalProps) {
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editedStaff, setEditedStaff] = useState<UserType | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChangeMode, setPasswordChangeMode] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const staffJobs = jobs.filter(job => job.assignedTo === staff?.id);
  const completedJobs = staffJobs.filter(job => job.status === "completed");
  const activeJobs = staffJobs.filter(job => job.status !== "completed");

  useEffect(() => {
    if (staff) {
      setEditedStaff({ ...staff });
    }
    setEditMode(false);
    setPasswordChangeMode(false);
    setNewPassword("");
    setConfirmPassword("");

    if (open) {
      fetchUsers();
    }
  }, [staff, open]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch("/api/auth/users", {
        headers,
      });

      if (response.ok) {
        const userData = await response.json();
        setAllUsers(userData);
      }
    } catch (error) {
      console.warn("Could not fetch users:", error);
    }
  };

  const handleSave = async () => {
    if (!editedStaff) return;

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/auth/users/${editedStaff.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(editedStaff),
      });

      if (response.ok) {
        const updatedStaff = await response.json();
        onStaffUpdate?.(updatedStaff);
        setEditMode(false);
      } else {
        alert("Failed to update staff member");
      }
    } catch (error) {
      console.error("Error updating staff:", error);
      alert("Error updating staff member");
    }
  };

  const handlePasswordChange = async () => {
    if (!editedStaff || !newPassword || newPassword !== confirmPassword) {
      alert("Passwords don't match or are empty");
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/auth/users/${editedStaff.id}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (response.ok) {
        setPasswordChangeMode(false);
        setNewPassword("");
        setConfirmPassword("");
        alert("Password updated successfully");
      } else {
        alert("Failed to update password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      alert("Error updating password");
    }
  };

  const handleDelete = async () => {
    if (!staff) return;

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/auth/users/${staff.id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        onStaffDelete?.(staff.id);
        onOpenChange(false);
      } else {
        alert("Failed to delete staff member");
      }
    } catch (error) {
      console.error("Error deleting staff:", error);
      alert("Error deleting staff member");
    }
  };

  const handleJobRemoval = async (jobId: string) => {
    if (!staff) return;
    
    onJobRemove?.(jobId, staff.id);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "apollo": return "bg-purple-100 text-purple-800 border-purple-300";
      case "supervisor": return "bg-orange-100 text-orange-800 border-orange-300";
      case "admin": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (!staff) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                staff.role === "apollo" ? "bg-purple-100" :
                staff.role === "supervisor" ? "bg-orange-100" :
                staff.role === "admin" ? "bg-red-100" :
                "bg-blue-100"
              }`}>
                <User className={`h-5 w-5 ${
                  staff.role === "apollo" ? "text-purple-600" :
                  staff.role === "supervisor" ? "text-orange-600" :
                  staff.role === "admin" ? "text-red-600" :
                  "text-blue-600"
                }`} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{staff.name}</h2>
                <Badge className={getRoleColor(staff.role)}>{staff.role}</Badge>
              </div>
            </div>
            <div className="flex space-x-2">
              {!editMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              {editMode && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditMode(false);
                      setEditedStaff({ ...staff });
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="jobs">Jobs ({staffJobs.length})</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Personal Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      {editMode ? (
                        <Input
                          id="name"
                          value={editedStaff?.name || ""}
                          onChange={(e) => setEditedStaff(prev => prev ? { ...prev, name: e.target.value } : null)}
                        />
                      ) : (
                        <p className="p-2 border rounded bg-gray-50">{staff.name}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="username">Username</Label>
                      {editMode ? (
                        <Input
                          id="username"
                          value={editedStaff?.username || ""}
                          onChange={(e) => setEditedStaff(prev => prev ? { ...prev, username: e.target.value } : null)}
                        />
                      ) : (
                        <p className="p-2 border rounded bg-gray-50">@{staff.username}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      {editMode ? (
                        <Input
                          id="email"
                          type="email"
                          value={editedStaff?.email || ""}
                          onChange={(e) => setEditedStaff(prev => prev ? { ...prev, email: e.target.value } : null)}
                        />
                      ) : (
                        <p className="p-2 border rounded bg-gray-50">{staff.email}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      {editMode ? (
                        <Select
                          value={editedStaff?.role || ""}
                          onValueChange={(value) => setEditedStaff(prev => prev ? { ...prev, role: value as any } : null)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                            <SelectItem value="apollo">Apollo</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-2">
                          <Badge className={getRoleColor(staff.role)}>{staff.role}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {staff.location && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>Location</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        {editMode ? (
                          <Input
                            id="city"
                            value={editedStaff?.location?.city || ""}
                            onChange={(e) => setEditedStaff(prev => prev ? { 
                              ...prev, 
                              location: { ...prev.location!, city: e.target.value }
                            } : null)}
                          />
                        ) : (
                          <p className="p-2 border rounded bg-gray-50">{staff.location.city}</p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="address">Address</Label>
                        {editMode ? (
                          <Textarea
                            id="address"
                            value={editedStaff?.location?.address || ""}
                            onChange={(e) => setEditedStaff(prev => prev ? { 
                              ...prev, 
                              location: { ...prev.location!, address: e.target.value }
                            } : null)}
                          />
                        ) : (
                          <p className="p-2 border rounded bg-gray-50">{staff.location.address}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Briefcase className="h-5 w-5" />
                    <span>Work Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{staffJobs.length}</p>
                      <p className="text-sm text-gray-600">Total Jobs</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{completedJobs.length}</p>
                      <p className="text-sm text-gray-600">Completed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">{activeJobs.length}</p>
                      <p className="text-sm text-gray-600">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="jobs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  {staffJobs.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No jobs assigned</p>
                  ) : (
                    <div className="space-y-3">
                      {staffJobs.map((job) => (
                        <div key={job.id} className="border rounded-lg p-3 flex justify-between items-center">
                          <div className="flex-1">
                            <h4 className="font-medium">{job.title}</h4>
                            <p className="text-sm text-gray-600">{job.insuredName || job.InsuredName}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(job.scheduledDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                              Created by: {allUsers.find(u => u.id === job.assignedBy)?.name || 'Unknown'} • {new Date(job.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // TODO: Open job details
                                console.log("View job:", job.id);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Job from Staff</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove the job from {staff.name}'s assignment and move it to the discarded jobs list. 
                                    The job can be reassigned later.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleJobRemoval(job.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Remove Job
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Work Schedule</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {staff.schedule ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Shift Start</Label>
                          <p className="p-2 border rounded bg-gray-50">{staff.schedule.shiftStartTime}</p>
                        </div>
                        <div>
                          <Label>Shift End</Label>
                          <p className="p-2 border rounded bg-gray-50">{staff.schedule.shiftEndTime}</p>
                        </div>
                        <div>
                          <Label>Week Type</Label>
                          <p className="p-2 border rounded bg-gray-50">{staff.schedule.weekType}</p>
                        </div>
                        <div>
                          <Label>Late Shift</Label>
                          <p className="p-2 border rounded bg-gray-50">
                            {staff.schedule.workingLateShift ? "Yes" : "No"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No schedule information available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Key className="h-5 w-5" />
                    <span>Security Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="font-medium">Password</h4>
                        <p className="text-sm text-gray-600">Change the user's password</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setPasswordChangeMode(!passwordChangeMode)}
                      >
                        {passwordChangeMode ? "Cancel" : "Change Password"}
                      </Button>
                    </div>
                    
                    {passwordChangeMode && (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="new-password">New Password</Label>
                          <div className="relative">
                            <Input
                              id="new-password"
                              type={showPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="confirm-password">Confirm Password</Label>
                          <Input
                            id="confirm-password"
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                          />
                        </div>
                        <Button onClick={handlePasswordChange} className="w-full">
                          Update Password
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="border rounded-lg p-4 border-red-200 bg-red-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-red-900">Danger Zone</h4>
                        <p className="text-sm text-red-700">Permanently delete this staff member</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Staff
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to permanently delete {staff.name}? This action cannot be undone.
                              All associated data will be removed from the system.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDelete}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Staff Member
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
