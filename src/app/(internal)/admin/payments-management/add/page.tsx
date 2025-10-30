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
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "next/navigation";
import { useSnack } from "@/components/snack/SnackProvider";

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" } as const;

const RE_URL =
  /^(https?:\/\/)([\w.-]+)(:\d+)?(\/[\w.\-~:/?#[\]@!$&'()*+,;=%]*)?$/i;

export default function AddPaymentAccountPage(): React.JSX.Element {
  const router = useRouter();
  const { setSnack } = useSnack();

  const [form, setForm] = React.useState({
    Account_Name: "",
    Account_Number: "",
    Bank_Name: "",
    QR_Code_URL: "",
    Is_Active: "true" as "true" | "false", // dropdown ตามโจทย์
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  const setField =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((s) => ({ ...s, [k]: e.target.value }));
      setErrors((prev) => ({ ...prev, [k]: "" }));
    };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.Account_Name.trim()) e.Account_Name = "ห้ามว่าง";
    if (!form.Account_Number.trim()) e.Account_Number = "ห้ามว่าง";
    if (!form.Bank_Name.trim()) e.Bank_Name = "ห้ามว่าง";
    if (!form.QR_Code_URL.trim()) e.QR_Code_URL = "ห้ามว่าง";
    else if (!RE_URL.test(form.QR_Code_URL))
      e.QR_Code_URL = "รูปแบบ URL ไม่ถูกต้อง (ต้องขึ้นต้นด้วย http:// หรือ https://)";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      // --- MOCK INSERT (แทน Q7A.A2) ---
      // สร้างไอดีจำลอง
      const newId = Math.floor(1000 + Math.random() * 90000);

      // ปกติจะ call API ที่ทำ INSERT ตาม Q7A.A2:
      // INSERT INTO "PAYMENT_ACCOUNTS" ("Account_Name","Account_Number","Bank_Name","QR_Code_URL","Is_Active")
      // VALUES (${...});
      // แล้ว backend จะคืน Payment_Account_Id กลับมา

      // แสดง toast หลังกลับหน้า list
      const toast = `Payment Account: ${newId} created successfully`;
      router.push(`/admin/payments-management?toast=${encodeURIComponent(toast)}`);
    } catch {
      setSnack({
        open: true,
        msg: "เกิดข้อผิดพลาดระหว่างบันทึกข้อมูล",
        severity: "error",
      });
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
          Add New Payment Accounts
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
            helperText={errors.QR_Code_URL || "เช่น https://example.com/qr.png"}
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