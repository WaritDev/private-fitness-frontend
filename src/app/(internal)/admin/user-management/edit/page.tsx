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
  Divider,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useSnack } from "@/components/snack/SnackProvider";

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" } as const;

type Role = "ADMIN" | "MANAGER" | "TRAINER" | "SALES";
type Gender = "M" | "F" | "OTHER";

type Staff = {
  username: string;
  role: Role;
  firstName: string;
  lastName: string;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  phoneNumber?: string | null;
  gmail?: string | null;
  specialty?: string | null;
  isActive: boolean;
};

const MOCK: Staff[] = [
  { username: "jane.m", role: "MANAGER", firstName: "Jane", lastName: "Moon", gender: "F", dateOfBirth: "1990-03-11", phoneNumber: "0801112233", gmail: "jane.m@example.com", specialty: "Ops", isActive: true },
  { username: "john.d", role: "ADMIN", firstName: "John", lastName: "Doe", gender: "M", dateOfBirth: "1989-07-22", phoneNumber: "0812223344", gmail: "john.d@example.com", specialty: "Infra", isActive: true },
  { username: "alice.b", role: "TRAINER", firstName: "Alice", lastName: "Brown", gender: "F", dateOfBirth: "1996-01-09", phoneNumber: "0897778899", gmail: "alice.b@example.com", specialty: "Yoga", isActive: true },
  { username: "mark.l", role: "TRAINER", firstName: "Mark", lastName: "Lee", gender: "M", dateOfBirth: "1993-12-30", phoneNumber: "0863334455", gmail: "mark.l@example.com", specialty: "Strength", isActive: false },
  { username: "bob.c", role: "SALES", firstName: "Bob", lastName: "Chan", gender: "M", dateOfBirth: "1995-10-08", phoneNumber: "0849990001", gmail: "bob.c@example.com", specialty: "B2B", isActive: false },
];

