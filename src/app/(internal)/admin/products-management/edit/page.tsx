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
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useSnack } from "@/components/snack/SnackProvider";

type ProductType = "DURATION" | "SESSION";
type ProductCategory = "Economy" | "Business" | "First Class";

type ProductRow = {
  Product_Id: string;
  Name: string;
  Product_Type: ProductType;
  Product_Category: ProductCategory;
  List_Price: number;
  Duration_Days: number | null;
  Session_Amount: number | null;
  Is_Active: boolean;
  Created_At?: string;
  Updated_At?: string;
};

// ===== MOCK (แทนผล Q5A.B2) =====
const MOCK_PRODUCTS: ProductRow[] = [
  // DURATION
  { Product_Id: "DUR30BASIC", Name: "Gym 30 Days (Basic)", Product_Type: "DURATION", Product_Category: "Economy", List_Price: 1490, Duration_Days: 30, Session_Amount: null, Is_Active: true },
  { Product_Id: "DUR90PLUS",  Name: "Gym 90 Days (Plus)",  Product_Type: "DURATION", Product_Category: "Business", List_Price: 3990, Duration_Days: 90, Session_Amount: null, Is_Active: true },
  // SESSION
  { Product_Id: "PT12",       Name: "Personal Training 12 Sessions", Product_Type: "SESSION", Product_Category: "First Class", List_Price: 8900, Duration_Days: null, Session_Amount: 12, Is_Active: true },
];

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" } as const;

