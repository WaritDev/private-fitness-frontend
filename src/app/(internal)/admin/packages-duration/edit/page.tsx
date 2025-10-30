"use client";

import * as React from "react";
import {
  Box, Stack, Typography, TextField, MenuItem, Button, Paper, FormHelperText
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import { useRouter, useSearchParams } from "next/navigation";
import { useSnack } from "@/components/snack/SnackProvider";

type Status = "ACTIVE" | "EXPIRED" | "FROZEN" | "CANCELLED";

type DurationRow = {
  Duration_Id: number;
  Customer_Username: string;
  Product_Id: string;
  Sales_Username: string;
  Purchase_Date: string; // ISO "YYYY-MM-DD"
  Start_Date: string;    // ISO "YYYY-MM-DD"
  End_Date: string;      // ISO "YYYY-MM-DD"
  Price_Paid: number;
  Discount_Amount: number;
  Status: Status;
};

type ProductRow = {
  Product_Id: string;
  Name: string;
  Product_Type: "DURATION" | "SESSION";
  Product_Category: string;
  Duration_Days: number | null;
  Is_Active: boolean;
};

// --- MOCKs สำหรับ Q3A.A2 / Q3A.A3 ---
const MOCK_DURATION: Record<number, DurationRow> = {
  2035: {
    Duration_Id: 2035,
    Customer_Username: "c.noon",
    Product_Id: "P1",
    Sales_Username: "pam.s",
    Purchase_Date: "2025-10-20",
    Start_Date: "2025-10-21",
    End_Date: "2025-11-19",
    Price_Paid: 1990,
    Discount_Amount: 0,
    Status: "ACTIVE",
  },
  2100: {
    Duration_Id: 2100,
    Customer_Username: "c.ploy",
    Product_Id: "P2",
    Sales_Username: "bob.c",
    Purchase_Date: "2025-10-05",
    Start_Date: "2025-10-06",
    End_Date: "2025-11-04",
    Price_Paid: 2590,
    Discount_Amount: 100,
    Status: "EXPIRED",
  },
};

const MOCK_PRODUCTS: Record<string, ProductRow> = {
  P1: { Product_Id: "P1", Name: "Gym 30 Days", Product_Type: "DURATION", Product_Category: "GYM", Duration_Days: 30, Is_Active: true },
  P2: { Product_Id: "P2", Name: "Yoga 30 Days", Product_Type: "DURATION", Product_Category: "YOGA", Duration_Days: 30, Is_Active: true },
  P3: { Product_Id: "P3", Name: "PT 12 Sessions", Product_Type: "SESSION", Product_Category: "PT", Duration_Days: null, Is_Active: true },
};

// --- Helpers ---
const pad2 = (n: number) => n.toString().padStart(2, "0");
const toYMD = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map((x) => parseInt(x, 10));
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toYMD(date);
}

const RE_YMD = /^\d{4}-\d{2}-\d{2}$/;
const isNonNegNumber = (v: string) => /^\d+(\.\d+)?$/.test(v) && Number(v) >= 0;

