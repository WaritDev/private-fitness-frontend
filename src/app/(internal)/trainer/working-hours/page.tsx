"use client";

import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  CircularProgress,
  Stack,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { DayOfWeek, DAY_NAMES } from "@/types/trainer-availability";
import ConfirmPopUpUI from "@/components/pop-up/ConfirmPopUpUI";
import useWeekRange from "@/hooks/useWeekRange";

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" } as const;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

// Helper function to map dayOfWeek to date
function getDateForDayOfWeek(dayOfWeek: DayOfWeek, days: Date[]): Date | null {
  const dayMap: { [key in DayOfWeek]: number } = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
  };
  
  const dayIndex = dayMap[dayOfWeek];
  return days[dayIndex] || null;
}

// Working Hour Type - ตรงตาม API Response
type WorkingHour = {
  availabilityId: number;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
};

// Form Data Type
type WorkingHoursFormData = {
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
};

// API Response Types
type WorkingHoursResponse = {
  status: string;
  message: string; 
  workingHours: WorkingHour[];
};

type SuccessResponse = {
  status: string;
  message: string;
};

type ErrorResponse = {
  status: string;
  message: string;
};

type DayOff = {
  scheduleId: number;
  startTime: string;
  endTime: string;
};

export default function TrainerWorkingHoursPage(): React.JSX.Element {
  // Get current week dates starting from Sunday
  const { days } = useWeekRange();
  
  // State Management
  const [workingHours, setWorkingHours] = React.useState<WorkingHour[]>([]);
  const [dayOffs, setDayOffs] = React.useState<Array<{dayOffDate: string}>>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // Check if a date has a day-off
  const isDayOff = React.useCallback((date: Date): boolean => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return dayOffs.some(doff => doff.dayOffDate === dateStr);
  }, [dayOffs]);

  // Dialog State
  const [openDialog, setOpenDialog] = React.useState<boolean>(false);
  const [editing, setEditing] = React.useState<WorkingHour | null>(null);

  // Confirm Delete Dialog State
  const [confirmDelete, setConfirmDelete] = React.useState<{
    open: boolean;
    availabilityId: number | null;
  }>({
    open: false,
    availabilityId: null,
  });

  // Form State
  const [formData, setFormData] = React.useState<WorkingHoursFormData>({
    dayOfWeek: "MONDAY",
    startTime: "09:00",
    endTime: "17:00",
  });

  // Form Validation Errors
  const [formErrors, setFormErrors] = React.useState<{
    dayOfWeek?: string;
    startTime?: string;
    endTime?: string;
  }>({});

  // Snackbar State
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Load Working Hours from API
  const loadWorkingHours = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load both working hours and day-offs
      const [workingHoursRes, dayOffsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/trainers/working-hours`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }),
        fetch(`${API_BASE_URL}/api/trainers/day-offs`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }),
      ]);

      const workingHoursData = (await workingHoursRes.json()) as WorkingHoursResponse | ErrorResponse;
      const dayOffsData = (await dayOffsRes.json()) as { status: string; message: string; dayOffs: DayOff[] } | ErrorResponse;

      if (workingHoursRes.ok && workingHoursData.status === "success") {
        const successData = workingHoursData as WorkingHoursResponse;
        setWorkingHours(successData.workingHours || []);
      } else {
        const errorData = workingHoursData as ErrorResponse;
        setError(errorData.message || "Failed to load working hours");
      }

      if (dayOffsRes.ok && dayOffsData.status === "success") {
        const successDayOffs = dayOffsData as { dayOffs: DayOff[] };
        // Convert ISO timestamps to dates for comparison
        const dayOffDates = successDayOffs.dayOffs.map(doff => ({
          dayOffDate: new Date(doff.startTime).toISOString().split('T')[0]
        }));
        setDayOffs(dayOffDates);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load data";
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: "Failed to load data",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on component mount
  React.useEffect(() => {
    loadWorkingHours();
  }, [loadWorkingHours]);

  // Open Add Dialog
  const handleOpenAddDialog = () => {
    setEditing(null);
    setFormData({
      dayOfWeek: "MONDAY",
      startTime: "09:00",
      endTime: "17:00",
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  // Open Edit Dialog
  const handleOpenEditDialog = (workingHour: WorkingHour) => {
    setEditing(workingHour);
    setFormData({
      dayOfWeek: workingHour.dayOfWeek,
      startTime: workingHour.startTime,
      endTime: workingHour.endTime,
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  // Close Dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditing(null);
    setFormData({
      dayOfWeek: "MONDAY",
      startTime: "09:00",
      endTime: "17:00",
    });
    setFormErrors({});
  };

  // Validate Form
  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};

    // Validate dayOfWeek
    if (!formData.dayOfWeek) {
      errors.dayOfWeek = "Please select a day";
    }

    // Validate startTime
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!formData.startTime) {
      errors.startTime = "Please select start time";
    } else if (!timeRegex.test(formData.startTime)) {
      errors.startTime = "Invalid time format (HH:mm)";
    }

    // Validate endTime
    if (!formData.endTime) {
      errors.endTime = "Please select end time";
    } else if (!timeRegex.test(formData.endTime)) {
      errors.endTime = "Invalid time format (HH:mm)";
    }

    // Validate endTime > startTime
    if (formData.startTime && formData.endTime && formData.endTime <= formData.startTime) {
      errors.endTime = "End time must be after start time";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Save (Add or Update)
  const handleSave = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      const method = editing ? "PUT" : "POST";
      const url = editing
        ? `${API_BASE_URL}/api/trainers/working-hours/${editing.availabilityId}`
        : `${API_BASE_URL}/api/trainers/working-hours`;

      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dayOfWeek: formData.dayOfWeek,
          startTime: formData.startTime,
          endTime: formData.endTime,
        }),
      });

      const data = (await response.json()) as SuccessResponse | ErrorResponse;

      if (response.ok && data.status === "success") {
        setSnackbar({
          open: true,
          message: editing
            ? "Working hours updated successfully"
            : "Working hours added successfully",
          severity: "success",
        });

        handleCloseDialog();

        // Refresh data after 4 seconds (ตาม Use Case)
        setTimeout(() => {
          loadWorkingHours();
        }, 4000);
      } else {
        const errorData = data as ErrorResponse;
        setSnackbar({
          open: true,
          message: errorData.message || "Failed to save working hours",
          severity: "error",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to save working hours",
        severity: "error",
      });
    }
  };

  // Handle Delete Click
  const handleDeleteClick = (availabilityId: number) => {
    setConfirmDelete({
      open: true,
      availabilityId,
    });
  };

  // Perform Delete after confirmation
  const performDelete = React.useCallback(async () => {
    if (!confirmDelete.availabilityId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/trainers/working-hours/${confirmDelete.availabilityId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = (await response.json()) as SuccessResponse | ErrorResponse;

      if (response.ok && data.status === "success") {
        setSnackbar({
          open: true,
          message: "Working hours deleted successfully",
          severity: "success",
        });

        // Refresh data after 4 seconds (ตาม Use Case)
        setTimeout(() => {
          loadWorkingHours();
        }, 4000);
      } else {
        const errorData = data as ErrorResponse;
        setSnackbar({
          open: true,
          message: errorData.message || "Failed to delete working hours",
          severity: "error",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to delete working hours",
        severity: "error",
      });
    } finally {
      setConfirmDelete({
        open: false,
        availabilityId: null,
      });
    }
  }, [confirmDelete.availabilityId, loadWorkingHours]);

  // Group working hours by day
  const groupedByDay = React.useMemo(() => {
    const groups: Record<DayOfWeek, WorkingHour[]> = {
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: [],
      SATURDAY: [],
      SUNDAY: [],
    };

    workingHours.forEach((hour) => {
      groups[hour.dayOfWeek].push(hour);
    });

    // Sort each day by startTime
    Object.keys(groups).forEach((day) => {
      groups[day as DayOfWeek].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return groups;
  }, [workingHours]);

  // Day order for display
  const dayOrder: DayOfWeek[] = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h5" fontWeight={500}>
            Weekly Working Hours
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
            sx={{
              bgcolor: PRIMARY.main,
              "&:hover": { bgcolor: PRIMARY.dark },
            }}
          >
            Add Working Hours
          </Button>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {!loading && error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Working Hours Table */}
        {!loading && !error && (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: "15%" }}>
                    Date
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: "15%" }}>
                    Day
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: "25%" }}>
                    Start Time
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: "25%" }}>
                    End Time
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, width: "20%", textAlign: "center" }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dayOrder.map((day) => {
                  const hours = groupedByDay[day];
                  const dateForDay = getDateForDayOfWeek(day, days);
                  const dateStr = dateForDay 
                    ? `${String(dateForDay.getDate()).padStart(2, '0')} ${DAY_NAMES[day].slice(0, 3)}` 
                    : DAY_NAMES[day];
                  const hasDayOff = dateForDay ? isDayOff(dateForDay) : false;
                  
                  if (hours.length === 0 && !hasDayOff) {
                    return (
                      <TableRow key={day}>
                        <TableCell>{dateStr}</TableCell>
                        <TableCell>{DAY_NAMES[day]}</TableCell>
                        <TableCell colSpan={3} sx={{ color: "text.secondary", fontStyle: "italic" }}>
                          No working hours
                        </TableCell>
                      </TableRow>
                    );
                  }

                  // If there's a day-off but no working hours, show day-off indicator
                  if (hours.length === 0 && hasDayOff) {
                    return (
                      <TableRow key={day}>
                        <TableCell>{dateStr}</TableCell>
                        <TableCell>{DAY_NAMES[day]}</TableCell>
                        <TableCell colSpan={3} sx={{ color: "text.secondary", fontStyle: "italic" }}>
                          Day Off
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return hours.map((hour, index) => (
                    <TableRow key={hour.availabilityId}>
                      {index === 0 && (
                        <>
                          <TableCell rowSpan={hours.length}>{dateStr}</TableCell>
                          <TableCell rowSpan={hours.length}>
                            {hasDayOff ? `⚠️ ${DAY_NAMES[day]}` : DAY_NAMES[day]}
                          </TableCell>
                        </>
                      )}
                      <TableCell>{hour.startTime}</TableCell>
                      <TableCell>{hour.endTime}</TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenEditDialog(hour)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(hour.availabilityId)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ));
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Empty State */}
        {!loading && !error && workingHours.length === 0 && (
          <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
            <Typography variant="body1">No working hours</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Click "Add Working Hours" button to get started
            </Typography>
          </Box>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editing ? "Edit Working Hours" : "Add Working Hours"}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Day of Week Select */}
              <FormControl fullWidth error={!!formErrors.dayOfWeek}>
                <InputLabel>Day</InputLabel>
                <Select
                  value={formData.dayOfWeek}
                  onChange={(e) =>
                    setFormData({ ...formData, dayOfWeek: e.target.value as DayOfWeek })
                  }
                  label="Day"
                >
                  {dayOrder.map((day) => (
                    <MenuItem key={day} value={day}>
                      {DAY_NAMES[day]}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.dayOfWeek && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {formErrors.dayOfWeek}
                  </Typography>
                )}
              </FormControl>

              {/* Start Time */}
              <TextField
                label="Start Time"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                error={!!formErrors.startTime}
                helperText={formErrors.startTime}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 300, // 5 minutes
                }}
              />

              {/* End Time */}
              <TextField
                label="End Time"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                error={!!formErrors.endTime}
                helperText={formErrors.endTime}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 300, // 5 minutes
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSave}
              sx={{
                bgcolor: PRIMARY.main,
                "&:hover": { bgcolor: PRIMARY.dark },
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirm Delete Dialog */}
        <ConfirmPopUpUI
          open={confirmDelete.open}
          title="Confirm Delete Working Hours"
          message="Do you want to delete this working hours?"
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={performDelete}
          onClose={() =>
            setConfirmDelete({
              open: false,
              availabilityId: null,
            })
          }
        />

        {/* Snackbar for Toast Messages */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Stack>
    </Container>
  );
}
