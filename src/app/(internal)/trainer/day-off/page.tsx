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
  Snackbar,
  Alert,
  CircularProgress,
  Stack,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import ConfirmPopUpUI from "@/components/pop-up/ConfirmPopUpUI";

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" } as const;
const API_BASE_URL = "http://localhost:8000";

// Day Off Type - ตรงตาม API Response
type DayOff = {
  scheduleId: number;
  startTime: string; // ISO 8601 timestamp
  endTime: string;   // ISO 8601 timestamp
};

// API Response Types
type DayOffsResponse = {
  status: string;
  message: string;
  dayOffs: DayOff[];
};

type SuccessResponse = {
  status: string;
  message: string;
};

type ErrorResponse = {
  status: string;
  message: string;
};

export default function TrainerDayOffsPage(): React.JSX.Element {
  // State Management
  const [dayOffs, setDayOffs] = React.useState<DayOff[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Dialog State
  const [openDialog, setOpenDialog] = React.useState<boolean>(false);
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(null);

  // Confirm Delete Dialog State
  const [confirmDelete, setConfirmDelete] = React.useState<{
    open: boolean;
    scheduleId: number | null;
  }>({
    open: false,
    scheduleId: null,
  });

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

  // Load Day-Offs from API
  const loadDayOffs = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/trainers/day-offs`, {
        method: "GET",
        credentials: "include", // ส่ง cookie pf_auth
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = (await response.json()) as DayOffsResponse | ErrorResponse;

      if (response.ok && data.status === "success") {
        const successData = data as DayOffsResponse;
        setDayOffs(successData.dayOffs || []);
      } else {
        const errorData = data as ErrorResponse;
        setError(errorData.message || "Failed to load day-offs");
        setSnackbar({
          open: true,
          message: errorData.message || "Failed to load day-offs",
          severity: "error",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load day-offs";
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: "Failed to load day-offs data",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on component mount
  React.useEffect(() => {
    loadDayOffs();
  }, [loadDayOffs]);

  // Open Add Dialog
  const handleOpenAddDialog = () => {
    setSelectedDate(null);
    setOpenDialog(true);
  };

  // Close Dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDate(null);
  };

  // Handle Add Day-Off
  const handleAddDayOff = async () => {
    if (!selectedDate) {
      setSnackbar({
        open: true,
        message: "Please select a date",
        severity: "error",
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/trainers/day-offs`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dayOffDate: selectedDate.format("YYYY-MM-DD"),
        }),
      });

      const data = (await response.json()) as SuccessResponse | ErrorResponse;

      if (response.ok && data.status === "success") {
        setSnackbar({
          open: true,
          message: "Day-off added successfully",
          severity: "success",
        });

        handleCloseDialog();

        // Refresh data after 4 seconds (ตาม Use Case)
        setTimeout(() => {
          loadDayOffs();
        }, 4000);
      } else {
        const errorData = data as ErrorResponse;
        setSnackbar({
          open: true,
          message: errorData.message || "Failed to add day-off",
          severity: "error",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to add day-off",
        severity: "error",
      });
    }
  };

  // Handle Delete Click
  const handleDeleteClick = (scheduleId: number) => {
    setConfirmDelete({
      open: true,
      scheduleId,
    });
  };

  // Perform Delete after confirmation
  const performDelete = React.useCallback(async () => {
    if (!confirmDelete.scheduleId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/trainers/day-offs/${confirmDelete.scheduleId}`,
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
          message: "Day-off deleted successfully",
          severity: "success",
        });

        // Refresh data after 4 seconds (ตาม Use Case)
        setTimeout(() => {
          loadDayOffs();
        }, 4000);
      } else {
        const errorData = data as ErrorResponse;
        setSnackbar({
          open: true,
          message: errorData.message || "Failed to delete day-off",
          severity: "error",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to delete day-off",
        severity: "error",
      });
    } finally {
      setConfirmDelete({
        open: false,
        scheduleId: null,
      });
    }
  }, [confirmDelete.scheduleId, loadDayOffs]);

  // Format date to DD/MM/YYYY
  const formatDate = (isoString: string): string => {
    const date = dayjs(isoString);
    return date.format("DD/MM/YYYY");
  };

  // Format time to HH:mm
  const formatTime = (isoString: string): string => {
    const date = dayjs(isoString);
    return date.format("HH:mm");
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h5" fontWeight={500}>
              📅 Manage Day-Offs
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
              sx={{
                bgcolor: PRIMARY.main,
                "&:hover": { bgcolor: PRIMARY.dark },
                color: "#000",
              }}
            >
              Add Day-Off
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

          {/* Day-Offs Table */}
          {!loading && !error && (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: "10%" }}>
                      #
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, width: "30%" }}>
                      Date
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, width: "30%" }}>
                      Start Time
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, width: "30%" }}>
                      End Time
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, width: "20%", textAlign: "center" }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dayOffs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                        No day-offs
                      </TableCell>
                    </TableRow>
                  ) : (
                    dayOffs.map((dayOff, index) => (
                      <TableRow key={dayOff.scheduleId}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{formatDate(dayOff.startTime)}</TableCell>
                        <TableCell>{formatTime(dayOff.startTime)}</TableCell>
                        <TableCell>{formatTime(dayOff.endTime)}</TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(dayOff.scheduleId)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Empty State */}
          {!loading && !error && dayOffs.length === 0 && (
            <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
              <Typography variant="body1">No day-offs</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Click "Add Day-Off" button to get started
              </Typography>
            </Box>
          )}

          {/* Add Day-Off Dialog */}
          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle>Add Day-Off</DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 1 }}>
                <DatePicker
                  label="Select Day-Off Date"
                  value={selectedDate}
                  onChange={(newDate) => setSelectedDate(newDate)}
                  disablePast
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleAddDayOff}
                disabled={!selectedDate}
                sx={{
                  bgcolor: PRIMARY.main,
                  "&:hover": { bgcolor: PRIMARY.dark },
                  color: "#000",
                }}
              >
                Save
              </Button>
            </DialogActions>
          </Dialog>

          {/* Confirm Delete Dialog */}
          <ConfirmPopUpUI
            open={confirmDelete.open}
            title="Confirm Delete Day-Off"
            message="Do you want to delete this day-off?"
            confirmText="Delete"
            cancelText="Cancel"
            onConfirm={performDelete}
            onClose={() =>
              setConfirmDelete({
                open: false,
                scheduleId: null,
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
    </LocalizationProvider>
  );
}
