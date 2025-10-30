"use client";

import * as React from "react";
import {
  Container,
  Paper,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Button,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import { useSnack } from "@/components/snack/SnackProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type ProductType = "DURATION" | "SESSION";
// BE ส่ง category เป็น UPPERCASE ("ECONOMIC" | "BUSINESS" ...)
// เปิดให้ string เพื่อกันแตก หากมีหมวดใหม่
type ProductCategory = "ECONOMIC" | "BUSINESS" | string;

type GetProduct = {
  id: string;                // "12"
  name: string;              // "Yoga Sessions - 20 Pack"
  type: ProductType;         // "SESSION" | "DURATION"
  category: ProductCategory; // "BUSINESS" | "ECONOMIC" | ...
  listPrice: number;         // อาจเป็น "บาท" หรือ "สตางค์" ตามระบบ (ดู helper ด้านล่าง)
  durationDays?: number;     // DURATION เท่านั้น
  sessionAmount?: number;    // SESSION เท่านั้น
  isActive: boolean;
  paymentAccountId: string;  // "2"
  createdAt: string;
  updatedAt: string;
};

type ErrBody = { message?: string };

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" } as const;

// --- Helpers ---
// เดา unit ของ listPrice จาก GET: ถ้าค่า >= 10000 ให้ตีเป็น "สตางค์" → แปลงเป็นบาทแสดงใน UI
const toDisplayBaht = (n: number): string => {
  if (!Number.isFinite(n)) return "";
  const asBaht = n >= 10000 ? n / 100 : n;
  return String(asBaht);
};

// แปลงกลับเป็น "บาท" สำหรับ payload POST (ตามตัวอย่างโจทย์ POST ใช้บาท 5000)
const toPostBahtNumber = (s: string): number => {
  const n = Number(s);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
};

export default function EditProductPage(): React.JSX.Element {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { setSnack } = useSnack();

  const id = params?.id ?? "";

  // load state
  const [loading, setLoading] = React.useState(true);
  const [globalErr, setGlobalErr] = React.useState<string>("");

  // form state
  const [productId, setProductId] = React.useState<string>("");
  const [name, setName] = React.useState<string>("");
  const [type, setType] = React.useState<ProductType>("DURATION");
  const [category, setCategory] = React.useState<ProductCategory>("BUSINESS");
  const [listPriceBaht, setListPriceBaht] = React.useState<string>(""); // แสดง-กรอกเป็น "บาท"
  const [durationDays, setDurationDays] = React.useState<string>("");
  const [sessionAmount, setSessionAmount] = React.useState<string>("");
  const [isActive, setIsActive] = React.useState<boolean>(true);
  const [paymentAccountId, setPaymentAccountId] = React.useState<string>("");

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // fetch one
  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!id) {
        setGlobalErr("ไม่พบพารามิเตอร์ id");
        setLoading(false);
        return;
      }
      setLoading(true);
      setGlobalErr("");
      try {
        const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(id)}`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          const b = (await res.json().catch(() => ({}))) as ErrBody;
          throw new Error(b?.message || `โหลดข้อมูลล้มเหลว (HTTP ${res.status})`);
        }
        const row = (await res.json()) as GetProduct;
        if (cancelled) return;

        // map -> form
        setProductId(row.id);
        setName(row.name);
        setType(row.type);
        setCategory(row.category);
        setListPriceBaht(toDisplayBaht(row.listPrice));
        setDurationDays(
          typeof row.durationDays === "number" && Number.isFinite(row.durationDays)
            ? String(row.durationDays)
            : ""
        );
        setSessionAmount(
          typeof row.sessionAmount === "number" && Number.isFinite(row.sessionAmount)
            ? String(row.sessionAmount)
            : ""
        );
        setIsActive(row.isActive);
        setPaymentAccountId(row.paymentAccountId); // "2"
      } catch (e: unknown) {
        setGlobalErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // switching type → clear invalid field
  React.useEffect(() => {
    setErrors((prev) => ({ ...prev, durationDays: "", sessionAmount: "" }));
    if (type === "DURATION") {
      setSessionAmount("");
    } else {
      setDurationDays("");
    }
  }, [type]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!name.trim()) e.name = "ห้ามว่าง";
    if (!type) e.type = "เลือกประเภทสินค้า";
    if (!category) e.category = "เลือกหมวดสินค้า";

    // listPrice ≥ 0 (บาท)
    const price = Number(listPriceBaht);
    if (listPriceBaht.trim() === "") e.listPriceBaht = "ห้ามว่าง";
    else if (!Number.isFinite(price) || price < 0) e.listPriceBaht = "กรอกจำนวนเงิน ≥ 0";

    if (type === "DURATION") {
      const days = Number(durationDays);
      if (durationDays.trim() === "") e.durationDays = "กรอกจำนวนวัน";
      else if (!Number.isInteger(days) || days <= 0) e.durationDays = "ต้องเป็นจำนวนเต็มบวก (> 0)";
      if (sessionAmount.trim() !== "") e.sessionAmount = "ต้องเว้นว่างสำหรับ DURATION";
    } else {
      const sess = Number(sessionAmount);
      if (sessionAmount.trim() === "") e.sessionAmount = "กรอกจำนวนครั้ง";
      else if (!Number.isInteger(sess) || sess <= 0) e.sessionAmount = "ต้องเป็นจำนวนเต็มบวก (> 0)";
      if (durationDays.trim() !== "") e.durationDays = "ต้องเว้นว่างสำหรับ SESSION";
    }

    // paymentAccountId ต้องเป็นเลข
    const payAcc = Number(paymentAccountId);
    if (paymentAccountId.trim() === "") e.paymentAccountId = "ห้ามว่าง";
    else if (!Number.isInteger(payAcc) || payAcc <= 0) e.paymentAccountId = "ต้องเป็นจำนวนเต็มบวก";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async () => {
    if (!validate()) return;

    const payload = {
      name,
      type,
      category,
      listPrice: toPostBahtNumber(listPriceBaht), // ✅ POST ใช้ "บาท" ตามตัวอย่าง (5000)
      durationDays: type === "DURATION" ? Number(durationDays) : undefined,
      sessionAmount: type === "SESSION" ? Number(sessionAmount) : undefined,
      isActive,
      paymentAccountId: Number(paymentAccountId),
    };

    try {
      const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(productId)}/update`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as ErrBody;
        throw new Error(b?.message || `Update failed (HTTP ${res.status})`);
      }

      setSnack({
        open: true,
        msg: `Product: ${productId} updated successfully`,
        severity: "success",
      });
      router.push(
        `/admin/products-management?toast=${encodeURIComponent(`Product: ${productId} updated successfully`)}`
      );
    } catch (e: unknown) {
      setSnack({
        open: true,
        msg: e instanceof Error ? e.message : String(e),
        severity: "error",
      });
    }
  };

  const onCancel = () => router.push("/admin/products-management");

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
          <CircularProgress />
        </Stack>
      </Container>
    );
  }

  if (globalErr) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{globalErr}</Alert>
        <Button variant="outlined" onClick={onCancel}>กลับหน้า Products</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={400}>
          Edit Product: {productId || "—"}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button onClick={onCancel}>ยกเลิก</Button>
          <Button
            variant="contained"
            onClick={onSave}
            sx={{ backgroundColor: PRIMARY.main, "&:hover": { backgroundColor: PRIMARY.dark } }}
          >
            Save
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={2}>
          <TextField label="Product ID" value={productId} InputProps={{ readOnly: true }} fullWidth />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Product Type"
              value={type}
              onChange={(e) => { setType(e.target.value as ProductType); }}
              error={!!errors.type}
              helperText={errors.type}
              fullWidth
            >
              <MenuItem value="DURATION">DURATION</MenuItem>
              <MenuItem value="SESSION">SESSION</MenuItem>
            </TextField>

            <TextField
              select
              label="Product Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
              error={!!errors.category}
              helperText={errors.category}
              fullWidth
            >
              <MenuItem value="ECONOMIC">ECONOMIC</MenuItem>
              <MenuItem value="BUSINESS">BUSINESS</MenuItem>
            </TextField>
          </Stack>

          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
          />

          <TextField
            label="List Price (บาท)"
            value={listPriceBaht}
            onChange={(e) => setListPriceBaht(e.target.value)}
            error={!!errors.listPriceBaht}
            helperText={errors.listPriceBaht || "กรอกจำนวนเงิน ≥ 0 (หน่วยบาท)"}
            fullWidth
            inputMode="numeric"
          />

          {type === "DURATION" && (
            <TextField
              label="Duration Days"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              error={!!errors.durationDays}
              helperText={errors.durationDays || "จำนวนวันของแพ็กเกจ (> 0)"}
              fullWidth
              inputMode="numeric"
            />
          )}

          {type === "SESSION" && (
            <TextField
              label="Session Amount"
              value={sessionAmount}
              onChange={(e) => setSessionAmount(e.target.value)}
              error={!!errors.sessionAmount}
              helperText={errors.sessionAmount || "จำนวนครั้งของแพ็กเกจ (> 0)"}
              fullWidth
              inputMode="numeric"
            />
          )}

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Payment Account ID"
              value={paymentAccountId}
              onChange={(e) => setPaymentAccountId(e.target.value)}
              error={!!errors.paymentAccountId}
              helperText={errors.paymentAccountId}
              fullWidth
              inputMode="numeric"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={isActive}
                  onChange={(_, c) => setIsActive(c)}
                  color="success"
                />
              }
              label={isActive ? "ใช้งาน (Active)" : "ปิดใช้งาน (Inactive)"}
            />
          </Stack>
        </Stack>
      </Paper>

      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}>
        <Button onClick={onCancel}>ยกเลิก</Button>
        <Button
          variant="contained"
          onClick={onSave}
          sx={{ backgroundColor: PRIMARY.main, "&:hover": { backgroundColor: PRIMARY.dark } }}
        >
          Save
        </Button>
      </Stack>
    </Container>
  );
}