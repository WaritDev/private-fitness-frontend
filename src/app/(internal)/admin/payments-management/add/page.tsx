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
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "next/navigation";
import { useSnack } from "@/components/snack/SnackProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const PRIMARY = { main: "#38E07A", dark: "#2fbb65" } as const;

// ต้องขึ้นต้น http:// หรือ https://
const RE_URL =
  /^(https?:\/\/)([\w.-]+)(:\d+)?(\/[\w.\-~:/?#[\]@!$&'()*+,;=%]*)?$/i;

type FormState = {
  Account_Name: string;
  Account_Number: string;
  Bank_Name: string;
  QR_Code_URL: string;
  Is_Active: "true" | "false";
};

type CreateBody = {
  accountName: string;
  accountNumber: string;
  bankName: string;
  qrCodeUrl: string;
  isActive: boolean;
};

export default function AddPaymentAccountPage(): React.JSX.Element {
  const router = useRouter();
  const { setSnack } = useSnack();

  const [form, setForm] = React.useState<FormState>({
    Account_Name: "",
    Account_Number: "",
    Bank_Name: "",
    QR_Code_URL: "",
    Is_Active: "true",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [globalErr, setGlobalErr] = React.useState("");

  const setField =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((s) => ({ ...s, [k]: e.target.value }));
      setErrors((prev) => ({ ...prev, [k]: "" }));
      setGlobalErr("");
    };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.Account_Name.trim()) e.Account_Name = "ห้ามว่าง";
    if (!form.Account_Number.trim()) e.Account_Number = "ห้ามว่าง";
    if (!form.Bank_Name.trim()) e.Bank_Name = "ห้ามว่าง";
    if (!form.QR_Code_URL.trim()) e.QR_Code_URL = "ห้ามว่าง";
    else if (!RE_URL.test(form.QR_Code_URL))
      e.QR_Code_URL = "รูปแบบ URL ไม่ถูกต้อง (ต้องขึ้นต้น http:// หรือ https://)";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setGlobalErr("");

    try {
      const body: CreateBody = {
        accountName: form.Account_Name.trim(),
        accountNumber: form.Account_Number.trim(),
        bankName: form.Bank_Name.trim(),
        qrCodeUrl: form.QR_Code_URL.trim(),
        isActive: form.Is_Active === "true",
      };

      const res = await fetch(`${API_BASE}/api/payments/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // พยายามอ่าน message error อย่างปลอดภัย
      if (!res.ok) {
        let msg = `สร้างบัญชีรับชำระเงินไม่สำเร็จ (HTTP ${res.status})`;
        try {
          const rb: unknown = await res.json();
          if (typeof rb === "object" && rb && "message" in rb) {
            const m = (rb as { message?: string }).message;
            if (m) msg = m;
          }
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }

      setSnack({
        open: true,
        msg: "Payment Account created successfully",
        severity: "success",
      });
      router.push("/admin/payments-management");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setGlobalErr(msg);
      setSnack({ open: true, msg, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => router.push("/admin/payments-management");

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 720, mx: "auto" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" fontWeight={400}>
          Add New Payment Account
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={onSave}
            disabled={saving}
            sx={{
              backgroundColor: PRIMARY.main,
              "&:hover": { backgroundColor: PRIMARY.dark },
            }}
          >
            {saving ? "Saving..." : "Save"}
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
            label="Account_Name"
            value={form.Account_Name}
            onChange={setField("Account_Name")}
            error={!!errors.Account_Name}
            helperText={errors.Account_Name}
            fullWidth
          />
          <TextField
            label="Account_Number"
            value={form.Account_Number}
            onChange={setField("Account_Number")}
            error={!!errors.Account_Number}
            helperText={errors.Account_Number}
            fullWidth
          />
          <TextField
            label="Bank_Name"
            value={form.Bank_Name}
            onChange={setField("Bank_Name")}
            error={!!errors.Bank_Name}
            helperText={errors.Bank_Name}
            fullWidth
          />
          <TextField
            label="QR_Code_URL"
            value={form.QR_Code_URL}
            onChange={setField("QR_Code_URL")}
            error={!!errors.QR_Code_URL}
            helperText={errors.QR_Code_URL || "เช่น https://cdn.example.com/qr/scb-main.png"}
            fullWidth
          />
          <TextField
            select
            label="Is_Active"
            value={form.Is_Active}
            onChange={setField("Is_Active")}
            fullWidth
          >
            <MenuItem value="true">true (ใช้งาน)</MenuItem>
            <MenuItem value="false">false (ปิดใช้งาน)</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={onSave}
          disabled={saving}
          sx={{
            backgroundColor: PRIMARY.main,
            "&:hover": { backgroundColor: PRIMARY.dark },
          }}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </Stack>
    </Box>
  );
}