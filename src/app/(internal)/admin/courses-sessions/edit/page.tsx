"use client";

import * as React from "react";
import {
  Box, Stack, Typography, TextField, Button,
  MenuItem, Paper, FormControl, InputLabel, Select, FormHelperText
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import { useRouter, useSearchParams } from "next/navigation";
import { useSnack } from "@/components/snack/SnackProvider";

type Status = "ACTIVE" | "EXPIRED" | "FROZEN" | "CANCELLED";

type SessionCourse = {
  Session_Id: number;
  Customer_Username: string;
  Customer_First_Name: string;
  Customer_Last_Name: string;
  Trainer_Username: string;
  Product_Id: string;
  Product_Name: string;
  Total_Sessions: number;
  Used_Sessions: number;
  Price_Paid: number;
  Discount_Amount: number;
  Status: Status;
  Purchase_Date: string; // YYYY-MM-DD
  Sales_Username: string;
};

// === MOCK: จำลองผล Q4A.A2 และรายการเทรนเนอร์เพื่อตรวจสอบ Q4A.A3 ===
const TRAINERS: Array<{ username: string; firstName: string; lastName: string }> = [
  { username: "krit.t", firstName: "Krit", lastName: "Tana" },
  { username: "alice.b", firstName: "Alice", lastName: "Brown" },
  { username: "mark.l", firstName: "Mark", lastName: "Lee" },
];

const MOCK_SESSIONS: SessionCourse[] = [
  {
    Session_Id: 5012,
    Customer_Username: "c.noon",
    Customer_First_Name: "Noon",
    Customer_Last_Name: "Nita",
    Trainer_Username: "krit.t",
    Product_Id: "PT12",
    Product_Name: "PT 12 Sessions",
    Total_Sessions: 12,
    Used_Sessions: 3,
    Price_Paid: 8900,
    Discount_Amount: 500,
    Status: "ACTIVE",
    Purchase_Date: "2025-10-20",
    Sales_Username: "pam.s",
  },
  {
    Session_Id: 5011,
    Customer_Username: "c.ploy",
    Customer_First_Name: "Ploy",
    Customer_Last_Name: "Kawin",
    Trainer_Username: "alice.b",
    Product_Id: "YOGA8",
    Product_Name: "Yoga 8 Sessions",
    Total_Sessions: 8,
    Used_Sessions: 8,
    Price_Paid: 4200,
    Discount_Amount: 0,
    Status: "EXPIRED",
    Purchase_Date: "2025-10-15",
    Sales_Username: "bob.c",
  },
  {
    Session_Id: 5010,
    Customer_Username: "c.oak",
    Customer_First_Name: "Oak",
    Customer_Last_Name: "Rit",
    Trainer_Username: "mark.l",
    Product_Id: "HIIT6",
    Product_Name: "HIIT 6 Sessions",
    Total_Sessions: 6,
    Used_Sessions: 2,
    Price_Paid: 3000,
    Discount_Amount: 100,
    Status: "FROZEN",
    Purchase_Date: "2025-10-10",
    Sales_Username: "fon.w",
  },
];

function findSessionById(id: number): SessionCourse | null {
  return MOCK_SESSIONS.find((s) => s.Session_Id === id) ?? null;
}

export default function EditCustomerSessionCoursePage(): React.JSX.Element {
  const router = useRouter();
  const sp = useSearchParams();
  const { setSnack } = useSnack();

  const idParam = sp.get("id");
  const sessionId = React.useMemo(() => (idParam ? Number(idParam) : NaN), [idParam]);
  const record = React.useMemo(() => (!Number.isNaN(sessionId) ? findSessionById(sessionId) : null), [sessionId]);

  // ✅ Hooks ทั้งหมดประกาศก่อนการ return แบบมีเงื่อนไข (เลี่ยงข้อผิดพลาด Hooks order)
  const [trainerUsername, setTrainerUsername] = React.useState<string>(record?.Trainer_Username ?? "");
  const [pricePaid, setPricePaid] = React.useState<string>(record ? String(record.Price_Paid) : "");
  const [discountAmount, setDiscountAmount] = React.useState<string>(record ? String(record.Discount_Amount) : "");
  const [status, setStatus] = React.useState<Status>(record?.Status ?? "ACTIVE");

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const goBack = () => router.push("/admin/courses-sessions");

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    // Q4A.A3: Trainer_Username ต้องเป็น ROLE=TRAINER ที่มีจริง (mock ด้วยรายการ TRAINERS)
    const trainerOk = TRAINERS.some((t) => t.username === trainerUsername);
    if (!trainerUsername.trim()) e.trainerUsername = "กรอก Trainer_Username";
    else if (!trainerOk) e.trainerUsername = "ไม่พบ Trainer_Username หรือบทบาทไม่ใช่ TRAINER";

    // Price_Paid >= 0
    const paidNum = Number(pricePaid);
    if (pricePaid.trim() === "") e.pricePaid = "ห้ามว่าง";
    else if (Number.isNaN(paidNum) || paidNum < 0) e.pricePaid = "ต้องเป็นตัวเลข ≥ 0";

    // Discount_Amount >= 0
    const discNum = Number(discountAmount);
    if (discountAmount.trim() === "") e.discountAmount = "ห้ามว่าง";
    else if (Number.isNaN(discNum) || discNum < 0) e.discountAmount = "ต้องเป็นตัวเลข ≥ 0";

    // Status in ENUM
    const allowed: Status[] = ["ACTIVE", "EXPIRED", "FROZEN", "CANCELLED"];
    if (!status || !allowed.includes(status)) e.status = "เลือกสถานะจาก ACTIVE/EXPIRED/FROZEN/CANCELLED";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = () => {
    if (!record) return;
    if (!validate()) return;

    // Q4A.A4 (mock): UPDATE ... WHERE Session_Id = ${Session_Id}
    // …บันทึกเสร็จ → แสดง Pop-up + Redirect กลับหน้า list (Q4A.A1 refresh)
    setSnack({
      open: true,
      msg: `Sessions Course ID: ${record.Session_Id} updated successfully`,
      severity: "success",
    });
    router.push("/admin/courses-sessions");
  };

  // หลังประกาศ hooks ค่อย return not-found ได้ (ไม่ทำให้ hooks order เพี้ยน)
  if (!record) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Edit Customer Session Course</Typography>
        <Typography color="text.secondary">ไม่พบ Session Course ที่ต้องการแก้ไข</Typography>
        <Button sx={{ mt: 2 }} startIcon={<ArrowBackIcon />} onClick={goBack}>
          กลับรายการ
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 820 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={500}>Edit Customer Session Course</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={onSave}
          >
            Save
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 2, borderRadius: 3 }}>
        {/* ข้อมูลอ้างอิง (อ่านอย่างเดียว) */}
        <Stack spacing={0.5} sx={{ mb: 2 }}>
          <Typography variant="body2"><b>Session ID:</b> {record.Session_Id}</Typography>
          <Typography variant="body2">
            <b>Customer:</b> {record.Customer_First_Name} {record.Customer_Last_Name} ({record.Customer_Username})
          </Typography>
          <Typography variant="body2">
            <b>Product:</b> {record.Product_Name} • Total {record.Total_Sessions}, Used {record.Used_Sessions}, Remaining {record.Total_Sessions - record.Used_Sessions}
          </Typography>
          <Typography variant="body2"><b>Sales:</b> {record.Sales_Username} • <b>Purchased:</b> {record.Purchase_Date}</Typography>
        </Stack>

        {/* ฟอร์มแก้ไขเฉพาะที่อนุญาต */}
        <Stack spacing={2}>
          <FormControl fullWidth error={!!errors.trainerUsername}>
            <InputLabel id="trainer-label">Trainer_Username</InputLabel>
            <Select
              labelId="trainer-label"
              label="Trainer_Username"
              value={trainerUsername}
              onChange={(e) => setTrainerUsername(e.target.value)}
            >
              {TRAINERS.map((t) => (
                <MenuItem key={t.username} value={t.username}>
                  {t.username} — {t.firstName} {t.lastName}
                </MenuItem>
              ))}
            </Select>
            {errors.trainerUsername && (
              <FormHelperText>{errors.trainerUsername}</FormHelperText>
            )}
          </FormControl>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Price_Paid"
              value={pricePaid}
              onChange={(e) => setPricePaid(e.target.value)}
              error={!!errors.pricePaid}
              helperText={errors.pricePaid || "จำนวนเงินที่จ่าย (≥ 0)"}
              fullWidth
              inputMode="numeric"
            />
            <TextField
              label="Discount_Amount"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              error={!!errors.discountAmount}
              helperText={errors.discountAmount || "ส่วนลด (≥ 0)"}
              fullWidth
              inputMode="numeric"
            />
          </Stack>

          <FormControl fullWidth error={!!errors.status}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
            >
              <MenuItem value="ACTIVE">ACTIVE</MenuItem>
              <MenuItem value="EXPIRED">EXPIRED</MenuItem>
              <MenuItem value="FROZEN">FROZEN</MenuItem>
              <MenuItem value="CANCELLED">CANCELLED</MenuItem>
            </Select>
            {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
          </FormControl>
        </Stack>
      </Paper>
    </Box>
  );
}