const rePhone = /^[0-9]{10}$/;
const reEmail = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
const rePassword =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function EditStaffPage(): React.ReactElement | null {
  const router = useRouter();
  const sp = useSearchParams();
  const { setSnack } = useSnack();

  const u = sp.get("u") || "";
  const original = React.useMemo(
    () => MOCK.find((x) => x.username === u) || null,
    [u]
  );

  const [form, setForm] = React.useState(() => {
    if (!original) {
      return {
        username: "",
        role: "TRAINER" as Role,
        firstName: "",
        lastName: "",
        gender: "" as "" | Gender,
        dateOfBirth: "",
        phoneNumber: "",
        gmail: "",
        specialty: "",
        isActive: true,
        newPassword: "",
        confirmNewPassword: "",
      };
    }
    return {
        username: original.username,
        role: original.role,
        firstName: original.firstName,
        lastName: original.lastName,
        gender: (original.gender || "") as "" | Gender,
        dateOfBirth: original.dateOfBirth || "",
        phoneNumber: original.phoneNumber || "",
        gmail: original.gmail || "",
        specialty: original.role === "TRAINER" ? original.specialty || "" : "",
        isActive: original.isActive,
        newPassword: "",
        confirmNewPassword: "",
      };
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const setField =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = e.target.value;
      setForm((p) => {
        const next = { ...p, [k]: v };
        if (k === "role" && v !== "TRAINER") next.specialty = "";
        return next;
      });
      setErrors((prev) => ({ ...prev, [k]: "" }));
    };

  const isPhoneTaken = (phone: string) =>
    MOCK.some((x) => x.phoneNumber === phone && x.username !== form.username);
  const isEmailTaken = (email: string) =>
    MOCK.some(
      (x) =>
        (x.gmail || "").toLowerCase() === email.toLowerCase() &&
        x.username !== form.username
    );

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (form.newPassword || form.confirmNewPassword) {
      if (!rePassword.test(form.newPassword)) {
        e.newPassword =
          "Password ต้องยาว ≥8 ตัว และมี a-z, A-Z, ตัวเลข, อักขระพิเศษ";
      }
      if (form.newPassword !== form.confirmNewPassword) {
        e.confirmNewPassword = "Confirm Password ต้องตรงกับ Password";
      }
    }

    if (!form.firstName.trim()) e.firstName = "กรอก First_Name";
    if (!form.lastName.trim()) e.lastName = "กรอก Last_Name";

    if (!form.phoneNumber.trim()) e.phoneNumber = "กรอก Phone_Number";
    else if (!rePhone.test(form.phoneNumber)) e.phoneNumber = "ต้องเป็นตัวเลข 10 หลัก";
    else if (isPhoneTaken(form.phoneNumber)) e.phoneNumber = "เบอร์นี้ถูกใช้แล้ว";

    if (!form.gmail.trim()) e.gmail = "กรอก Gmail";
    else if (!reEmail.test(form.gmail)) e.gmail = "รูปแบบอีเมลไม่ถูกต้อง";
    else if (isEmailTaken(form.gmail)) e.gmail = "อีเมลนี้ถูกใช้แล้ว";

    setErrors(e);
    if (Object.keys(e).length) {
      setSnack({ open: true, msg: "กรอกข้อมูลให้ถูกต้อง", severity: "error" });
      return false;
    }
    return true;
  };

  const onSave = () => {
    if (!original) {
      setSnack({ open: true, msg: "ไม่พบผู้ใช้ที่ต้องการแก้ไข", severity: "error" });
      router.push("/admin/user-management");
      return;
    }
    if (!validate()) return;

    // mock update
    const idx = MOCK.findIndex((x) => x.username === form.username);
    if (idx >= 0) {
      MOCK[idx] = {
        username: form.username,
        role: form.role,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        gender: (form.gender || null) as Gender | null,
        dateOfBirth: form.dateOfBirth || null,
        phoneNumber: form.phoneNumber.trim(),
        gmail: form.gmail.trim().toLowerCase(),
        specialty: form.role === "TRAINER" ? form.specialty.trim() : null,
        isActive: !!form.isActive,
      };
    }

    setSnack({
      open: true,
      msg: `User: ${form.username} updated successfully`,
      severity: "success",
    });

    router.push("/admin/user-management");
  };

  const onCancel = () => router.push("/admin/user-management");

  React.useEffect(() => {
    if (!u || !original) {
      setSnack({ open: true, msg: `ไม่พบผู้ใช้ที่ต้องการแก้ไข (u=${u || "—"})`, severity: "error" });
      router.replace("/admin/user-management");
    }
  }, [router, setSnack, u, original]);

  if (!u || !original) {
    return null;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: "auto" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={400}>Edit Staff Account</Typography>
        <Button onClick={onCancel}>กลับรายการ</Button>
      </Stack>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Username (แก้ไขไม่ได้)
        </Typography>
        <TextField fullWidth size="small" value={form.username} disabled sx={{ mb: 2 }} />

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Reset Password (ถ้าต้องการ)
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="New Password"
            type="password"
            size="small"
            value={form.newPassword}
            onChange={setField("newPassword")}
            error={!!errors.newPassword}
            helperText={errors.newPassword}
            fullWidth
          />
          <TextField
            label="Confirm New Password"
            type="password"
            size="small"
            value={form.confirmNewPassword}
            onChange={setField("confirmNewPassword")}
            error={!!errors.confirmNewPassword}
            helperText={errors.confirmNewPassword}
            fullWidth
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Role / Names */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
          <TextField select label="Role" size="small" value={form.role} onChange={setField("role")} fullWidth>
            {(["TRAINER", "SALES", "MANAGER", "ADMIN"] as Role[]).map((r) => (
              <MenuItem key={r} value={r}>{r}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="First_Name"
            size="small"
            value={form.firstName}
            onChange={setField("firstName")}
            error={!!errors.firstName}
            helperText={errors.firstName}
            fullWidth
          />

          <TextField
            label="Last_Name"
            size="small"
            value={form.lastName}
            onChange={setField("lastName")}
            error={!!errors.lastName}
            helperText={errors.lastName}
            fullWidth
          />
        </Stack>

        {/* Gender / DOB */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
          <TextField select label="Gender" size="small" value={form.gender} onChange={setField("gender")} fullWidth>
            <MenuItem value="">—</MenuItem>
            <MenuItem value="M">Male</MenuItem>
            <MenuItem value="F">Female</MenuItem>
            <MenuItem value="OTHER">Other</MenuItem>
          </TextField>

          <TextField
            label="Date_of_Birth"
            type="date"
            size="small"
            value={form.dateOfBirth || ""}
            onChange={setField("dateOfBirth")}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Stack>

        {/* Phone / Gmail */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="Phone_Number"
            size="small"
            value={form.phoneNumber}
            onChange={setField("phoneNumber")}
            error={!!errors.phoneNumber}
            helperText={errors.phoneNumber}
            fullWidth
          />
          <TextField
            label="Gmail"
            size="small"
            value={form.gmail}
            onChange={setField("gmail")}
            error={!!errors.gmail}
            helperText={errors.gmail}
            fullWidth
          />
        </Stack>

        {/* Specialty / Active */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="Specialty"
            size="small"
            value={form.role === "TRAINER" ? form.specialty : ""}
            onChange={setField("specialty")}
            disabled={form.role !== "TRAINER"}
            helperText={form.role !== "TRAINER" ? "Role นี้ไม่มี Specialty (จะแสดงว่า “ไม่มี” ในตาราง)" : ""}
            fullWidth
          />
          <FormControlLabel
            control={
              <Switch
                checked={!!form.isActive}
                onChange={(_, c) => setForm((p) => ({ ...p, isActive: c }))}
              />
            }
            label={form.isActive ? "ใช้งาน (Is_Active = true)" : "ปิดใช้งาน (Is_Active = false)"}
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={onCancel}>ยกเลิก</Button>
          <Button
            variant="contained"
            onClick={onSave}
            sx={{ backgroundColor: PRIMARY.main, "&:hover": { backgroundColor: PRIMARY.dark } }}
          >
            Save
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}