import { RequestHandler } from "express";
import { updateSignaturePosition, getDualSignaturePositions, getSignaturePosition } from "../config/signaturePositions";

// Admin middleware to check permissions
const requireAdmin: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const userId = token ? token.replace("mock-token-", "") : "";

  if (userId !== "admin-1") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};

// Get signature positions for a specific form type
export const handleGetSignaturePositions: RequestHandler = (req, res) => {
  try {
    const { formType } = req.params;

    if (!formType) {
      return res.status(400).json({ error: "Form type is required" });
    }

    const dualPositions = getDualSignaturePositions(formType);
    if (dualPositions) {
      res.json({
        formType,
        isDual: true,
        positions: dualPositions
      });
    } else {
      const singlePosition = getSignaturePosition(formType);
      res.json({
        formType,
        isDual: false,
        position: singlePosition
      });
    }
  } catch (error) {
    console.error("Error getting signature positions:", error);
    res.status(500).json({ error: "Failed to get signature positions" });
  }
};

// Update signature positions for a specific form type
export const handleUpdateSignaturePositions: RequestHandler = (req, res) => {
  try {
    const { formType, positions } = req.body;

    if (!formType || !positions) {
      return res.status(400).json({ error: "Form type and positions are required" });
    }

    // Validate positions structure
    if (positions.client && positions.staff) {
      // Dual signature validation
      const { client, staff } = positions;
      if (!client.x || !client.y || !client.width || !client.height ||
          !staff.x || !staff.y || !staff.width || !staff.height) {
        return res.status(400).json({ error: "Invalid dual signature position structure" });
      }
    } else if (positions.x && positions.y && positions.width && positions.height) {
      // Single signature validation
      // Valid single signature position
    } else {
      return res.status(400).json({ error: "Invalid signature position structure" });
    }

    // Update the positions
    updateSignaturePosition(formType, positions);

    res.json({
      success: true,
      message: "Signature positions updated successfully",
      formType,
      positions
    });
  } catch (error) {
    console.error("Error updating signature positions:", error);
    res.status(500).json({ error: "Failed to update signature positions" });
  }
};

// Get all signature positions
export const handleGetAllSignaturePositions: RequestHandler = (req, res) => {
  try {
    const formTypes = [
      "liability-form",
      "clearance-certificate-form", 
      "discovery-form",
      "absa-form",
      "sahl-certificate-form",
      "noncompliance-form",
      "material-list-form"
    ];

    const allPositions = formTypes.map(formType => {
      const dualPositions = getDualSignaturePositions(formType);
      if (dualPositions) {
        return {
          formType,
          isDual: true,
          positions: dualPositions
        };
      } else {
        const singlePosition = getSignaturePosition(formType);
        return {
          formType,
          isDual: false,
          position: singlePosition
        };
      }
    });

    res.json(allPositions);
  } catch (error) {
    console.error("Error getting all signature positions:", error);
    res.status(500).json({ error: "Failed to get signature positions" });
  }
};

// Reset signature positions to defaults
export const handleResetSignaturePositions: RequestHandler = (req, res) => {
  try {
    const { formType } = req.body;

    if (!formType) {
      return res.status(400).json({ error: "Form type is required" });
    }

    // Default positions
    const defaultPositions = {
      "liability-form": {
        client: { x: 411, y: 788, width: 180, height: 50, opacity: 0.7 },
        staff: { x: 4, y: 788, width: 180, height: 50, opacity: 0.7 }
      },
      "clearance-certificate-form": {
        client: { x: 87, y: 575, width: 180, height: 50, opacity: 0.7 },
        staff: { x: 87, y: 631, width: 180, height: 50, opacity: 0.7 }
      },
      "discovery-form": {
        client: { x: 120, y: 163, width: 180, height: 50, opacity: 0.7 },
        staff: { x: 120, y: 110, width: 180, height: 50, opacity: 0.7 }
      },
      "absa-form": { x: 74, y: 373, width: 200, height: 60, opacity: 0.7 },
      "sahl-certificate-form": { x: 71, y: 586, width: 200, height: 60, opacity: 0.7 },
      "noncompliance-form": { x: 300, y: 700, width: 200, height: 60, opacity: 0.7 },
      "material-list-form": { x: 320, y: 750, width: 200, height: 60, opacity: 0.7 }
    };

    const defaultPosition = defaultPositions[formType];
    if (!defaultPosition) {
      return res.status(404).json({ error: "Form type not found" });
    }

    updateSignaturePosition(formType, defaultPosition);

    res.json({
      success: true,
      message: "Signature positions reset to defaults",
      formType,
      positions: defaultPosition
    });
  } catch (error) {
    console.error("Error resetting signature positions:", error);
    res.status(500).json({ error: "Failed to reset signature positions" });
  }
};
