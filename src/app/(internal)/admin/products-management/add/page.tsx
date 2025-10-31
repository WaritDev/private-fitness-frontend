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
import { useRouter } from "next/navigation";
import { useAlertPopUp } from "@/components/pop-up/AlertPopUpUI";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type ProductType = "DURATION" | "SESSION";
type ProductCategory = "Economy" | "Business" | "First Class";

type ErrBody = { message?: string };

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" } as const;

type FormState = {
  name: string;
  productType: ProductType | "";
  productCategory: ProductCategory | "";
  listPrice: string;
  durationDays: string;
  sessionAmount: string;
  isActive: boolean;
  paymentAccountId: string;
};

export default function AddProductPage(): React.JSX.Element {
  const router = useRouter();
  const { setAlert } = useAlertPopUp();

  const [form, setForm] = React.useState<FormState>({
    name: "",
    productType: "",
    productCategory: "",
    listPrice: "",
    durationDays: "",
    sessionAmount: "",
    isActive: true,
    paymentAccountId: "",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [globalErr, setGlobalErr] = React.useState("");

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((s) => {
      const next = { ...s, [k]: v };
      if (k === "productType") {
        if (v === "DURATION") next.sessionAmount = "";
        if (v === "SESSION") next.durationDays = "";
      }
      return next;
    });
    setErrors((e) => ({ ...e, [k as string]: "" }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.productType) e.productType = "Select a product type.";
    if (!form.productCategory) e.productCategory = "Select a product category.";

    const priceNum = Number(form.listPrice);
    if (form.listPrice.trim() === "") e.listPrice = "List price is required.";
    else if (!Number.isFinite(priceNum) || priceNum < 0) e.listPrice = "Enter a number ≥ 0.";

    const payAcc = Number(form.paymentAccountId);
    if (form.paymentAccountId.trim() === "") e.paymentAccountId = "Payment Account ID is required.";
    else if (!Number.isInteger(payAcc) || payAcc <= 0) e.paymentAccountId = "Must be a positive integer.";

    if (form.productType === "DURATION") {
      const days = Number(form.durationDays);
      if (form.durationDays.trim() === "") e.durationDays = "Duration (days) is required.";
      else if (!Number.isInteger(days) || days <= 0) e.durationDays = "Must be a positive integer (> 0).";
      if (form.sessionAmount.trim() !== "") e.sessionAmount = "Leave blank for DURATION type.";
    } else if (form.productType === "SESSION") {
      const sess = Number(form.sessionAmount);
      if (form.sessionAmount.trim() === "") e.sessionAmount = "Session amount is required.";
      else if (!Number.isInteger(sess) || sess <= 0) e.sessionAmount = "Must be a positive integer (> 0).";
      if (form.durationDays.trim() !== "") e.durationDays = "Leave blank for SESSION type.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async () => {
    if (!validate()) return;

    const payload: {
      name: string;
      productType: ProductType;
      productCategory: ProductCategory | string;
      listPrice: number;
      durationDays?: number;
      sessionAmount?: number;
      isActive: boolean;
      paymentAccountId: number;
    } = {
      name: form.name.trim(),
      productType: form.productType as ProductType,
      productCategory: form.productCategory as ProductCategory,
      listPrice: Math.round(Number(form.listPrice)),
      isActive: form.isActive,
      paymentAccountId: Number(form.paymentAccountId),
    };
    if (form.productType === "DURATION") {
      payload.durationDays = Number(form.durationDays);
    } else if (form.productType === "SESSION") {
      payload.sessionAmount = Number(form.sessionAmount);
    }

    setSubmitting(true);
    setGlobalErr("");
    try {
      const res = await fetch(`${API_BASE}/api/products/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as ErrBody;
        throw new Error(b?.message || `Create failed (HTTP ${res.status}).`);
      }

      setAlert({ open: true, msg: "Product created successfully", severity: "success" });
      router.push(`/admin/products-management?toast=${encodeURIComponent("Product created successfully")}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setGlobalErr(msg);
      setAlert({ open: true, msg, severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const onCancel = () => router.push("/admin/products-management");

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={400}>Add Product</Typography>
        <Stack direction="row" spacing={1}>
          <Button onClick={onCancel} disabled={submitting}>Cancel</Button>
          <Button
            variant="contained"
            onClick={onSave}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} /> : undefined}
            sx={{ backgroundColor: PRIMARY.main, "&:hover": { backgroundColor: PRIMARY.dark } }}
          >
            {submitting ? "Saving..." : "Save"}
          </Button>
        </Stack>
      </Stack>

      {globalErr && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {globalErr}
        </Alert>
      )}

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={2}>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Product Type"
              value={form.productType}
              onChange={(e) => setField("productType", e.target.value as ProductType)}
              error={!!errors.productType}
              helperText={errors.productType}
              fullWidth
            >
              <MenuItem value="DURATION">DURATION</MenuItem>
              <MenuItem value="SESSION">SESSION</MenuItem>
            </TextField>

            <TextField
              select
              label="Product Category"
              value={form.productCategory}
              onChange={(e) => setField("productCategory", e.target.value as ProductCategory)}
              error={!!errors.productCategory}
              helperText={errors.productCategory}
              fullWidth
            >
              <MenuItem value="Economy">Economy</MenuItem>
              <MenuItem value="Business">Business</MenuItem>
              <MenuItem value="First Class">First Class</MenuItem>
            </TextField>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="List Price (baht)"
              value={form.listPrice}
              onChange={(e) => setField("listPrice", e.target.value)}
              error={!!errors.listPrice}
              helperText={errors.listPrice || "Enter an amount ≥ 0"}
              fullWidth
              inputMode="numeric"
            />
            <TextField
              label="Payment Account ID"
              value={form.paymentAccountId}
              onChange={(e) => setField("paymentAccountId", e.target.value)}
              error={!!errors.paymentAccountId}
              helperText={errors.paymentAccountId || "e.g. 1 or 2"}
              fullWidth
              inputMode="numeric"
            />
          </Stack>

          {form.productType === "DURATION" && (
            <TextField
              label="Duration (days)"
              value={form.durationDays}
              onChange={(e) => setField("durationDays", e.target.value)}
              error={!!errors.durationDays}
              helperText={errors.durationDays || "Positive integer (> 0)"}
              fullWidth
              inputMode="numeric"
            />
          )}

          {form.productType === "SESSION" && (
            <TextField
              label="Session Amount"
              value={form.sessionAmount}
              onChange={(e) => setField("sessionAmount", e.target.value)}
              error={!!errors.sessionAmount}
              helperText={errors.sessionAmount || "Positive integer (> 0)"}
              fullWidth
              inputMode="numeric"
            />
          )}

          <FormControlLabel
            control={
              <Switch
                checked={form.isActive}
                onChange={(_, c) => setField("isActive", c)}
                color="success"
              />
            }
            label={form.isActive ? "Active" : "Inactive"}
          />
        </Stack>
      </Paper>

      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}>
        <Button onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={18} /> : undefined}
          sx={{ backgroundColor: PRIMARY.main, "&:hover": { backgroundColor: PRIMARY.dark } }}
        >
          {submitting ? "Saving..." : "Save"}
        </Button>
      </Stack>
    </Container>
  );
}