export default function EditCustomerDurationPackagePage(): React.JSX.Element {
  const router = useRouter();
  const sp = useSearchParams();
  const { setSnack } = useSnack();

  const idParam = sp.get("id");
  const durationRow: DurationRow | null = React.useMemo(() => {
    const idNum = Number(idParam);
    if (!idParam || Number.isNaN(idNum)) return null;
    return MOCK_DURATION[idNum] ?? null; // Q3A.A2 (mock)
  }, [idParam]);

  // ---- Form states (ประกาศก่อน return เสมอ) ----
  const [startDate, setStartDate] = React.useState<string>(durationRow?.Start_Date || "");
  const [pricePaid, setPricePaid] = React.useState<string>(durationRow ? String(durationRow.Price_Paid) : "");
  const [discountAmt, setDiscountAmt] = React.useState<string>(durationRow ? String(durationRow.Discount_Amount) : "");
  const [status, setStatus] = React.useState<Status>(durationRow?.Status || "ACTIVE");

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // ---- Not found view (ปลอดภัยกับ hooks) ----
  if (!durationRow) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Edit Customer Duration Package</Typography>
        <Typography color="text.secondary">ไม่พบแพ็กเกจที่ต้องการแก้ไข</Typography>
        <Button sx={{ mt: 2 }} onClick={() => router.push("/admin/packages-duration")}>
          กลับหน้า Customer Duration Packages
        </Button>
      </Box>
    );
  }

  const product = MOCK_PRODUCTS[durationRow.Product_Id]; // Q3A.A3 (mock)

  const validate = () => {
    const e: Record<string, string> = {};

    // Start_Date
    if (!startDate.trim()) e.Start_Date = "ห้ามว่าง";
    else if (!RE_YMD.test(startDate)) e.Start_Date = "รูปแบบต้องเป็น YYYY-MM-DD";

    // Price_Paid
    if (pricePaid.trim() === "") e.Price_Paid = "ห้ามว่าง";
    else if (!isNonNegNumber(pricePaid)) e.Price_Paid = "ต้องเป็นตัวเลข ≥ 0";

    // Discount_Amount
    if (discountAmt.trim() === "") e.Discount_Amount = "ห้ามว่าง";
    else if (!isNonNegNumber(discountAmt)) e.Discount_Amount = "ต้องเป็นตัวเลข ≥ 0";

    // Status
    if (!status) e.Status = "ห้ามว่าง";

    // ตรวจ Q3A.A3: PRODUCTS.Duration_Days ต้องไม่เป็น NULL และ > 0, Product_Type='DURATION', Is_Active=TRUE
    if (!product) {
      e.Product = "ไม่พบสินค้าอ้างอิง";
    } else {
      if (product.Product_Type !== "DURATION") e.Product = "สินค้าไม่ใช่แบบ DURATION";
      if (!product.Is_Active) e.Product = "สินค้าไม่ได้ Active";
      if (product.Duration_Days == null || product.Duration_Days <= 0) e.Product = "Duration_Days ต้อง > 0";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = () => {
    if (!validate()) return;

    // Q3A.A4: คำนวณ End_Date = Start_Date + (Duration_Days - 1)
    const durationDays = product.Duration_Days as number; // ผ่าน validate แล้ว
    const endDate = addDays(startDate, durationDays - 1);

    // (mock) UPDATE ... SET ... WHERE Duration_Id = ${id}
    // เสร็จแล้วแสดง snack และกลับหน้า list
    setSnack({
      open: true,
      msg: `Duration Package ID: ${durationRow.Duration_Id} updated successfully`,
      severity: "success",
    });
    router.push("/admin/packages-duration");
  };

  const onCancel = () => router.push("/admin/packages-duration");

  // helper rows
  const Row2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
      {children}
    </Stack>
  );
  const Col: React.FC<React.ComponentProps<typeof Box>> = (props) => (
    <Box sx={{ flex: 1, minWidth: { xs: "100%", md: 320 } }} {...props} />
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: "auto" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={500}>
          Edit Customer Duration Package
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onCancel}>
            ยกเลิก
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={onSave}>
            Save
          </Button>
        </Stack>
      </Stack>

      {/* แสดงข้อมูลอ่านอย่างเดียวเพื่ออ้างอิง */}
      <Paper sx={{ p: 2, borderRadius: 3, mb: 2 }}>
        <Typography variant="body2"><b>Duration_Id:</b> {durationRow.Duration_Id}</Typography>
        <Typography variant="body2"><b>Customer_Username:</b> {durationRow.Customer_Username}</Typography>
        <Typography variant="body2"><b>Product_Id:</b> {durationRow.Product_Id}</Typography>
        <Typography variant="body2"><b>Sales_Username:</b> {durationRow.Sales_Username}</Typography>
        <Typography variant="body2"><b>Purchase_Date:</b> {durationRow.Purchase_Date}</Typography>
      </Paper>

      <Paper sx={{ p: 2, borderRadius: 3 }}>
        {/* Start_Date */}
        <Row2>
          <Col>
            <TextField
              label="Start_Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              error={!!errors.Start_Date}
              helperText={errors.Start_Date || "รูปแบบ YYYY-MM-DD"}
            />
          </Col>
          <Col />
        </Row2>

        {/* Price / Discount */}
        <Row2>
          <Col>
            <TextField
              label="Price_Paid"
              value={pricePaid}
              onChange={(e) => setPricePaid(e.target.value)}
              fullWidth
              inputMode="decimal"
              error={!!errors.Price_Paid}
              helperText={errors.Price_Paid}
            />
          </Col>
          <Col>
            <TextField
              label="Discount_Amount"
              value={discountAmt}
              onChange={(e) => setDiscountAmt(e.target.value)}
              fullWidth
              inputMode="decimal"
              error={!!errors.Discount_Amount}
              helperText={errors.Discount_Amount}
            />
          </Col>
        </Row2>

        {/* Status */}
        <Row2>
          <Col>
            <TextField
              select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              fullWidth
              error={!!errors.Status}
              helperText={errors.Status}
            >
              <MenuItem value="ACTIVE">ACTIVE</MenuItem>
              <MenuItem value="EXPIRED">EXPIRED</MenuItem>
              <MenuItem value="FROZEN">FROZEN</MenuItem>
              <MenuItem value="CANCELLED">CANCELLED</MenuItem>
            </TextField>
          </Col>
          <Col>
            {/* แสดงผลการตรวจ Q3A.A3 (ถ้ามี error) */}
            {errors.Product && <FormHelperText error>{errors.Product}</FormHelperText>}
          </Col>
        </Row2>
      </Paper>
    </Box>
  );
}