"use client";

import * as React from "react";
import {
  Box, Stack, Typography, TextField, MenuItem, Button,
  Paper, Divider, FormControlLabel, Switch,
} from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import { useSnack } from "@/components/snack/SnackProvider";

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" } as const;

type Role = "ADMIN" | "MANAGER" | "TRAINER" | "SALES";
type GenderUI = "M" | "F" | "OTHER";
type GenderAPI = "MALE" | "FEMALE" | "OTHER";

const rePhone = /^[0-9]{10}$/;
const reEmail = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
const rePassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const reDate = /^\d{4}-\d{2}-\d{2}$/;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type ApiNullString = { String: string; Valid: boolean };
type ApiNullBool = { Bool: boolean; Valid: boolean };
type ApiStaff = {
  username: string;
  role: Role;
  firstName: string;
  lastName: string;
  gender: GenderAPI;
  dateOfBirth: string;
  phoneNumber: string;
  gmail: string;
  specialty: ApiNullString;
  isActive: ApiNullBool;
};

export default function EditStaffPage(): React.ReactElement | null {
  const router = useRouter();
  const params = useParams<{ u: string }>();
  const { setSnack } = useSnack();

  // ดึง username จาก path param
  const u = React.useMemo(() => decodeURIComponent(params.u), [params.u]);

  // cutoff age > 14
  const cutoff = React.useMemo(() => {
    const now = new Date();
    const d = new Date(now.getFullYear() - 14, now.getMonth(), now.getDate());
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return { date: d, ymd: `${y}-${m}-${dd}`, th: d.toLocaleDateString("th-TH") };
  }, []);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    username: "",
    role: "" as Role | "",
    firstName: "",
    lastName: "",
    gender: "" as "" | GenderUI,
    dateOfBirth: "",
    phoneNumber: "",
    gmail: "",
    specialty: "",
    isActive: true,
    newPassword: "",
    confirmNewPassword: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const toUIgender = (g: GenderAPI): GenderUI => (g === "MALE" ? "M" : g === "FEMALE" ? "F" : "OTHER");
  const toAPIgender = (g: GenderUI): GenderAPI => (g === "M" ? "MALE" : g === "F" ? "FEMALE" : "OTHER");

  const isoOrYmdToYmd = (s: string): string => {
    if (reDate.test(s)) return s;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  // โหลดรายละเอียดผู้ใช้จากพาธ
  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!u) {
        setSnack({ open: true, msg: "ไม่พบพารามิเตอร์ผู้ใช้ใน URL", severity: "error" });
        router.replace("/admin/user-management");
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/staffs/${encodeURIComponent(u)}`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message || `โหลดข้อมูลล้มเหลว (HTTP ${res.status})`);
        }
        const data = (await res.json()) as ApiStaff;
        if (cancelled) return;
        setForm({
          username: data.username,
          role: data.role,
          firstName: data.firstName,
          lastName: data.lastName,
          gender: toUIgender(data.gender),
          dateOfBirth: isoOrYmdToYmd(data.dateOfBirth),
          phoneNumber: data.phoneNumber ?? "",
          gmail: data.gmail ?? "",
          specialty: data.role === "TRAINER" && data.specialty?.Valid ? data.specialty.String : "",
          isActive: data.isActive?.Valid ? data.isActive.Bool : false,
          newPassword: "",
          confirmNewPassword: "",
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "โหลดข้อมูลล้มเหลว";
        setSnack({ open: true, msg, severity: "error" });
        router.replace("/admin/user-management");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [u, router, setSnack]);

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

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (form.newPassword || form.confirmNewPassword) {
      if (!rePassword.test(form.newPassword)) e.newPassword = "≥8 ตัว และมี a-z, A-Z, 0-9, อักขระพิเศษ";
      if (form.newPassword !== form.confirmNewPassword) e.confirmNewPassword = "ยืนยันรหัสผ่านต้องตรงกัน";
    }

    if (!form.role) e.role = "กรุณาเลือก Role";
    if (!form.firstName.trim()) e.firstName = "กรอก First_Name";
    if (!form.lastName.trim()) e.lastName = "กรอก Last_Name";
    if (!form.gender) e.gender = "เลือก Gender";

    if (!form.dateOfBirth) e.dateOfBirth = "กรอกวันเกิด";
    else if (!reDate.test(form.dateOfBirth)) e.dateOfBirth = "รูปแบบ YYYY-MM-DD";
    else {
      const dob = new Date(`${form.dateOfBirth}T00:00:00`);
      if (!(dob < cutoff.date)) e.dateOfBirth = `อายุต้องมากกว่า 14 ปี (วันเกิดต้องก่อน ${cutoff.th})`;
    }

    if (!form.phoneNumber.trim()) e.phoneNumber = "กรอก Phone_Number";
    else if (!rePhone.test(form.phoneNumber)) e.phoneNumber = "ต้องเป็นตัวเลข 10 หลัก";

    if (!form.gmail.trim()) e.gmail = "กรอก Gmail";
    else if (!reEmail.test(form.gmail.toLowerCase())) e.gmail = "รูปแบบอีเมลไม่ถูกต้อง";

    if (form.role === "TRAINER" && !form.specialty.trim()) e.specialty = "จำเป็นสำหรับ TRAINER";

    setErrors(e);
    if (Object.keys(e).length) {
      setSnack({ open: true, msg: "กรอกข้อมูลให้ถูกต้อง", severity: "error" });
      return false;
    }
    return true;
  };

  const onSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        newPassword: form.newPassword || undefined,
        confirmNewPassword: form.newPassword ? form.confirmNewPassword : undefined,
        role: form.role,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        gender: toAPIgender(form.gender as GenderUI),
        dateOfBirth: form.dateOfBirth,
        phoneNumber: form.phoneNumber.trim(),
        gmail: form.gmail.trim().toLowerCase(),
        specialty: form.role === "TRAINER" ? form.specialty.trim() : "",
        isActive: !!form.isActive,
      };

      const res = await fetch(
        `${API_BASE}/api/staffs/${encodeURIComponent(form.username)}/update`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || `Update failed (HTTP ${res.status})`);
      }

      let msg = `User: ${form.username} updated successfully`;
      if (res.status !== 204) {
        const body = await res.json().catch(() => ({}));
        if (body?.message) msg = body.message;
      }

      setSnack({ open: true, msg, severity: "success" });
      router.replace("/admin/user-management");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการบันทึก";
      setSnack({ open: true, msg, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form.username) return null;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: "auto" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={400}>Edit Staff Account</Typography>
        <Button onClick={() => router.push("/admin/user-management")}>กลับรายการ</Button>
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
            helperText={errors.newPassword || "ปล่อยว่างถ้าไม่ต้องการเปลี่ยนรหัส"}
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
          <TextField select label="Role" size="small" value={form.role} onChange={setField("role")} error={!!errors.role} helperText={errors.role} fullWidth>
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
          <TextField select label="Gender" size="small" value={form.gender} onChange={setField("gender")} error={!!errors.gender} helperText={errors.gender} fullWidth>
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
            error={!!errors.dateOfBirth}
            helperText={errors.dateOfBirth || `รูปแบบ YYYY-MM-DD (ต้องเกิดก่อน ${cutoff.th})`}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: cutoff.ymd }}
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
            helperText={form.role !== "TRAINER" ? "Role นี้ไม่มี Specialty (จะแสดงว่า “ไม่มี” ในตาราง)" : errors.specialty}
            error={!!errors.specialty}
            fullWidth
          />
          <FormControlLabel
            control={<Switch checked={!!form.isActive} onChange={(_, c) => setForm((p) => ({ ...p, isActive: c }))} />}
            label={form.isActive ? "ใช้งาน (Is_Active = true)" : "ปิดใช้งาน (Is_Active = false)"}
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={() => router.push("/admin/user-management")}>ยกเลิก</Button>
          <Button
            variant="contained"
            onClick={onSave}
            disabled={saving}
            sx={{ backgroundColor: PRIMARY.main, "&:hover": { backgroundColor: PRIMARY.dark } }}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}