"use client";

import * as React from "react";
import {
  Box, Stack, Typography, TextField, MenuItem, Button,
  FormControl, InputLabel, Select, FormHelperText, Alert, Paper, CircularProgress
} from "@mui/material";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useSnack } from "@/components/snack/SnackProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type LogType = "CHECK_IN" | "CHECK_OUT" | "BOOK_SESSION" | "CANCEL_SESSION";

type ApiGet = {
  id: string;
  customerUsername: string;
  customerFirstName: string;
  customerLastName: string;
  createdAt: string;   // ISO e.g. "2025-10-30T16:34:12+07:00"
  logType: LogType;
};

type ApiUpdateBody = {
  timestamp: string;   // "YYYY-MM-DD HH:MM:SS"
  logType: LogType;
};

type ApiError = { message?: string };

function isoToDatetimeLocal(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

// "YYYY-MM-DDTHH:MM" -> "YYYY-MM-DD HH:MM:SS"
function datetimeLocalToUsecase(local: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return "";
  const [d, t] = local.split("T");
  return `${d} ${t}:00`;
}

// quick validator for "YYYY-MM-DD HH:MM:SS"
function isValidUsecaseTimestamp(v: string): boolean {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return false;
  const d = new Date(v.replace(" ", "T"));
  return !Number.isNaN(d.getTime());
}

export default function EditCustomerLogPage(): React.JSX.Element {
  const router = useRouter();
  const sp = useSearchParams();
  const params = useParams<{ id?: string }>();
  const { setSnack } = useSnack();

  // ✅ อ่าน id จาก path ก่อน แล้วค่อย fallback เป็น query (?id=)
  const idParam = (params?.id ?? sp.get("id") ?? "").toString();

  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [globalErr, setGlobalErr] = React.useState("");

  // form states
  const [logId, setLogId] = React.useState<string>("");
  const [custU, setCustU] = React.useState<string>("");
  const [custFN, setCustFN] = React.useState<string>("");
  const [custLN, setCustLN] = React.useState<string>("");

  const [timestampLocal, setTimestampLocal] = React.useState<string>("");
  const [logType, setLogType] = React.useState<LogType>("CHECK_IN");
  const [tsError, setTsError] = React.useState<string>("");

  // ---- fetch one ----
  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      // ❗️ถ้าไม่มี id ใน URL/QS: ไม่ถือเป็น 404 แค่หยุดโหลดและปล่อยให้ UI แสดงคำเตือน
      if (!idParam) { setLoading(false); return; }
      setLoading(true);
      setGlobalErr("");

      try {
        const res = await fetch(`${API_BASE}/api/customer-logs/${encodeURIComponent(idParam)}`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        const body = (await res.json().catch(() => ({}))) as ApiGet | ApiError | Record<string, unknown>;

        if (!res.ok) {
          const msg = (body as ApiError).message ?? `โหลดข้อมูลล้มเหลว (HTTP ${res.status})`;
          if (res.status === 404) { setNotFound(true); return; }
          throw new Error(msg);
        }

        const row = body as ApiGet;
        if (cancelled) return;

        setLogId(row.id);
        setCustU(row.customerUsername);
        setCustFN(row.customerFirstName);
        setCustLN(row.customerLastName);
        setTimestampLocal(isoToDatetimeLocal(row.createdAt)); // ใช้ createdAt เป็นค่าเริ่มต้น
        setLogType(row.logType);

      } catch (e: unknown) {
        setGlobalErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [idParam]);

  const goBack = () => router.push("/admin/customer-log");

  const onSave = async () => {
    const ts = datetimeLocalToUsecase(timestampLocal);
    if (!isValidUsecaseTimestamp(ts)) {
      setTsError("รูปแบบเวลาไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD HH:MM:SS)");
      return;
    }
    setTsError("");

    try {
      const payload: ApiUpdateBody = { timestamp: ts, logType };
      const res = await fetch(
        `${API_BASE}/api/customer-logs/${encodeURIComponent(logId)}/update`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const body = (await res.json().catch(() => ({}))) as ApiError | Record<string, unknown>;

      if (!res.ok) {
        const msg = (body as ApiError).message ?? `บันทึกล้มเหลว (HTTP ${res.status})`;
        throw new Error(msg);
      }

      setSnack({ open: true, msg: `Log: ${logId} updated successfully`, severity: "success" });
      router.push("/admin/customer-log");
    } catch (e: unknown) {
      setSnack({ open: true, msg: e instanceof Error ? e.message : String(e), severity: "error" });
    }
  };

  // ---- UI ----
  if (!idParam && !loading) {
    // ไม่มีพารามิเตอร์ id ใน URL
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Edit Customer Log</Typography>
        <Alert severity="warning" sx={{ mb: 2 }}>
          ไม่พบพารามิเตอร์ <b>id</b> ใน URL (ตัวอย่าง: <code>/admin/customer-log/edit/9004</code>)
        </Alert>
        <Button variant="outlined" onClick={goBack}>กลับหน้า Customer Log</Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (notFound) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Edit Customer Log</Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          ไม่พบ Log ที่ต้องการแก้ไข (id: {idParam})
        </Alert>
        <Button variant="outlined" onClick={goBack}>กลับหน้า Customer Log</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 760, mx: "auto" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={500}>Edit Customer Log</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={goBack}>ยกเลิก</Button>
          <Button variant="contained" onClick={onSave}>Save</Button>
        </Stack>
      </Stack>

      {globalErr && <Alert severity="error" sx={{ mb: 2 }}>{globalErr}</Alert>}

      <Paper sx={{ p: 2, borderRadius: 3, mb: 2 }}>
        <Typography variant="body2"><b>Log ID:</b> {logId || "—"}</Typography>
        <Typography variant="body2">
          <b>Customer:</b> {custFN} {custLN} ({custU})
        </Typography>
      </Paper>

      <Stack spacing={2}>
        <TextField
          label="Timestamp"
          type="datetime-local"
          value={timestampLocal}
          onChange={(e) => setTimestampLocal(e.target.value)}
          InputLabelProps={{ shrink: true }}
          error={!!tsError}
          helperText={tsError || "จะบันทึกเป็นรูปแบบ YYYY-MM-DD HH:MM:SS"}
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

        <Stack direction="row" spacing={1}>
        </Stack>
      </Stack>
    </Box>
  );
}