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
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
  Stack,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import dayjs from "dayjs";
import "dayjs/locale/th";
import ConfirmPopUpUI from "@/components/pop-up/ConfirmPopUpUI";

dayjs.locale("th");

const API_BASE_URL = "http://localhost:8000";

// Appointment Type - ตรงตาม API Response
type CalendarAppointment = {
  scheduleId: number;
  customerUsername: string;
  customerFirstName: string;
  customerLastName: string;
  startTime: string; // ISO 8601 timestamp
  endTime: string;    // ISO 8601 timestamp
  sessionId: number;
  totalSessions: number;
  usedSessions: number;
  checkinStatus: "PENDING" | "CONFIRMED" | "NONE";
  checkinLogId: number;
  checkinTime: string; // ISO 8601 timestamp
};

// API Response Types
type TrainerCalendarResponse = {
  status: string;
  message: string;
  appointments: CalendarAppointment[];
};

type SuccessResponse = {
  status: string;
  message: string;
};

type ErrorResponse = {
  status: string;
  message: string;
};

export default function TrainerCalendarPage(): React.JSX.Element {
  // State Management
  const [appointments, setAppointments] = React.useState<CalendarAppointment[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Confirm Check-in Dialog State
  const [confirmCheckIn, setConfirmCheckIn] = React.useState<{
    open: boolean;
    appointment: CalendarAppointment | null;
  }>({
    open: false,
    appointment: null,
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

  // Load Calendar from API
  const loadCalendar = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/trainers/calendar`, {
        method: "GET",
        credentials: "include", // ส่ง cookie pf_auth
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = (await response.json()) as TrainerCalendarResponse | ErrorResponse;

      if (response.ok && data.status === "success" && "appointments" in data) {
        setAppointments(data.appointments);
      } else {
        setError(data.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อกับ server");
      console.error("Load calendar error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Load
  React.useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  // Handle Confirm Check-in
  const handleConfirmCheckInClick = (appointment: CalendarAppointment) => {
    setConfirmCheckIn({
      open: true,
      appointment,
    });
  };

  // Perform Check-in Confirmation
  const performConfirmCheckIn = React.useCallback(async () => {
    if (!confirmCheckIn.appointment) return;

    const { scheduleId, customerUsername } = confirmCheckIn.appointment;

    try {
      const response = await fetch(`${API_BASE_URL}/api/trainers/checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          sessionId: scheduleId, // ใช้ scheduleId เป็น sessionId ตาม request
          customerUsername,
        }),
      });

      const data = (await response.json()) as SuccessResponse | ErrorResponse;

      if (response.ok && data.status === "success") {
        setSnackbar({
          open: true,
          message: data.message || "ยืนยันการเข้าเรียนสำเร็จ",
          severity: "success",
        });
        // Refresh calendar after 2 seconds
        setTimeout(() => {
          loadCalendar();
        }, 2000);
      } else {
        setSnackbar({
          open: true,
          message: data.message || "เกิดข้อผิดพลาดในการยืนยันการเข้าเรียน",
          severity: "error",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: "เกิดข้อผิดพลาดในการยืนยันการเข้าเรียน",
        severity: "error",
      });
      console.error("Confirm check-in error:", err);
    } finally {
      setConfirmCheckIn({ open: false, appointment: null });
    }
  }, [confirmCheckIn.appointment, loadCalendar]);

  // Format Date & Time
  const formatDateTime = (isoString: string): string => {
    // Backend ส่งมาเป็น UTC, แปลงเป็น Asia/Bangkok
    const dt = dayjs(isoString);
    return dt.format("DD/MM/YYYY HH:mm");
  };

  const formatTime = (isoString: string): string => {
    const dt = dayjs(isoString);
    return dt.format("HH:mm");
  };

  // Get Status Chip
  const getStatusChip = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Chip
            icon={<PendingIcon />}
            label="รอยืนยัน"
            color="warning"
            size="small"
          />
        );
      case "CONFIRMED":
        return (
          <Chip
            icon={<CheckCircleIcon />}
            label="ยืนยันแล้ว"
            color="success"
            size="small"
          />
        );
      default:
        return (
          <Chip label="ยังไม่เช็กอิน" color="default" size="small" />
        );
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" fontWeight={700}>
            📅 ปฏิทินการนัดหมายของฉัน
          </Typography>
          <Button
            variant="contained"
            onClick={loadCalendar}
            disabled={loading}
            sx={{
              bgcolor: "#38E07A",
              color: "#000",
              "&:hover": { bgcolor: "#2fbb65" },
            }}
          >
            🔄 รีเฟรช
          </Button>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Calendar Table */}
        {!loading && !error && (
          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: 700 }}>วันที่/เวลา</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>ลูกค้า</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Session</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>สถานะ Check-in</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>เวลา Check-in</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>การดำเนินการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        ไม่มีนัดหมาย
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  appointments.map((apt) => (
                    <TableRow key={apt.scheduleId} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {formatDateTime(apt.startTime)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ถึง {formatTime(apt.endTime)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {apt.customerFirstName} {apt.customerLastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          @{apt.customerUsername}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {apt.usedSessions} / {apt.totalSessions}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ครั้งที่ใช้แล้ว / ทั้งหมด
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(apt.checkinStatus)}</TableCell>
                      <TableCell>
                        {apt.checkinTime && apt.checkinStatus !== "NONE" ? (
                          <Typography variant="body2" color="text.secondary">
                            {formatDateTime(apt.checkinTime)}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {apt.checkinStatus === "PENDING" ? (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleConfirmCheckInClick(apt)}
                            sx={{
                              bgcolor: "#38E07A",
                              color: "#000",
                              "&:hover": { bgcolor: "#2fbb65" },
                            }}
                          >
                            ✅ ยืนยันการเข้าเรียน
                          </Button>
                        ) : apt.checkinStatus === "CONFIRMED" ? (
                          <Typography variant="body2" color="success.main">
                            ✓ ยืนยันแล้ว
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            รอเช็กอิน
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      {/* Confirm Check-in Dialog */}
      <ConfirmPopUpUI
        open={confirmCheckIn.open}
        title="ยืนยันการเข้าเรียน"
        message={
          confirmCheckIn.appointment ? (
            <Box>
              <Typography variant="body1" gutterBottom>
                คุณต้องการยืนยันการเข้าเรียนของ
              </Typography>
              <Typography variant="body1" fontWeight={600} gutterBottom>
                {confirmCheckIn.appointment.customerFirstName}{" "}
                {confirmCheckIn.appointment.customerLastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                วันที่: {formatDateTime(confirmCheckIn.appointment.startTime)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                ระบบจะหัก session จำนวน 1 ครั้งให้อัตโนมัติ
              </Typography>
            </Box>
          ) : (
            ""
          )
        }
        confirmText="ยืนยัน"
        cancelText="ยกเลิก"
        onConfirm={performConfirmCheckIn}
        onClose={() =>
          setConfirmCheckIn({ open: false, appointment: null })
        }
      />

      {/* Snackbar for Toast Messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
