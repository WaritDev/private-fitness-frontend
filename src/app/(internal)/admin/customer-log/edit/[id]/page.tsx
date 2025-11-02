"use client";

import * as React from "react";
import {
  Box, Stack, Typography, TextField, MenuItem, Button,
  FormControl, InputLabel, Select, FormHelperText, Alert, Paper, CircularProgress
} from "@mui/material";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useAlertPopUp } from "@/components/pop-up/AlertPopUpUI";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type LogType = "CHECK_IN" | "CHECK_OUT" | "BOOK_SESSION" | "CANCEL_SESSION";

type ApiGet = {
  id: string;
  customerUsername: string;
  customerFirstName: string;
  customerLastName: string;
  createdAt: string;
  logType: LogType;
};

type ApiUpdateBody = {
  timestamp: string;
  logType: LogType;
};

type ApiError = { message?: string };

function toAscii(s: string): string {
  const full = "０１２３４５６７８９－：．／　";
  const half = "0123456789-:./ ";
  let out = "";
  for (const ch of s) {
    const i = full.indexOf(ch);
    out += i >= 0 ? half[i] : ch;
  }
  return out;
}

function isoToText(iso?: string): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}:\d{2})/);
  return m ? `${m[1]} ${m[2]}` : "";
}

function normalizeTimestamp(raw: string): string {
  let s = toAscii(raw).trim();
  s = s.replace(/\s+/g, " ");
  s = s.replace("T", " ");
  s = s.replace(/[./]/g, "-");
  s = s.replace(/([0-9])\.\d+$/, "$1");
  s = s.replace(/\s*(Z|[+-]\d{2}:?\d{2})$/, "");
  const mm = s.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2})$/);
  if (mm) return `${mm[1]} ${mm[2]}:${mm[3]}:00`;
  return s;
}

function isValidTimestampStrict(s: string): boolean {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return false;
  const [_, ys, ms, ds, hs, mins, ss] = m;
  const y = +ys, mo = +ms, d = +ds, h = +hs, mi = +mins, sec = +ss;
  if (mo < 1 || mo > 12) return false;
  if (h < 0 || h > 23) return false;
  if (mi < 0 || mi > 59) return false;
  if (sec < 0 || sec > 59) return false;
  const daysInMonth = new Date(y, mo, 0).getDate();
  return d >= 1 && d <= daysInMonth;
}

export default function EditCustomerLogPage(): React.JSX.Element {
  const router = useRouter();
  const sp = useSearchParams();
  const params = useParams<{ id?: string }>();
  const { setAlert } = useAlertPopUp();

  const idParam = (params?.id ?? sp.get("id") ?? "").toString();

  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [globalErr, setGlobalErr] = React.useState("");

  const [logId, setLogId] = React.useState<string>("");
  const [custU, setCustU] = React.useState<string>("");
  const [custFN, setCustFN] = React.useState<string>("");
  const [custLN, setCustLN] = React.useState<string>("");

  const [timestampText, setTimestampText] = React.useState<string>("");
  const [logType, setLogType] = React.useState<LogType>("CHECK_IN");
  const [tsError, setTsError] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
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
          const msg = (body as ApiError).message ?? `Load failed (HTTP ${res.status})`;
          if (res.status === 404) { setNotFound(true); return; }
          throw new Error(msg);
        }

        const row = body as ApiGet;
        if (cancelled) return;

        setLogId(row.id);
        setCustU(row.customerUsername);
        setCustFN(row.customerFirstName);
        setCustLN(row.customerLastName);
        setTimestampText(isoToText(row.createdAt));
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
    const ts = normalizeTimestamp(timestampText);
    if (!isValidTimestampStrict(ts)) {
      setTsError("Invalid format. Use YYYY-MM-DD HH:MM:SS");
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
        const msg = (body as ApiError).message ?? `Update failed (HTTP ${res.status})`;
        throw new Error(msg);
      }

      setAlert({ open: true, msg: `Log: ${logId} updated successfully`, severity: "success" });
      router.push("/admin/customer-log");
    } catch (e: unknown) {
      setAlert({ open: true, msg: e instanceof Error ? e.message : String(e), severity: "error" });
    }
  };

  // UI states
  if (!idParam && !loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Edit Customer Log</Typography>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Missing <b>id</b> parameter in URL (example: <code>/admin/customer-log/edit/9004</code>)
        </Alert>
        <Button variant="outlined" onClick={goBack}>Back to Customer Log</Button>
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
          Log not found (id: {idParam})
        </Alert>
        <Button variant="outlined" onClick={goBack}>Back to Customer Log</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 760, mx: "auto" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={500}>Edit Customer Log</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={goBack}>Cancel</Button>
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
          label="Timestamp (YYYY-MM-DD HH:MM:SS)"
          value={timestampText}
          onChange={(e) => setTimestampText(e.target.value)}
          onBlur={(e) => setTimestampText(normalizeTimestamp(e.target.value))}
          placeholder="2025-10-30 10:47:00"
          error={!!tsError}
          helperText={tsError || "Use 24-hour format. No timezone conversion."}
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
          <FormHelperText>Select the log action</FormHelperText>
        </FormControl>
      </Stack>
    </Box>
  );
}