import { RequestHandler } from "express";
import { users } from "./auth";

export const handleUpdateUserSalary: RequestHandler = (req, res) => {
  try {
    const { userId } = req.params;
    const { type, monthlyAmount, perJobRates, currency = "ZAR", effectiveDate } = req.body;

    // Verify admin access
    const token = req.headers.authorization?.replace("Bearer ", "");
    const adminUserId = token ? token.replace("mock-token-", "") : "";
    const adminUser = users.find(u => u.id === adminUserId);
    
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Only administrators can manage salaries" });
    }

    // Find target user
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate salary type
    if (!["monthly", "per_job", "both"].includes(type)) {
      return res.status(400).json({ error: "Invalid salary type" });
    }

    // Validate required fields based on type
    if ((type === "monthly" || type === "both") && (!monthlyAmount || monthlyAmount <= 0)) {
      return res.status(400).json({ error: "Monthly amount is required and must be positive" });
    }

    if ((type === "per_job" || type === "both") && (!perJobRates || Object.keys(perJobRates).length === 0)) {
      return res.status(400).json({ error: "Per job rates are required" });
    }

    // Update user salary
    users[userIndex].salary = {
      type,
      monthlyAmount: (type === "monthly" || type === "both") ? monthlyAmount : undefined,
      perJobRates: (type === "per_job" || type === "both") ? perJobRates : undefined,
      currency,
      effectiveDate: effectiveDate || new Date().toISOString().split('T')[0]
    };

    // Remove password from response
    const { password: _, ...userWithoutPassword } = users[userIndex];
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Update salary error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetUserSalary: RequestHandler = (req, res) => {
  try {
    const { userId } = req.params;

    // Verify admin access or self-access
    const token = req.headers.authorization?.replace("Bearer ", "");
    const requestingUserId = token ? token.replace("mock-token-", "") : "";
    const requestingUser = users.find(u => u.id === requestingUserId);
    
    if (!requestingUser || (requestingUser.role !== "admin" && requestingUser.id !== userId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Find target user
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      userId: user.id,
      name: user.name,
      role: user.role,
      salary: user.salary || null
    });
  } catch (error) {
    console.error("Get salary error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetAllSalaries: RequestHandler = (req, res) => {
  try {
    // Verify admin access
    const token = req.headers.authorization?.replace("Bearer ", "");
    const requestingUserId = token ? token.replace("mock-token-", "") : "";
    const requestingUser = users.find(u => u.id === requestingUserId);
    
    if (!requestingUser || requestingUser.role !== "admin") {
      return res.status(403).json({ error: "Only administrators can view all salaries" });
    }

    // Return salary info for all users (excluding admin users)
    const salaries = users
      .filter(u => u.role !== "admin")
      .map(user => ({
        userId: user.id,
        name: user.name,
        role: user.role,
        salary: user.salary || null
      }));

    res.json(salaries);
  } catch (error) {
    console.error("Get all salaries error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleDeleteUserSalary: RequestHandler = (req, res) => {
  try {
    const { userId } = req.params;

    // Verify admin access
    const token = req.headers.authorization?.replace("Bearer ", "");
    const adminUserId = token ? token.replace("mock-token-", "") : "";
    const adminUser = users.find(u => u.id === adminUserId);
    
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Only administrators can delete salaries" });
    }

    // Find target user
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    // Remove salary
    delete users[userIndex].salary;

    res.json({ message: "Salary deleted successfully" });
  } catch (error) {
    console.error("Delete salary error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
