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
import { useAlertPopUp } from "@/components/pop-up/AlertPopUpUI";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type ProductType = "DURATION" | "SESSION";
type ProductCategory = "ECONOMIC" | "BUSINESS" | string;

type GetProduct = {
  id: string;
  name: string;
  type: ProductType;
  category: ProductCategory;
  listPrice: number;
  durationDays?: number;
  sessionAmount?: number;
  isActive: boolean;
  paymentAccountId: string;
  createdAt: string;
  updatedAt: string;
};

type ErrBody = { message?: string };

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" } as const;

const toDisplayPrice = (n: number): string => {
  if (!Number.isFinite(n)) return "";
  return n.toFixed(2);
};

const toPostPrice = (s: string): number => {
  const n = parseFloat(s);
  if (!Number.isFinite(n) || n < 0) return 0;
  return parseFloat(n.toFixed(2));
};

export default function EditProductPage(): React.JSX.Element {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { setAlert } = useAlertPopUp();

  const id = params?.id ?? "";

  const [loading, setLoading] = React.useState(true);
  const [globalErr, setGlobalErr] = React.useState<string>("");

  const [productId, setProductId] = React.useState<string>("");
  const [name, setName] = React.useState<string>("");
  const [type, setType] = React.useState<ProductType>("DURATION");
  const [category, setCategory] = React.useState<ProductCategory>("BUSINESS");
  const [listPriceBaht, setListPriceBaht] = React.useState<string>("");
  const [durationDays, setDurationDays] = React.useState<string>("");
  const [sessionAmount, setSessionAmount] = React.useState<string>("");
  const [isActive, setIsActive] = React.useState<boolean>(true);
  const [paymentAccountId, setPaymentAccountId] = React.useState<string>("");

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!id) {
        setGlobalErr("Missing product id in URL.");
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
          throw new Error(b?.message || `Failed to load product (HTTP ${res.status}).`);
        }
        const row = (await res.json()) as GetProduct;
        if (cancelled) return;

        setProductId(row.id);
        setName(row.name);
        setType(row.type);
        setCategory(row.category);
        setListPriceBaht(toDisplayPrice(row.listPrice)); // ✅ ใช้ฟังก์ชันใหม่
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
        setPaymentAccountId(row.paymentAccountId);
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

    if (!name.trim()) e.name = "Name is required.";
    if (!type) e.type = "Select product type.";
    if (!category) e.category = "Select product category.";

    const price = parseFloat(listPriceBaht);
    if (listPriceBaht.trim() === "") e.listPriceBaht = "List price is required.";
    else if (!Number.isFinite(price) || price < 0) e.listPriceBaht = "Enter a number ≥ 0.";
    else if (!/^\d+(\.\d{1,2})?$/.test(listPriceBaht))
      e.listPriceBaht = "Up to 2 decimal places allowed.";

    if (type === "DURATION") {
      const days = Number(durationDays);
      if (durationDays.trim() === "") e.durationDays = "Duration (days) is required.";
      else if (!Number.isInteger(days) || days <= 0) e.durationDays = "Must be a positive integer.";
      if (sessionAmount.trim() !== "") e.sessionAmount = "Leave blank for DURATION type.";
    } else {
      const sess = Number(sessionAmount);
      if (sessionAmount.trim() === "") e.sessionAmount = "Session amount is required.";
      else if (!Number.isInteger(sess) || sess <= 0) e.sessionAmount = "Must be a positive integer.";
      if (durationDays.trim() !== "") e.durationDays = "Leave blank for SESSION type.";
    }

    const payAcc = Number(paymentAccountId);
    if (paymentAccountId.trim() === "") e.paymentAccountId = "Payment Account ID is required.";
    else if (!Number.isInteger(payAcc) || payAcc <= 0) e.paymentAccountId = "Must be a positive integer.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async () => {
    if (!validate()) return;

    const payload = {
      name,
      type,
      category,
      listPrice: toPostPrice(listPriceBaht), // ✅ ส่ง float64 ที่ fix 2 ตำแหน่ง
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
        throw new Error(b?.message || `Update failed (HTTP ${res.status}).`);
      }

      const toast = `Product: ${productId} updated successfully`;
      setAlert({ open: true, msg: toast, severity: "success" });
      router.push(`/admin/products-management?toast=${encodeURIComponent(toast)}`);
    } catch (e: unknown) {
      setAlert({
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
        <Alert severity="error" sx={{ mb: 2 }}>
          {globalErr}
        </Alert>
        <Button variant="outlined" onClick={onCancel}>
          Back to Products
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={400}>
          Edit Product: {productId || "—"}
        </Typography>
      </Stack>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={2}>
          <TextField label="Product ID" value={productId} InputProps={{ readOnly: true }} fullWidth />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Product Type"
              value={type}
              onChange={(e) => setType(e.target.value as ProductType)}
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

          {/* ✅ ราคาทศนิยม 2 ตำแหน่ง จำกัดไม่ให้พิมพ์เกิน */}
          <TextField
            label="List Price (baht)"
            value={listPriceBaht}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*\.?\d{0,2}$/.test(val)) { // ✅ regex จำกัดทศนิยมไม่เกิน 2
                setListPriceBaht(val);
              }
            }}
            onBlur={() => setListPriceBaht(toDisplayPrice(toPostPrice(listPriceBaht)))}
            error={!!errors.listPriceBaht}
            helperText={errors.listPriceBaht || "Enter an amount ≥ 0 (up to 2 decimals)."}
            fullWidth
            inputMode="decimal"
          />

          {type === "DURATION" && (
            <TextField
              label="Duration (days)"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              error={!!errors.durationDays}
              helperText={errors.durationDays || "Positive integer (> 0)."}
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
              helperText={errors.sessionAmount || "Positive integer (> 0)."}
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
              control={<Switch checked={isActive} onChange={(_, c) => setIsActive(c)} color="success" />}
              label={isActive ? "Active" : "Inactive"}
            />
          </Stack>
        </Stack>
      </Paper>

      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}>
        <Button onClick={onCancel}>Cancel</Button>
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