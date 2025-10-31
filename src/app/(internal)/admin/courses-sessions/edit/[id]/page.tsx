"use client";

import * as React from "react";
import {
  Box, Stack, Typography, TextField, Button,
  MenuItem, Paper, Alert, CircularProgress
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import { useRouter, useParams } from "next/navigation";
import { useSnack } from "@/components/snack/SnackProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type Status = "ACTIVE" | "EXPIRED" | "FROZEN" | "CANCELLED";

type ApiItem = {
  id: string;
  customerUsername: string;
  trainerUsername: string;
  productId: string;
  salesUsername: string;
  purchaseDate: string; // "YYYY-MM-DD"
  totalSessions: number;
  usedSessions: number;
  pricePaid: number;      // satang
  discountAmount: number; // satang
  status: Status;
};

type ErrBody = { message?: string };

// --- helpers ---
const pad2 = (n: number) => String(n).padStart(2, "0");
const toYMD = (s?: string) => {
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
const satangToBahtStr = (satang?: number) =>
  typeof satang === "number" && Number.isFinite(satang) ? (satang / 100).toString() : "";
const isNonNegNumberStr = (v: string) =>
  v.trim() !== "" && /^\d+(\.\d+)?$/.test(v) && Number(v) >= 0;
const bahtStrToIntBaht = (s: string) => Math.round(Number(s || "0"));

export default function EditCustomerSessionCoursePage(): React.JSX.Element {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { setSnack } = useSnack();

  const id = params?.id || "";

  // UI state
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [globalErr, setGlobalErr] = React.useState("");

  // read-only info
  const [customerUsername, setCustomerUsername] = React.useState("");
  const [productId, setProductId] = React.useState("");
  const [salesUsername, setSalesUsername] = React.useState("");
  const [purchaseDate, setPurchaseDate] = React.useState("");
  const [totalSessions, setTotalSessions] = React.useState(0);
  const [usedSessions, setUsedSessions] = React.useState(0);

  // editable
  const [trainerUsername, setTrainerUsername] = React.useState("");
  const [pricePaid, setPricePaid] = React.useState("");           // baht (string)
  const [discountAmount, setDiscountAmount] = React.useState(""); // baht (string)
  const [status, setStatus] = React.useState<Status>("ACTIVE");

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // fetch one
  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!id) { setNotFound(true); setLoading(false); return; }
      setLoading(true);
      setGlobalErr("");
      try {
        const res = await fetch(`${API_BASE}/api/customer-sessions/${encodeURIComponent(id)}`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          if (res.status === 404) { setNotFound(true); return; }
          const b = (await res.json().catch(() => ({}))) as ErrBody;
          throw new Error(b?.message || `Load failed (HTTP ${res.status})`);
        }
        const row = (await res.json()) as ApiItem;
        if (cancelled) return;

        setCustomerUsername(row.customerUsername || "");
        setProductId(row.productId || "");
        setSalesUsername(row.salesUsername || "");
        setPurchaseDate(toYMD(row.purchaseDate));
        setTotalSessions(row.totalSessions ?? 0);
        setUsedSessions(row.usedSessions ?? 0);

        setTrainerUsername(row.trainerUsername || "");
        setPricePaid(satangToBahtStr(row.pricePaid));
        setDiscountAmount(satangToBahtStr(row.discountAmount));
        setStatus(row.status);
      } catch (e: unknown) {
        setGlobalErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [id]);

  const goBack = () => router.push("/admin/courses-sessions");

  // validate
  const validate = () => {
    const e: Record<string, string> = {};
    if (!trainerUsername.trim()) e.trainerUsername = "Required";
    if (!isNonNegNumberStr(pricePaid)) e.pricePaid = "Must be a number ≥ 0";
    if (!isNonNegNumberStr(discountAmount)) e.discountAmount = "Must be a number ≥ 0";
    if (!status) e.status = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // save
  const onSave = async () => {
    if (!validate()) return;

    const payload = {
      trainerUsername: trainerUsername.trim(),
      pricePaid: bahtStrToIntBaht(pricePaid),           // integer baht
      discountAmount: bahtStrToIntBaht(discountAmount), // integer baht
      status,
    };

    try {
      const res = await fetch(
        `${API_BASE}/api/customer-sessions/${encodeURIComponent(id)}/update`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as ErrBody;
        throw new Error(b?.message || `Update failed (HTTP ${res.status})`);
      }
      setSnack({ open: true, msg: `Session Course ID: ${id} updated successfully`, severity: "success" });
      router.push("/admin/courses-sessions");
    } catch (e: unknown) {
      setSnack({ open: true, msg: e instanceof Error ? e.message : String(e), severity: "error" });
    }
  };

  // render
  if (loading) {
    return (
      <Box sx={{ p: { xs: 3, md: 4 }, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }
  if (notFound) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Edit Customer Session Course</Typography>
        <Alert severity="error" sx={{ mb: 2 }}>Record not found (ID: {id})</Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>Back</Button>
      </Box>
    );
  }

  const remaining = Math.max(0, totalSessions - usedSessions);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 820, mx: "auto" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={500}>Edit Customer Session Course</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>Cancel</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={onSave}>Save</Button>
        </Stack>
      </Stack>

      {globalErr && <Alert severity="error" sx={{ mb: 2 }}>{globalErr}</Alert>}

      {/* Read-only info */}
      <Paper sx={{ p: 2, borderRadius: 3, mb: 2 }}>
        <Typography variant="body2"><b>ID:</b> {id}</Typography>
        <Typography variant="body2"><b>Customer:</b> {customerUsername || "—"}</Typography>
        <Typography variant="body2"><b>Product ID:</b> {productId || "—"}</Typography>
        <Typography variant="body2"><b>Sales:</b> {salesUsername || "—"}</Typography>
        <Typography variant="body2"><b>Purchased:</b> {toYMD(purchaseDate) || "—"}</Typography>
        <Typography variant="body2">
          <b>Total / Used / Remaining:</b> {totalSessions} / {usedSessions} / {remaining}
        </Typography>
      </Paper>

      {/* Editable fields */}
      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Stack spacing={2}>
          <TextField
            label="Trainer Username"
            value={trainerUsername}
            onChange={(e) => setTrainerUsername(e.target.value)}
            error={!!errors.trainerUsername}
            helperText={errors.trainerUsername}
            fullWidth
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Price Paid (THB)"
              value={pricePaid}
              onChange={(e) => setPricePaid(e.target.value)}
              error={!!errors.pricePaid}
              helperText={errors.pricePaid}
              fullWidth
              inputMode="decimal"
            />
            <TextField
              label="Discount Amount (THB)"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              error={!!errors.discountAmount}
              helperText={errors.discountAmount}
              fullWidth
              inputMode="decimal"
            />
          </Stack>

          <TextField
            select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            fullWidth
            error={!!errors.status}
            helperText={errors.status}
          >
            <MenuItem value="ACTIVE">ACTIVE</MenuItem>
            <MenuItem value="EXPIRED">EXPIRED</MenuItem>
            <MenuItem value="FROZEN">FROZEN</MenuItem>
            <MenuItem value="CANCELLED">CANCELLED</MenuItem>
          </TextField>
        </Stack>
      </Paper>
    </Box>
  );
}