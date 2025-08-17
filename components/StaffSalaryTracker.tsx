import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  Calendar,
  TrendingUp,
  FileText,
  Download,
  Users,
  AlertCircle,
  Edit,
  Plus,
  Trash2,
  Settings,
} from "lucide-react";
import { Job, User } from "@shared/types";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

interface SalaryRecord {
  jobId: string;
  jobTitle: string;
  jobCategory: string;
  pricingType: "call-out" | "repair" | "replacement";
  amount: number;
  date: string;
  status: "completed" | "pending";
  isAssisting: boolean;
}

interface StaffSalaryData {
  staffId: string;
  staffName: string;
  totalEarnings: number;
  monthlyEarnings: number;
  perJobEarnings: number;
  jobsCompleted: number;
  jobsAssisting: number;
  records: SalaryRecord[];
  salaryConfig: User['salary'];
}

interface StaffSalaryTrackerProps {
  jobs: Job[];
  staff: User[];
  currentUser: User;
}

const DEFAULT_PER_JOB_RATES = {
  "Geyser Assessment": 120,
  "Geyser Replacement": 250,
  "Leak Detection": 200,
  "Drain Blockage": 180,
  "Camera Inspection": 150,
  "Toilet/Shower": 200,
  "Other": 150,
  "call-out": 120,
  "repair": 200,
  "replacement": 250,
};

