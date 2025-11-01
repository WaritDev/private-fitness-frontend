"use client";

import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Button,
  Paper,
  Alert,
  InputAdornment,
  Chip,
  CircularProgress,
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
  productId: string;
  salesUsername: string;
  purchaseDate: string;
  startDate: string;
  endDate: string;
  pricePaid: number;
  discountAmount: number;
  status: Status;
};

type ErrBody = { message?: string };

const pad2 = (n: number) => String(n).padStart(2, "0");
const isYMD = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

const toYMD = (s?: string) => {
  if (!s) return "";
  if (isYMD(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const toDMY = (s?: string) => {
  if (!s) return "";
  if (isYMD(s)) {
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const addDaysYMD = (ymd: string, days: number) => {
  const [y, m, d] = ymd.split("-").map((x) => parseInt(x, 10));
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

const diffDaysInclusive = (startYMD: string, endYMD: string) => {
  if (!isYMD(startYMD) || !isYMD(endYMD)) return undefined;
  const [ys, ms, ds] = startYMD.split("-").map(Number);
  const [ye, me, de] = endYMD.split("-").map(Number);
  const s = new Date(ys, ms - 1, ds);
  const e = new Date(ye, me - 1, de);
  const msDiff = e.getTime() - s.getTime();
  if (Number.isNaN(msDiff)) return undefined;
  const days = Math.floor(msDiff / (1000 * 60 * 60 * 24)) + 1;
  return days > 0 ? days : undefined;
};

// ---- money helpers ----
const isNonNegMoneyStr = (v: string) => /^\d+(\.\d{1,2})?$/.test(v.trim()) && Number(v) >= 0;
const moneyNumToStr2 = (n?: number) =>
  typeof n === "number" && Number.isFinite(n) ? n.toFixed(2) : "";
const toFixed2Number = (s: string) => {
  const n = Number((s || "").trim());
  if (!Number.isFinite(n) || n < 0) return NaN;
  return Math.round(n * 100) / 100;
};

const Row2 = React.memo(function Row2({ children }: { children: React.ReactNode }) {
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
      {children}
    </Stack>
  );
});
const Col = React.memo(function Col(props: React.ComponentProps<typeof Box>) {
  return <Box sx={{ flex: 1, minWidth: { xs: "100%", md: 320 } }} {...props} />;
});

export default function EditCustomerDurationPackagePage(): React.JSX.Element {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { setAlert } = useAlertPopUp();
  const id = params?.id || "";

  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [globalErr, setGlobalErr] = React.useState("");

  const [customerUsername, setCustomerUsername] = React.useState("");
  const [productId, setProductId] = React.useState<string>("");
  const [purchaseDate, setPurchaseDate] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [initialEndDate, setInitialEndDate] = React.useState("");
  const [durationDays, setDurationDays] = React.useState<number | undefined>(undefined);

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
        const res = await fetch(`${API_BASE}/api/customer-durations/${encodeURIComponent(id)}`, {
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

        const sY = toYMD(row.startDate);
        const eY = toYMD(row.endDate);
        setCustomerUsername(row.customerUsername || "");
        setProductId(row.productId || "");
        setPurchaseDate(toYMD(row.purchaseDate));
        setStartDate(sY || toYMD(row.purchaseDate));
        setInitialEndDate(eY);
        setPricePaid(moneyNumToStr2(row.pricePaid));
        setDiscountAmount(moneyNumToStr2(row.discountAmount));
        setStatus(row.status);
        const dd = sY && eY ? diffDaysInclusive(sY, eY) : undefined;
        setDurationDays(dd);
      } catch (e: unknown) {
        setGlobalErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [id]);

  const goBack = () => router.push("/admin/packages-duration");
  const computedEndDate = React.useMemo(() => {
    if (!startDate || !isYMD(startDate) || !durationDays || durationDays <= 0) return "";
    return addDaysYMD(startDate, durationDays - 1);
  }, [startDate, durationDays]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!startDate.trim()) e.startDate = "Required";
    else if (!isYMD(startDate)) e.startDate = "Format must be YYYY-MM-DD";
    if (pricePaid.trim() === "") e.pricePaid = "Required";
    else if (!isNonNegMoneyStr(pricePaid)) e.pricePaid = "Must be ≥ 0, up to 2 decimals";
    if (discountAmount.trim() === "") e.discountAmount = "Required";
    else if (!isNonNegMoneyStr(discountAmount)) e.discountAmount = "Must be ≥ 0, up to 2 decimals";
    if (!status) e.status = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async () => {
    if (!validate()) return;
    const priceNum = toFixed2Number(pricePaid);
    const discNum = toFixed2Number(discountAmount);
    if (!Number.isFinite(priceNum)) { setErrors((e) => ({ ...e, pricePaid: "Invalid number" })); return; }
    if (!Number.isFinite(discNum)) { setErrors((e) => ({ ...e, discountAmount: "Invalid number" })); return; }

    const payload = { startDate, pricePaid: priceNum, discountAmount: discNum, status };
    try {
      const res = await fetch(`${API_BASE}/api/customer-durations/${encodeURIComponent(id)}/update`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as ErrBody;
        throw new Error(b?.message || `Update failed (HTTP ${res.status})`);
      }
      setAlert({ open: true, msg: `Duration Package ID: ${id} updated successfully`, severity: "success" });
      router.push("/admin/packages-duration");
    } catch (e: unknown) {
      setAlert({ open: true, msg: e instanceof Error ? e.message : String(e), severity: "error" });
    }
  };

  if (loading) return (
    <Box sx={{ p: { xs: 3, md: 4 }, display: "flex", justifyContent: "center" }}>
      <CircularProgress />
    </Box>
  );
  if (notFound) return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Edit Customer Duration Package</Typography>
      <Alert severity="error" sx={{ mb: 2 }}>Package not found (ID: {id})</Alert>
      <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>
        Back to Customer Duration Packages
      </Button>
    </Box>
  );

  const saveDisabled = !startDate || !!errors.startDate || !pricePaid || !!errors.pricePaid ||
                       !discountAmount || !!errors.discountAmount || !status;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: "auto" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={500}>Edit Customer Duration Package</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>Cancel</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={onSave} disabled={saveDisabled}>Save</Button>
        </Stack>
      </Stack>
      {globalErr && <Alert severity="error" sx={{ mb: 2 }}>{globalErr}</Alert>}

      <Paper sx={{ p: 2, borderRadius: 3, mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
          <Typography variant="body2"><b>ID:</b> {id}</Typography>
          <Chip size="small" sx={{ ml: 1 }} label={`Duration: ${durationDays ?? "—"} days`} />
        </Stack>
        <Typography variant="body2"><b>Customer_Username:</b> {customerUsername || "—"}</Typography>
        <Typography variant="body2"><b>Product_Id:</b> {productId || "—"}</Typography>
        <Typography variant="body2"><b>Purchase_Date:</b> {purchaseDate || "—"}</Typography>
        <Typography variant="body2"><b>Original Start_Date:</b> {startDate || "—"}</Typography>
        <Typography variant="body2"><b>Original End_Date:</b> {initialEndDate || "—"}</Typography>
      </Paper>

      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Row2>
          <Col>
            <TextField
              label="Start_Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              error={!!errors.startDate}
              helperText={errors.startDate}
            />
          </Col>
          <Col>
            <TextField
              label="End_Date (preview)"
              value={computedEndDate ? toDMY(computedEndDate) : toDMY(initialEndDate)}
              fullWidth
              InputProps={{ readOnly: true, sx: { bgcolor: "#f5f5f5", pointerEvents: "none" } }}
            />
          </Col>
        </Row2>

        {/* Price */}
        <Row2>
          <Col>
            <TextField
              label="Price_Paid"
              value={pricePaid}
              onChange={(e) => {
                let v = e.target.value;
                if (!/^[0-9]*\.?[0-9]*$/.test(v)) return; // only digits and dot
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
              fullWidth
              inputMode="decimal"
              InputProps={{ startAdornment: <InputAdornment position="start">THB</InputAdornment> }}
              error={!!errors.pricePaid}
              helperText={errors.pricePaid || "Up to 2 decimal places"}
            />
          </Col>

          {/* Discount */}
          <Col>
            <TextField
              label="Discount_Amount"
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
              fullWidth
              inputMode="decimal"
              InputProps={{ startAdornment: <InputAdornment position="start">THB</InputAdornment> }}
              error={!!errors.discountAmount}
              helperText={errors.discountAmount || "Up to 2 decimal places"}
            />
          </Col>
        </Row2>

        <Row2>
          <Col>
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
          </Col>
          <Col />
        </Row2>
      </Paper>
    </Box>
  );
}