export default function EditProductPage(): React.JSX.Element {
  const router = useRouter();
  const sp = useSearchParams();
  const { setSnack } = useSnack();

  const id = sp.get("id") || "";

  // หา record จาก MOCK (จำลอง Q5A.B2)
  const record = React.useMemo(
    () => MOCK_PRODUCTS.find((p) => p.Product_Id === id) ?? null,
    [id]
  );

  // ---- Hooks ทั้งหมดต้องอยู่ก่อนการ return เงื่อนไข ----
  const [form, setForm] = React.useState(() => ({
    Product_Id: record?.Product_Id || "",
    Name: record?.Name || "",
    Product_Type: (record?.Product_Type as ProductType | "") || "",
    Product_Category: (record?.Product_Category as ProductCategory | "") || "",
    List_Price: record ? String(record.List_Price) : "",
    Duration_Days: record?.Duration_Days ? String(record.Duration_Days) : "",
    Session_Amount: record?.Session_Amount ? String(record.Session_Amount) : "",
    Is_Active: record?.Is_Active ?? true,
  }));
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    // เมื่อเปลี่ยน id / record ให้ sync ฟอร์ม
    if (!record) return;
    setForm({
      Product_Id: record.Product_Id,
      Name: record.Name,
      Product_Type: record.Product_Type,
      Product_Category: record.Product_Category,
      List_Price: String(record.List_Price),
      Duration_Days: record.Duration_Days ? String(record.Duration_Days) : "",
      Session_Amount: record.Session_Amount ? String(record.Session_Amount) : "",
      Is_Active: record.Is_Active,
    });
    setErrors({});
  }, [record]);

  const setField = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k as string]: "" }));
  };

  // ตรวจสอบตามข้อ (6)
  const validate = () => {
    const e: Record<string, string> = {};

    if (!form.Name.trim()) e.Name = "ห้ามว่าง";
    if (!form.Product_Type) e.Product_Type = "ประเภทสินค้าห้ามว่าง";
    if (!form.Product_Category) e.Product_Category = "เลือกหมวดหมู่";

    // List_Price ≥ 0
    const price = Number(form.List_Price);
    if (form.List_Price.trim() === "") e.List_Price = "ห้ามว่าง";
    else if (Number.isNaN(price) || price < 0) e.List_Price = "กรอกตัวเลข ≥ 0";

    if (form.Product_Type === "DURATION") {
      const days = Number(form.Duration_Days);
      if (form.Duration_Days.trim() === "") e.Duration_Days = "กรอกจำนวนวัน";
      else if (!Number.isInteger(days) || days <= 0)
        e.Duration_Days = "ต้องเป็นจำนวนเต็มบวก (> 0)";
      if (form.Session_Amount.trim() !== "")
        e.Session_Amount = "ต้องเป็นค่าว่าง (NULL) สำหรับ DURATION";
    } else if (form.Product_Type === "SESSION") {
      const sess = Number(form.Session_Amount);
      if (form.Session_Amount.trim() === "") e.Session_Amount = "กรอกจำนวนครั้ง";
      else if (!Number.isInteger(sess) || sess <= 0)
        e.Session_Amount = "ต้องเป็นจำนวนเต็มบวก (> 0)";
      if (form.Duration_Days.trim() !== "")
        e.Duration_Days = "ต้องเป็นค่าว่าง (NULL) สำหรับ SESSION";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async () => {
    if (!validate()) return;

    // บันทึกจำลอง:
    // - ถ้าเป็น DURATION ใช้ตรรกะ Q5A.B3
    // - ถ้าเป็น SESSION  ใช้ตรรกะ Q5A.B4
    // (ฝั่งจริงเรียก API แล้วคำนวณ Updated_At = NOW())

    setSnack({
      open: true,
      msg: `Product: ${form.Product_Id} updated successfully`,
      severity: "success",
    });

    router.push(
      `/admin/products-management?toast=${encodeURIComponent(`Product: ${form.Product_Id} updated successfully`)}`
    );
  };

  const onCancel = () => router.push("/admin/products-management");

  // หลังประกาศ hooks แล้วค่อย render not-found
  if (!record) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          ไม่พบสินค้า (id = {id || "—"})
        </Alert>
        <Button variant="outlined" onClick={onCancel}>กลับหน้า Products</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={400}>
          Edit Product: {form.Product_Id}
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
          <TextField
            label="Product ID"
            value={form.Product_Id}
            InputProps={{ readOnly: true }}
            fullWidth
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Product Type"
              value={form.Product_Type}
              InputProps={{ readOnly: true }}
              helperText="ไม่สามารถแก้ไขประเภทสินค้าได้"
              fullWidth
            />
            <TextField
              select
              label="Product Category"
              value={form.Product_Category}
              onChange={(e) => setField("Product_Category", e.target.value as ProductCategory)}
              error={!!errors.Product_Category}
              helperText={errors.Product_Category}
              fullWidth
            >
              <MenuItem value="Economy">Economy</MenuItem>
              <MenuItem value="Business">Business</MenuItem>
              <MenuItem value="First Class">First Class</MenuItem>
            </TextField>
          </Stack>

          <TextField
            label="Name"
            value={form.Name}
            onChange={(e) => setField("Name", e.target.value)}
            error={!!errors.Name}
            helperText={errors.Name}
            fullWidth
          />

          <TextField
            label="List Price (THB)"
            value={form.List_Price}
            onChange={(e) => setField("List_Price", e.target.value)}
            error={!!errors.List_Price}
            helperText={errors.List_Price || "กรอกจำนวนเงิน ≥ 0"}
            fullWidth
            inputMode="numeric"
          />

          {/* เฉพาะชนิด DURATION: แก้ไข Duration_Days ได้ */}
          {form.Product_Type === "DURATION" && (
            <TextField
              label="Duration Days"
              value={form.Duration_Days}
              onChange={(e) => setField("Duration_Days", e.target.value)}
              error={!!errors.Duration_Days}
              helperText={errors.Duration_Days || "จำนวนวันของแพ็กเกจ (> 0)"}
              fullWidth
              inputMode="numeric"
            />
          )}

          {/* เฉพาะชนิด SESSION: แก้ไข Session_Amount ได้ */}
          {form.Product_Type === "SESSION" && (
            <TextField
              label="Session Amount"
              value={form.Session_Amount}
              onChange={(e) => setField("Session_Amount", e.target.value)}
              error={!!errors.Session_Amount}
              helperText={errors.Session_Amount || "จำนวนครั้งของแพ็กเกจ (> 0)"}
              fullWidth
              inputMode="numeric"
            />
          )}

          <FormControlLabel
            control={
              <Switch
                checked={form.Is_Active}
                onChange={(_, c) => setField("Is_Active", c)}
                color="success"
              />
            }
            label={form.Is_Active ? "ใช้งาน (Active)" : "ปิดใช้งาน (Inactive)"}
          />
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