export function StaffSalaryTracker({
  jobs,
  staff,
  currentUser,
}: StaffSalaryTrackerProps) {
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM"),
  );
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [salaryData, setSalaryData] = useState<Record<string, StaffSalaryData>>({});
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string>("");
  const [salaryForm, setSalaryForm] = useState({
    type: "monthly" as "monthly" | "per_job" | "both",
    monthlyAmount: 0,
    perJobRates: DEFAULT_PER_JOB_RATES,
    currency: "ZAR",
  });
  const [allSalaries, setAllSalaries] = useState<any[]>([]);

  // Only show to admins
  if (currentUser.role !== "admin") {
    return null;
  }

  useEffect(() => {
    calculateSalaryData();
    fetchAllSalaries();
  }, [jobs, selectedMonth, staff]);

  const fetchAllSalaries = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/admin/salaries", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        const salaries = await response.json();
        setAllSalaries(salaries);
      }
    } catch (error) {
      console.error("Error fetching salaries:", error);
    }
  };

  const calculateSalaryData = () => {
    const monthStart = startOfMonth(new Date(selectedMonth + "-01"));
    const monthEnd = endOfMonth(monthStart);

    const staffSalaries: Record<string, StaffSalaryData> = {};

    // Initialize staff data - include apollos for admins
    const eligibleStaff = staff.filter(s => 
      s.role === "staff" || s.role === "supervisor" || s.role === "apollo"
    );

    eligibleStaff.forEach((staffMember) => {
      const salaryConfig = allSalaries.find(s => s.userId === staffMember.id)?.salary || staffMember.salary;
      
      staffSalaries[staffMember.id] = {
        staffId: staffMember.id,
        staffName: staffMember.name,
        totalEarnings: 0,
        monthlyEarnings: 0,
        perJobEarnings: 0,
        jobsCompleted: 0,
        jobsAssisting: 0,
        records: [],
        salaryConfig: salaryConfig,
      };

      // Add monthly salary if configured
      if (salaryConfig?.type === "monthly" || salaryConfig?.type === "both") {
        staffSalaries[staffMember.id].monthlyEarnings = salaryConfig.monthlyAmount || 0;
        staffSalaries[staffMember.id].totalEarnings += salaryConfig.monthlyAmount || 0;
      }
    });

    // Process jobs for the selected month
    jobs.forEach((job) => {
      if (!job.dueDate || !job.assignedTo) return;

      const jobDate = new Date(job.dueDate);
      if (!isWithinInterval(jobDate, { start: monthStart, end: monthEnd }))
        return;

      const staffMember = staffSalaries[job.assignedTo];
      if (!staffMember) return;

      // Calculate per-job earnings if applicable
      if (staffMember.salaryConfig?.type === "per_job" || staffMember.salaryConfig?.type === "both") {
        let amount = 0;
        let pricingType: "call-out" | "repair" | "replacement" = "call-out";

        const rates = staffMember.salaryConfig.perJobRates || DEFAULT_PER_JOB_RATES;
        
        // Determine pricing based on job category
        if (job.category && rates[job.category]) {
          amount = rates[job.category];
          pricingType = job.category === "Geyser Replacement" ? "replacement" : 
                      (job.category === "Geyser Assessment" ? "call-out" : "repair");
        } else {
          // Fallback to general pricing
          if (job.category === "Geyser Replacement") {
            pricingType = "replacement";
            amount = rates.replacement || DEFAULT_PER_JOB_RATES.replacement;
          } else if (job.status === "completed") {
            pricingType = job.category === "Geyser Assessment" ? "call-out" : "repair";
            amount = rates[pricingType] || DEFAULT_PER_JOB_RATES[pricingType];
          } else {
            amount = rates["call-out"] || DEFAULT_PER_JOB_RATES["call-out"];
          }
        }

        const record: SalaryRecord = {
          jobId: job.id,
          jobTitle: job.title,
          jobCategory: job.category || "Not specified",
          pricingType,
          amount,
          date: job.dueDate,
          status: job.status as "completed" | "pending",
          isAssisting: job.isAssisting || false,
        };

        staffMember.records.push(record);

        if (job.status === "completed" && !job.isAssisting) {
          staffMember.perJobEarnings += amount;
          staffMember.totalEarnings += amount;
          staffMember.jobsCompleted++;
        }
      } else {
        // Still track jobs for non-per-job salary staff
        if (job.status === "completed") {
          staffMember.jobsCompleted++;
        }
      }

      if (job.isAssisting) {
        staffMember.jobsAssisting++;
      }
    });

    setSalaryData(staffSalaries);
  };

  const handleSaveSalary = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/users/${editingStaffId}/salary`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(salaryForm),
      });

      if (response.ok) {
        await fetchAllSalaries();
        setShowSalaryModal(false);
        setEditingStaffId("");
        calculateSalaryData();
      } else {
        alert("Failed to save salary configuration");
      }
    } catch (error) {
      console.error("Error saving salary:", error);
      alert("Error saving salary configuration");
    }
  };

  const handleEditSalary = (staffId: string) => {
    const existingSalary = allSalaries.find(s => s.userId === staffId)?.salary;
    if (existingSalary) {
      setSalaryForm({
        type: existingSalary.type,
        monthlyAmount: existingSalary.monthlyAmount || 0,
        perJobRates: existingSalary.perJobRates || DEFAULT_PER_JOB_RATES,
        currency: existingSalary.currency || "ZAR",
      });
    } else {
      setSalaryForm({
        type: "monthly",
        monthlyAmount: 0,
        perJobRates: DEFAULT_PER_JOB_RATES,
        currency: "ZAR",
      });
    }
    setEditingStaffId(staffId);
    setShowSalaryModal(true);
  };

  const handleDeleteSalary = async (staffId: string) => {
    if (!confirm("Are you sure you want to delete this salary configuration?")) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/users/${staffId}/salary`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        await fetchAllSalaries();
        calculateSalaryData();
      } else {
        alert("Failed to delete salary configuration");
      }
    } catch (error) {
      console.error("Error deleting salary:", error);
      alert("Error deleting salary configuration");
    }
  };

  const generateCSV = () => {
    const selectedStaffData = salaryData[selectedStaff];
    if (!selectedStaffData) return;

    const headers = [
      "Date",
      "Job Title",
      "Category",
      "Pricing Type",
      "Amount (R)",
      "Status",
      "Is Assisting",
    ];

    const csvContent = [
      headers.join(","),
      `Monthly Salary,${selectedStaffData.monthlyEarnings},,,,,`,
      `Per-Job Earnings,${selectedStaffData.perJobEarnings},,,,,`,
      `Total Earnings,${selectedStaffData.totalEarnings},,,,,`,
      "",
      ...selectedStaffData.records.map((record) =>
        [
          format(new Date(record.date), "yyyy-MM-dd"),
          `"${record.jobTitle}"`,
          `"${record.jobCategory}"`,
          record.pricingType,
          record.amount,
          record.status,
          record.isAssisting ? "Yes" : "No",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedStaffData.staffName}_salary_${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const eligibleStaff = staff.filter(s => 
    s.role === "staff" || s.role === "supervisor" || s.role === "apollo"
  );

  const selectedStaffData = salaryData[selectedStaff];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Enhanced Staff Salary Tracker
            <Badge variant="outline" className="ml-2">
              Admin Only
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const value = format(date, "yyyy-MM");
                    const label = format(date, "MMMM yyyy");
                    return (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Staff</label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose staff member" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleStaff.map((staffMember) => {
                    const hasSalaryConfig = allSalaries.some(s => s.userId === staffMember.id && s.salary);
                    return (
                      <SelectItem key={staffMember.id} value={staffMember.id}>
                        <div className="flex items-center">
                          <span>{staffMember.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {staffMember.role}
                          </Badge>
                          {hasSalaryConfig && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              Configured
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button
                onClick={generateCSV}
                disabled={!selectedStaffData}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Salary Config</label>
              <Button
                onClick={() => selectedStaff && handleEditSalary(selectedStaff)}
                disabled={!selectedStaff}
                variant="outline"
                className="w-full"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Configuration Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Salary Configurations</span>
            <Dialog open={showSalaryModal} onOpenChange={setShowSalaryModal}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Salary
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    Configure Salary for {editingStaffId ? staff.find(s => s.id === editingStaffId)?.name : "Staff"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Salary Type</Label>
                    <Select value={salaryForm.type} onValueChange={(value: any) => setSalaryForm(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly Salary Only</SelectItem>
                        <SelectItem value="per_job">Per Job Only</SelectItem>
                        <SelectItem value="both">Monthly + Per Job</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(salaryForm.type === "monthly" || salaryForm.type === "both") && (
                    <div>
                      <Label>Monthly Amount (ZAR)</Label>
                      <Input
                        type="number"
                        value={salaryForm.monthlyAmount}
                        onChange={(e) => setSalaryForm(prev => ({ ...prev, monthlyAmount: Number(e.target.value) }))}
                        placeholder="Enter monthly salary amount"
                      />
                    </div>
                  )}

                  {(salaryForm.type === "per_job" || salaryForm.type === "both") && (
                    <div>
                      <Label>Per Job Rates (ZAR)</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(salaryForm.perJobRates).map(([category, rate]) => (
                          <div key={category}>
                            <Label className="text-xs">{category}</Label>
                            <Input
                              type="number"
                              value={rate}
                              onChange={(e) => setSalaryForm(prev => ({
                                ...prev,
                                perJobRates: {
                                  ...prev.perJobRates,
                                  [category]: Number(e.target.value)
                                }
                              }))}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowSalaryModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveSalary}>
                      Save Configuration
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Salary Type</TableHead>
                <TableHead>Monthly Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eligibleStaff.map((staffMember) => {
                const salaryConfig = allSalaries.find(s => s.userId === staffMember.id)?.salary;
                return (
                  <TableRow key={staffMember.id}>
                    <TableCell className="font-medium">{staffMember.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{staffMember.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {salaryConfig ? (
                        <Badge variant="secondary">{salaryConfig.type}</Badge>
                      ) : (
                        <span className="text-gray-500">Not configured</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {salaryConfig?.monthlyAmount ? (
                        `R${salaryConfig.monthlyAmount}`
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditSalary(staffMember.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {salaryConfig && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteSalary(staffMember.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedStaffData && (
        <>
          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">
                      Total Earnings
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      R{selectedStaffData.totalEarnings}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">
                      Monthly Salary
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      R{selectedStaffData.monthlyEarnings}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">
                      Per-Job Earnings
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      R{selectedStaffData.perJobEarnings}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">
                      Jobs Completed
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {selectedStaffData.jobsCompleted}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-indigo-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">
                      Jobs Assisting
                    </p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {selectedStaffData.jobsAssisting}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job Records Table */}
          {selectedStaffData.records.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Job Records for {selectedStaffData.staffName}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedStaffData.records.map((record) => (
                      <TableRow key={record.jobId}>
                        <TableCell>
                          {format(new Date(record.date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">{record.jobTitle}</TableCell>
                        <TableCell>{record.jobCategory}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.pricingType}</Badge>
                        </TableCell>
                        <TableCell className="font-bold">R{record.amount}</TableCell>
                        <TableCell>
                          <Badge
                            variant={record.status === "completed" ? "default" : "secondary"}
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
