"use client";

import * as React from "react";
import {
  Box, Stack, Typography, TextField, Button,
  MenuItem, Paper, Alert, CircularProgress
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import { useRouter, useParams } from "next/navigation";
import { useAlertPopUp } from "@/components/pop-up/AlertPopUpUI";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type Status = "ACTIVE" | "EXPIRED" | "FROZEN" | "CANCELLED";

type ApiItem = {
  id: string;
  customerUsername: string;
  trainerUsername: string | null;
  productId: string;
  salesUsername: string | null;
  purchaseDate: string;
  totalSessions: number;
  usedSessions: number;
  pricePaid: number;
  discountAmount: number;
  status: Status;
};

type ErrBody = { message?: string };

const pad2 = (n: number) => String(n).padStart(2, "0");
const toYMD = (s?: string) => {
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

// ✅ helper: ตรวจสอบรูปแบบตัวเลขทศนิยม ≤ 2 ตำแหน่ง
const isNonNegMoneyStr = (v: string) => /^\d+(\.\d{1,2})?$/.test(v.trim()) && Number(v) >= 0;

export default function EditCustomerSessionCoursePage(): React.JSX.Element {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { setAlert } = useAlertPopUp();

  const id = params?.id || "";
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [globalErr, setGlobalErr] = React.useState("");

  const [customerUsername, setCustomerUsername] = React.useState("");
  const [productId, setProductId] = React.useState("");
  const [salesUsername, setSalesUsername] = React.useState("");
  const [purchaseDate, setPurchaseDate] = React.useState("");
  const [totalSessions, setTotalSessions] = React.useState(0);
  const [usedSessions, setUsedSessions] = React.useState(0);
  const [trainerUsername, setTrainerUsername] = React.useState("");
  const [pricePaid, setPricePaid] = React.useState("");
  const [discountAmount, setDiscountAmount] = React.useState("");
  const [status, setStatus] = React.useState<Status>("ACTIVE");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

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
        setPricePaid(
          typeof row.pricePaid === "number" && Number.isFinite(row.pricePaid)
            ? row.pricePaid.toFixed(2)
            : ""
        );
        setDiscountAmount(
          typeof row.discountAmount === "number" && Number.isFinite(row.discountAmount)
            ? row.discountAmount.toFixed(2)
            : ""
        );
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

  const validate = () => {
    const e: Record<string, string> = {};
    if (!trainerUsername.trim()) e.trainerUsername = "Required";
    if (!isNonNegMoneyStr(pricePaid)) e.pricePaid = "Must be ≥ 0, up to 2 decimals";
    if (!isNonNegMoneyStr(discountAmount)) e.discountAmount = "Must be ≥ 0, up to 2 decimals";
    if (!status) e.status = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async () => {
    if (!validate()) return;

    const payload = {
      trainerUsername: trainerUsername.trim(),
      pricePaid: parseFloat(pricePaid || "0"),
      discountAmount: parseFloat(discountAmount || "0"),
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
      setAlert({
        open: true,
        msg: `Session Course ID: ${id} updated successfully`,
        severity: "success",
      });
      router.push("/admin/courses-sessions");
    } catch (e: unknown) {
      setAlert({
        open: true,
        msg: e instanceof Error ? e.message : String(e),
        severity: "error",
      });
    }
  };

  if (loading)
    return (
      <Box sx={{ p: { xs: 3, md: 4 }, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  if (notFound)
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Edit Customer Session Course
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          Record not found (ID: {id})
        </Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>
          Back
        </Button>
      </Box>
    );

  const remaining = Math.max(0, totalSessions - usedSessions);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 820, mx: "auto" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={500}>
          Edit Customer Session Course
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>
            Cancel
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={onSave}>
            Save
          </Button>
        </Stack>
      </Stack>

      {globalErr && <Alert severity="error" sx={{ mb: 2 }}>{globalErr}</Alert>}

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
            {/* ✅ Price Paid */}
            <TextField
              label="Price Paid (THB)"
              value={pricePaid}
              onChange={(e) => {
                let v = e.target.value;
                if (!/^[0-9]*\.?[0-9]*$/.test(v)) return; // allow only digits & .
                const parts = v.split(".");
                if (parts.length === 2 && parts[1].length > 2) {
                  v = parts[0] + "." + parts[1].slice(0, 2);
                }
                setPricePaid(v);
              }}
              onBlur={() => {
                const n = Number(pricePaid);
                if (Number.isFinite(n)) setPricePaid(n.toFixed(2));
              }}
              error={!!errors.pricePaid}
              helperText={errors.pricePaid || "Up to 2 decimals"}
              fullWidth
              inputMode="decimal"
            />

            {/* ✅ Discount */}
            <TextField
              label="Discount Amount (THB)"
              value={discountAmount}
              onChange={(e) => {
                let v = e.target.value;
                if (!/^[0-9]*\.?[0-9]*$/.test(v)) return;
                const parts = v.split(".");
                if (parts.length === 2 && parts[1].length > 2) {
                  v = parts[0] + "." + parts[1].slice(0, 2);
                }
                setDiscountAmount(v);
              }}
              onBlur={() => {
                const n = Number(discountAmount);
                if (Number.isFinite(n)) setDiscountAmount(n.toFixed(2));
              }}
              error={!!errors.discountAmount}
              helperText={errors.discountAmount || "Up to 2 decimals"}
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