"use client";

import * as React from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter, useSearchParams } from "next/navigation";
import { useSnack } from "@/components/snack/SnackProvider";

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" } as const;

// ✅ URL รูปแบบถูกต้อง (ต้องขึ้นต้น http:// หรือ https://)
const RE_URL =
  /^(https?:\/\/)([\w.-]+)(:\d+)?(\/[\w.\-~:/?#[\]@!$&'()*+,;=%]*)?$/i;

// --- MOCK: จำลองผล Q7A.1/Q7A.B2 ---
type PaymentAccount = {
  Payment_Account_Id: number;
  Account_Name: string;
  Account_Number: string;
  Bank_Name: string;
  QR_Code_URL: string;
  Is_Active: boolean;
};

const MOCK_DATA: PaymentAccount[] = [
  {
    Payment_Account_Id: 105,
    Account_Name: "Main Account",
    Account_Number: "123-4-56789-0",
    Bank_Name: "SCB",
    QR_Code_URL: "https://example.com/qr/main.png",
    Is_Active: true,
  },
  {
    Payment_Account_Id: 95,
    Account_Name: "Reserve Account",
    Account_Number: "111-2-33333-4",
    Bank_Name: "KBANK",
    QR_Code_URL: "https://example.com/qr/reserve.png",
    Is_Active: false,
  },
];

export default function EditPaymentAccountPage(): React.JSX.Element {
  const router = useRouter();
  const sp = useSearchParams();
  const { setSnack } = useSnack();

  const idParam = sp.get("id");
  const record = React.useMemo(() => {
    const idNum = Number(idParam);
    if (!idParam || Number.isNaN(idNum)) return null;
    return MOCK_DATA.find((x) => x.Payment_Account_Id === idNum) ?? null;
  }, [idParam]);

  const [form, setForm] = React.useState({
    Account_Name: record?.Account_Name ?? "",
    Account_Number: record?.Account_Number ?? "",
    Bank_Name: record?.Bank_Name ?? "",
    QR_Code_URL: record?.QR_Code_URL ?? "",
    Is_Active: (record?.Is_Active ?? true) ? "true" as "true" | "false" : "false",
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
    if (!record) {
      setSnack({ open: true, msg: "ไม่พบบัญชีที่จะทำการแก้ไข", severity: "error" });
      return;
    }
    if (!validate()) return;

    setSaving(true);
    try {
      // ✅ MOCK UPDATE (แทน Q6A.B3):
      // UPDATE "PAYMENT_ACCOUNTS" SET ... WHERE "Payment_Account_Id" = ${TargetPaymentAccountId};

      const toast = `Payment Account: ${record.Payment_Account_Id} updated successfully`;
      router.push(`/admin/payments-management?toast=${encodeURIComponent(toast)}`);
    } catch {
      setSnack({ open: true, msg: "เกิดข้อผิดพลาดในการบันทึก", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => router.push("/admin/payments-management");

  // ❗️แสดงเมื่อไม่พบ record (หลังประกาศ hooks แล้ว)
  if (!record) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 720, mx: "auto" }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          ไม่พบบัญชีที่ต้องการแก้ไข (id={idParam ?? "—"})
        </Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>
          กลับ
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 720, mx: "auto" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={400}>
          Edit Payment Account
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
            sx={{ backgroundColor: PRIMARY.main, "&:hover": { backgroundColor: PRIMARY.dark } }}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={2}>
          <TextField
            label="Payment_Account_Id"
            value={record.Payment_Account_Id}
            InputProps={{ readOnly: true }}
            fullWidth
          />
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
          sx={{ backgroundColor: PRIMARY.main, "&:hover": { backgroundColor: PRIMARY.dark } }}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </Stack>
    </Box>
  );
}