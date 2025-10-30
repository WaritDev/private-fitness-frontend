"use client";

import * as React from "react";
import {
  Box, Stack, Typography, TextField, MenuItem, Button, Paper,
  FormHelperText, CircularProgress, Alert, InputAdornment, Chip
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
  productId: string;
  salesUsername: string;
  purchaseDate: string; // "YYYY-MM-DD"
  startDate: string;    // "YYYY-MM-DD"
  endDate: string;      // "YYYY-MM-DD"
  pricePaid: number;        // สตางค์
  discountAmount: number;   // สตางค์
  status: Status;
};

type ErrBody = { message?: string };

// ---------- Helpers ----------
const pad2 = (n: number) => String(n).padStart(2, "0");
const isYMD = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

// รับ "YYYY-MM-DD" หรือ ISO → คืน "YYYY-MM-DD"
const toYMD = (s?: string) => {
  if (!s) return "";
  if (isYMD(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const toDMY = (s?: string) => {
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const addDaysYMD = (ymd: string, days: number) => {
  const [y, m, d] = ymd.split("-").map((x) => parseInt(x, 10));
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

// คำนวณจำนวนวันแบบรวมปลายทาง (inclusive)
// เช่น 2025-10-11 → 2025-11-09 ได้ 30 วัน (11…09)
const diffDaysInclusive = (startYMD: string, endYMD: string) => {
  if (!isYMD(startYMD) || !isYMD(endYMD)) return undefined;
  const [ys, ms, ds] = startYMD.split("-").map(Number);
  const [ye, me, de] = endYMD.split("-").map(Number);
  const s = new Date(ys, ms - 1, ds);
  const e = new Date(ye, me - 1, de);
  const msDiff = e.getTime() - s.getTime();
  if (Number.isNaN(msDiff)) return undefined;
  // floor ต่างวัน “ระหว่าง” แล้ว +1 เพื่อรวมวันปลายทาง
  const days = Math.floor(msDiff / (1000 * 60 * 60 * 24)) + 1;
  return days > 0 ? days : undefined;
};

const isNonNegNumberStr = (v: string) => /^\d+(\.\d+)?$/.test(v) && Number(v) >= 0;

// สตางค์ -> บาท (string สำหรับ input)
const satangToBahtStr = (n?: number) =>
  typeof n === "number" && Number.isFinite(n) ? (n / 100).toString() : "";

// บาท(string) -> int บาท (ตามสเปค POST ที่คุณยกตัวอย่าง)
const bahtStrToIntBaht = (s: string) => Math.round(Number(s || "0"));

// ---------- Tiny layout components (named for ESLint) ----------
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

// ---------- Page ----------
export default function EditCustomerDurationPackagePage(): React.JSX.Element {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { setSnack } = useSnack();

  const id = params?.id || "";

  // UI state
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [globalErr, setGlobalErr] = React.useState("");

  // อ่านอย่างเดียว
  const [customerUsername, setCustomerUsername] = React.useState("");
  const [productId, setProductId] = React.useState<string>("");
  const [purchaseDate, setPurchaseDate] = React.useState("");

  // ฟอร์มแก้ไข
  const [startDate, setStartDate] = React.useState("");
  const [initialEndDate, setInitialEndDate] = React.useState(""); // จาก GET
  const [durationDays, setDurationDays] = React.useState<number | undefined>(undefined); // ← เก็บจำนวนวันรวมปลาย
  const [pricePaid, setPricePaid] = React.useState("");
  const [discountAmount, setDiscountAmount] = React.useState("");
  const [status, setStatus] = React.useState<Status>("ACTIVE");

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // ---------- Fetch one ----------
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
        setPricePaid(satangToBahtStr(row.pricePaid));
        setDiscountAmount(satangToBahtStr(row.discountAmount));
        setStatus(row.status);

        // ⏱️ คำนวณ duration_day จาก start/end ที่มาจาก BE
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

  // ---------- End_Date preview (เปลี่ยนตาม startDate โดยยึด durationDays เดิม) ----------
  const computedEndDate = React.useMemo(() => {
    if (!startDate || !isYMD(startDate) || !durationDays || durationDays <= 0) return "";
    // end = start + (durationDays - 1)
    return addDaysYMD(startDate, durationDays - 1);
  }, [startDate, durationDays]);

  // ---------- Validate ----------
  const validate = () => {
    const e: Record<string, string> = {};

    if (!startDate.trim()) e.startDate = "ห้ามว่าง";
    else if (!isYMD(startDate)) e.startDate = "รูปแบบต้องเป็น YYYY-MM-DD";

    if (pricePaid.trim() === "") e.pricePaid = "ห้ามว่าง";
    else if (!isNonNegNumberStr(pricePaid)) e.pricePaid = "ต้องเป็นตัวเลข ≥ 0";

    if (discountAmount.trim() === "") e.discountAmount = "ห้ามว่าง";
    else if (!isNonNegNumberStr(discountAmount)) e.discountAmount = "ต้องเป็นตัวเลข ≥ 0";

    if (!status) e.status = "ห้ามว่าง";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ---------- Save ----------
  const onSave = async () => {
    if (!validate()) return;
    const payload = {
      startDate,                                     // "YYYY-MM-DD"
      pricePaid: bahtStrToIntBaht(pricePaid),        // int (บาท) ตามตัวอย่างสเปค POST
      discountAmount: bahtStrToIntBaht(discountAmount), // int (บาท)
      status,
    };

    try {
      const res = await fetch(
        `${API_BASE}/api/customer-durations/${encodeURIComponent(id)}/update`,
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
      setSnack({ open: true, msg: `Duration Package ID: ${id} updated successfully`, severity: "success" });
      router.push("/admin/packages-duration");
    } catch (e: unknown) {
      setSnack({ open: true, msg: e instanceof Error ? e.message : String(e), severity: "error" });
    }
  };

  // ---------- UI ----------
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
        <Typography variant="h6" sx={{ mb: 1 }}>Edit Customer Duration Package</Typography>
        <Alert severity="error" sx={{ mb: 2 }}>ไม่พบแพ็กเกจที่ต้องการแก้ไข (ID: {id})</Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>
          กลับหน้า Customer Duration Packages
        </Button>
      </Box>
    );
  }

  const saveDisabled =
    !startDate ||
    !!errors.startDate ||
    !pricePaid ||
    !!errors.pricePaid ||
    !discountAmount ||
    !!errors.discountAmount ||
    !status;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: "auto" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={500}>
          Edit Customer Duration Package
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>
            ยกเลิก
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={onSave} disabled={saveDisabled}>
            Save
          </Button>
        </Stack>
      </Stack>

      {globalErr && <Alert severity="error" sx={{ mb: 2 }}>{globalErr}</Alert>}

      {/* ข้อมูลอ้างอิงอ่านอย่างเดียว */}
      <Paper sx={{ p: 2, borderRadius: 3, mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
          <Typography variant="body2"><b>ID:</b> {id}</Typography>
          <Chip size="small" sx={{ ml: 1 }} label={`Duration: ${durationDays ?? "—"} วัน`} />
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
              helperText={errors.startDate || (durationDays
                ? `เมื่อปรับ Start_Date ระบบจะคำนวณ End_Date ใหม่อัตโนมัติด้วย Duration = ${durationDays} วัน`
                : "รูปแบบ YYYY-MM-DD")}
            />
          </Col>
          <Col>
            <TextField
              label="End_Date (preview)"
              value={computedEndDate ? toDMY(computedEndDate) : toDMY(initialEndDate)}
              fullWidth
              InputProps={{
                  readOnly: true,
                  sx: {
                    bgcolor: "#f5f5f5",
                    pointerEvents: "none"
                  }
                }}
              helperText={
                durationDays
                  ? (computedEndDate ? `End = Start + (${durationDays} - 1)` : "—")
                  : "—"
              }
            />
          </Col>
        </Row2>

        <Row2>
          <Col>
            <TextField
              label="Price_Paid"
              value={pricePaid}
              onChange={(e) => setPricePaid(e.target.value)}
              fullWidth
              inputMode="decimal"
              InputProps={{ startAdornment: <InputAdornment position="start">THB</InputAdornment> }}
              error={!!errors.pricePaid}
              helperText={errors.pricePaid || "จำนวนเงินเป็น “บาท” (ระบบจะส่งเป็นจำนวนเต็มบาทไปยัง BE)"}
            />
          </Col>
          <Col>
            <TextField
              label="Discount_Amount"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              fullWidth
              inputMode="decimal"
              InputProps={{ startAdornment: <InputAdornment position="start">THB</InputAdornment> }}
              error={!!errors.discountAmount}
              helperText={errors.discountAmount || "ส่วนลดเป็น “บาท” (ส่งเป็นจำนวนเต็มบาท)"}
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
          <Col>
            <FormHelperText />
          </Col>
        </Row2>
      </Paper>
    </Box>
  );
}