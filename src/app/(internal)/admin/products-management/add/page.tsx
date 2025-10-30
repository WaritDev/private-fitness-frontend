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
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useSnack } from "@/components/snack/SnackProvider";

type ProductType = "DURATION" | "SESSION";
type ProductCategory = "Economy" | "Business" | "First Class";

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" } as const;

type FormState = {
  Name: string;
  Product_Type: ProductType | "";
  Product_Category: ProductCategory | "";
  List_Price: string;          // เก็บเป็น string ก่อน ค่อย parse
  Duration_Days: string;       // เฉพาะ DURATION
  Session_Amount: string;      // เฉพาะ SESSION
  Is_Active: boolean;
};

export default function AddProductPage(): React.JSX.Element {
  const router = useRouter();
  const { setSnack } = useSnack();

  const [form, setForm] = React.useState<FormState>({
    Name: "",
    Product_Type: "",
    Product_Category: "",
    List_Price: "",
    Duration_Days: "",
    Session_Amount: "",
    Is_Active: true,
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // helper
  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((s) => {
      const next = { ...s, [k]: v };
      // reset fields เมื่อเปลี่ยนประเภทสินค้า
      if (k === "Product_Type") {
        if (v === "DURATION") next.Session_Amount = "";
        if (v === "SESSION") next.Duration_Days = "";
      }
      return next;
    });
    setErrors((e) => ({ ...e, [k as string]: "" }));
  };

  // validation ตามข้อกำหนดข้อ (6)
  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!form.Name.trim()) e.Name = "ห้ามว่าง";
    if (!form.Product_Type) e.Product_Type = "เลือกประเภทสินค้า";
    if (!form.Product_Category) e.Product_Category = "เลือกหมวดหมู่";

    // List_Price: number >= 0
    const price = Number(form.List_Price);
    if (form.List_Price.trim() === "") e.List_Price = "ห้ามว่าง";
    else if (Number.isNaN(price) || price < 0) e.List_Price = "กรอกตัวเลข ≥ 0";

    // เงื่อนไขตามชนิดสินค้า
    if (form.Product_Type === "DURATION") {
      const days = Number(form.Duration_Days);
      if (form.Duration_Days.trim() === "") e.Duration_Days = "กรอกจำนวนวัน";
      else if (!Number.isInteger(days) || days <= 0)
        e.Duration_Days = "ต้องเป็นจำนวนเต็มบวก (> 0)";
      // ต้องเป็น NULL สำหรับ Session_Amount -> ในฟอร์มปล่อยว่าง
      if (form.Session_Amount.trim() !== "")
        e.Session_Amount = "ไม่ต้องกรอกสำหรับ DURATION";
    } else if (form.Product_Type === "SESSION") {
      const sess = Number(form.Session_Amount);
      if (form.Session_Amount.trim() === "") e.Session_Amount = "กรอกจำนวนครั้ง";
      else if (!Number.isInteger(sess) || sess <= 0)
        e.Session_Amount = "ต้องเป็นจำนวนเต็มบวก (> 0)";
      // ต้องเป็น NULL สำหรับ Duration_Days -> ในฟอร์มปล่อยว่าง
      if (form.Duration_Days.trim() !== "")
        e.Duration_Days = "ไม่ต้องกรอกสำหรับ SESSION";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async () => {
    if (!validate()) return;

    // จำลอง insert ตาม Q5A.A2 / Q5A.A3 (ฝั่งจริงเรียก API)
    // สร้าง Product_Id mock เพื่อแสดงใน toast
    const productId = (() => {
      const base =
        form.Product_Type === "DURATION"
          ? `DUR${form.Duration_Days || "X"}`
          : `SES${form.Session_Amount || "X"}`;
      return `${base}_${form.Product_Category?.replaceAll(" ", "").toUpperCase()}`;
    })();

    // แจ้งเตือนแบบ global ตามมาตรฐานโปรเจกต์
    setSnack({
      open: true,
      msg: `Product: ${productId} created successfully`,
      severity: "success",
    });

    // กลับหน้ารายการ (หน้า list รองรับ ?toast อยู่แล้วด้วย)
    router.push(
      `/admin/products-management?toast=${encodeURIComponent(`Product: ${productId} created successfully`)}`
    );
  };

  const onCancel = () => router.push("/admin/products-management");

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={400}>Add Product</Typography>
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
            label="Name"
            value={form.Name}
            onChange={(e) => setField("Name", e.target.value)}
            error={!!errors.Name}
            helperText={errors.Name}
            fullWidth
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Product Type"
              value={form.Product_Type}
              onChange={(e) => setField("Product_Type", e.target.value as ProductType)}
              error={!!errors.Product_Type}
              helperText={errors.Product_Type}
              fullWidth
            >
              <MenuItem value="DURATION">DURATION</MenuItem>
              <MenuItem value="SESSION">SESSION</MenuItem>
            </TextField>

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
            label="List Price (THB)"
            value={form.List_Price}
            onChange={(e) => setField("List_Price", e.target.value)}
            error={!!errors.List_Price}
            helperText={errors.List_Price || "กรอกจำนวนเงิน ≥ 0"}
            fullWidth
            inputMode="numeric"
          />

          {/* เฉพาะ DURATION */}
          {form.Product_Type === "DURATION" && (
            <TextField
              label="Duration Days"
              value={form.Duration_Days}
              onChange={(e) => setField("Duration_Days", e.target.value)}
              error={!!errors.Duration_Days}
              helperText={errors.Duration_Days || "จำนวนวันของแพ็กเกจ (เช่น 30, 90)"}
              fullWidth
              inputMode="numeric"
            />
          )}

          {/* เฉพาะ SESSION */}
          {form.Product_Type === "SESSION" && (
            <TextField
              label="Session Amount"
              value={form.Session_Amount}
              onChange={(e) => setField("Session_Amount", e.target.value)}
              error={!!errors.Session_Amount}
              helperText={errors.Session_Amount || "จำนวนครั้งของแพ็กเกจ (เช่น 6, 8, 12)"}
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
            label={form.Is_Active ? "Active" : "Inactive"}
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