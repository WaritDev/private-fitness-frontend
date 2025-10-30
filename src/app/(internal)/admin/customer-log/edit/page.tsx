"use client";

import * as React from "react";
import {
  Box, Stack, Typography, TextField, MenuItem, Button,
  FormControl, InputLabel, Select, FormHelperText
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useSnack } from "@/components/snack/SnackProvider"; // ✅ ใช้ SnackProvider

type LogType = "CHECK_IN" | "CHECK_OUT" | "BOOK_SESSION" | "CANCEL_SESSION";

type CustomerLogRow = {
  logId: number;
  customerUsername: string;
  customerFirstName: string;
  customerLastName: string;
  timestamp: string; // ISO string
  logType: LogType;
};

const MOCK_LOGS: CustomerLogRow[] = [
  { logId: 104, customerUsername: "c.noon", customerFirstName: "Noon", customerLastName: "Nita", timestamp: "2025-10-30T14:25:36", logType: "CHECK_OUT" },
  { logId: 103, customerUsername: "c.noon", customerFirstName: "Noon", customerLastName: "Nita", timestamp: "2025-10-30T12:01:00", logType: "CHECK_IN" },
  { logId: 102, customerUsername: "c.ploy", customerFirstName: "Ploy", customerLastName: "Kawin", timestamp: "2025-10-29T18:45:00", logType: "CANCEL_SESSION" },
  { logId: 101, customerUsername: "c.ploy", customerFirstName: "Ploy", customerLastName: "Kawin", timestamp: "2025-10-29T10:00:00", logType: "BOOK_SESSION" },
  { logId: 100, customerUsername: "c.oak",  customerFirstName: "Oak",  customerLastName: "Rit",   timestamp: "2025-10-28T09:30:00", logType: "CHECK_IN" },
];

const MOCK_BY_ID: Record<number, CustomerLogRow> =
  Object.fromEntries(MOCK_LOGS.map((r) => [r.logId, r]));

// ------- helpers -------
function toLocalInputValue(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  } catch {
    return "";
  }
}

function isValidUseCaseTimestamp(v: string) {
  const parts = v.trim().split(" ");
  if (parts.length !== 2) return false;
  const [date, time] = parts;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  if (!/^\d{2}:\d{2}:\d{2}$/.test(time)) return false;
  const iso = v.replace(" ", "T");
  const d = new Date(iso);
  return !Number.isNaN(d.getTime());
}

function fromLocalInputToUsecaseFormat(local: string) {
  if (!local || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return "";
  const [d, t] = local.split("T");
  return `${d} ${t}:00`;
}

// ==================================================

export default function EditCustomerLogPage(): React.JSX.Element {
  const router = useRouter();
  const sp = useSearchParams();
  const { setSnack } = useSnack();                     // ✅

  const idParam = sp.get("id");
  const record: CustomerLogRow | null = React.useMemo(() => {
    const idNum = Number(idParam);
    if (!idParam || Number.isNaN(idNum)) return null;
    return MOCK_BY_ID[idNum] ?? null;
  }, [idParam]);

  // ✅ hooks ต้องอยู่ก่อน return เสมอ
  const [timestampLocal, setTimestampLocal] = React.useState<string>(
    record ? toLocalInputValue(record.timestamp) : ""
  );
  const [logType, setLogType] = React.useState<LogType>(
    record ? record.logType : "CHECK_IN"
  );
  const [tsError, setTsError] = React.useState<string>("");

  const onSave = () => {
    const tsUsecase = fromLocalInputToUsecaseFormat(timestampLocal);
    if (!isValidUseCaseTimestamp(tsUsecase)) {
      setTsError("รูปแบบเวลาไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD HH:MM:SS)");
      return;
    }
    setTsError("");

    // (mock) UPDATE ... WHERE Log_Id = ...
    const idText = record ? record.logId : "";

    // ✅ แจ้งเตือนผ่าน SnackProvider (มาตรฐานทั้งโปรเจ็กต์)
    setSnack({
      open: true,
      msg: `Log: ${idText} updated successfully`,
      severity: "success",
    });

    router.push("/admin/customer-log");
  };

  // เคสไม่พบ record
  if (!record) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Edit Customer Log
        </Typography>
        <Typography color="text.secondary">ไม่พบ Log ที่ต้องการแก้ไข</Typography>
        <Button sx={{ mt: 2 }} onClick={() => router.push("/admin/customer-log")}>
          กลับหน้า Customer Log
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 720 }}>
      <Typography variant="h5" fontWeight={500} sx={{ mb: 2 }}>
        Edit Customer Log
      </Typography>

      <Box sx={{ mb: 2, p: 2, border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 2 }}>
        <Typography variant="body2"><b>Log ID:</b> {record.logId}</Typography>
        <Typography variant="body2">
          <b>Customer:</b> {record.customerFirstName} {record.customerLastName} ({record.customerUsername})
        </Typography>
      </Box>

      <Stack spacing={2}>
        <TextField
          label="Timestamp"
          type="datetime-local"
          value={timestampLocal}
          onChange={(e) => setTimestampLocal(e.target.value)}
          InputLabelProps={{ shrink: true }}
          error={!!tsError}
          helperText={tsError || "รูปแบบที่บันทึกลงฐานข้อมูลจะเป็น YYYY-MM-DD HH:MM:SS"}
          fullWidth
        />

        <FormControl fullWidth>
          <InputLabel id="log-type-label">Log Type</InputLabel>
          <Select
            labelId="log-type-label"
            label="Log Type"
            value={logType}
            onChange={(e) => setLogType(e.target.value as LogType)}
          >
            <MenuItem value="CHECK_IN">CHECK_IN</MenuItem>
            <MenuItem value="CHECK_OUT">CHECK_OUT</MenuItem>
            <MenuItem value="BOOK_SESSION">BOOK_SESSION</MenuItem>
            <MenuItem value="CANCEL_SESSION">CANCEL_SESSION</MenuItem>
          </Select>
          <FormHelperText>เลือกประเภท Log</FormHelperText>
        </FormControl>

        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button variant="contained" onClick={onSave}>Save</Button>
          <Button variant="outlined" onClick={() => router.push("/admin/customer-log")}>Cancel</Button>
        </Stack>
      </Stack>
    </Box>
  );
}