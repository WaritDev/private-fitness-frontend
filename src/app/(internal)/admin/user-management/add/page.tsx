"use client";

import * as React from "react";
import {
  Box, Stack, Typography, TextField, Button, MenuItem,
  FormControl, InputLabel, Select, Card, CardContent
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useSnack } from "@/components/snack/SnackProvider";

type Role = "ADMIN" | "MANAGER" | "TRAINER" | "SALES";
type Gender = "Male" | "Female" | "Other";
type Staff = {
  username: string;
  password: string;
  role: Role;
  firstName: string;
  lastName: string;
  gender: Gender;
  phoneNumber: string;
  gmail: string;
  specialty: string | null;
  isActive: boolean;
};

const STORAGE_KEY = "staff_mock";

const RE_USERNAME = /^[A-Za-z][A-Za-z0-9]{3,29}$/;
const RE_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const RE_PHONE = /^[0-9]{10}$/;
const RE_GMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

function ensureSeed() {
  if (typeof window === "undefined") return;
  const has = localStorage.getItem(STORAGE_KEY);
  if (has) return;
  const seed: Staff[] = [
    { username: "jane.m",  password: "Mock@1234", role: "MANAGER", firstName: "Jane",  lastName: "Moon",  gender: "Female", phoneNumber: "0801112233", gmail: "jane.m@example.com",  specialty: null,   isActive: true },
    { username: "alice.b", password: "Mock@1234", role: "TRAINER", firstName: "Alice", lastName: "Brown", gender: "Female", phoneNumber: "0897778899", gmail: "alice.b@example.com", specialty: "Yoga",  isActive: true },
    { username: "bob.c",   password: "Mock@1234", role: "SALES",   firstName: "Bob",   lastName: "Chan",  gender: "Male",   phoneNumber: "0849990001", gmail: "bob.c@example.com",   specialty: null,   isActive: false },
    { username: "john.d",  password: "Mock@1234", role: "ADMIN",   firstName: "John",  lastName: "Doe",   gender: "Male",   phoneNumber: "0812223344", gmail: "john.d@example.com",  specialty: null,   isActive: true },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
}
function loadAll(): Staff[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Staff[]) : [];
  } catch {
    return [];
  }
}
function saveAll(list: Staff[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function AddStaffPage(): React.ReactElement {
  const router = useRouter();
  const { setSnack } = useSnack();

  React.useEffect(() => { ensureSeed(); }, []);

  const [form, setForm] = React.useState({
    username: "",
    password: "",
    confirm: "",
    role: "" as Role | "",
    firstName: "",
    lastName: "",
    gender: "" as Gender | "",
    phoneNumber: "",
    gmail: "",
    specialty: "",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  const setField = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const validateField = (key: keyof typeof form): string => {
    const v = form[key] as string;
    switch (key) {
      case "username":
        if (!v) return "จำเป็น";
        if (!RE_USERNAME.test(v)) return "รูปแบบไม่ถูกต้อง (A-Za-z ตามด้วย a-z0-9 ความยาว 4–30)";
        return "";
      case "password":
        if (!v) return "จำเป็น";
        if (!RE_PASSWORD.test(v)) return "อย่างน้อย 8 ตัว มี a-z, A-Z, 0-9 และอักขระพิเศษ";
        return "";
      case "confirm":
        if (!v) return "จำเป็น";
        if (v !== form.password) return "ต้องตรงกับ Password";
        return "";
      case "role":
        if (!form.role) return "จำเป็น";
        return "";
      case "firstName":
        return v ? "" : "จำเป็น";
      case "lastName":
        return v ? "" : "จำเป็น";
      case "phoneNumber":
        if (!v) return "จำเป็น";
        if (!RE_PHONE.test(v)) return "ต้องเป็นตัวเลข 10 หลัก";
        return "";
      case "gmail":
        if (!v) return "จำเป็น";
        if (!RE_GMAIL.test(v.toLowerCase())) return "อีเมลไม่ถูกต้อง";
        return "";
      case "gender":
        return form.gender ? "" : "จำเป็น";
      case "specialty":
        if (form.role === "TRAINER" && !v) return "จำเป็นสำหรับ TRAINER";
        return "";
      default:
        return "";
    }
  };

  const validateAll = (): boolean => {
    const keys = Object.keys(form) as (keyof typeof form)[];
    const next: Record<string, string> = {};
    keys.forEach((k) => {
      const msg = validateField(k);
      if (msg) next[k] = msg;
    });

    const list = loadAll();
    if (!next.username && list.some((u) => u.username.toLowerCase() === form.username.toLowerCase())) {
      next.username = "มี Username นี้อยู่แล้ว";
    }
    if (!next.gmail && list.some((u) => u.gmail.toLowerCase() === form.gmail.toLowerCase())) {
      next.gmail = "มี Gmail นี้อยู่แล้ว";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSave = async () => {
    if (!validateAll()) return;
    setSaving(true);
    try {
      const list = loadAll();
      const newRow: Staff = {
        username: form.username,
        password: form.password,
        role: form.role as Role,
        firstName: form.firstName,
        lastName: form.lastName,
        gender: form.gender as Gender,
        phoneNumber: form.phoneNumber,
        gmail: form.gmail.toLowerCase(),
        specialty: form.role === "TRAINER" ? form.specialty : null,
        isActive: true,
      };
      saveAll([newRow, ...list]);

      setSnack({ open: true, msg: `User: ${form.username} created successfully`, severity: "success" });

      router.push("/admin/user-management");
    } catch {
      setSnack({ open: true, msg: "เกิดข้อผิดพลาดในการบันทึก", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" fontWeight={400} sx={{ mb: 2 }}>
        Add New Staff
      </Typography>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Username"
                value={form.username}
                onChange={(e) => setField("username", e.target.value)}
                onBlur={() => setErrors((s) => ({ ...s, username: validateField("username") }))}
                helperText={errors.username}
                error={!!errors.username}
                fullWidth
              />
              <FormControl fullWidth error={!!errors.role}>
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  label="Role"
                  value={form.role || ""}
                  onChange={(e) => setField("role", e.target.value as Role)}
                  onBlur={() => setErrors((s) => ({ ...s, role: validateField("role") }))}
                >
                  <MenuItem value="TRAINER">TRAINER</MenuItem>
                  <MenuItem value="SALES">SALES</MenuItem>
                  <MenuItem value="MANAGER">MANAGER</MenuItem>
                  <MenuItem value="ADMIN">ADMIN</MenuItem>
                </Select>
                {errors.role && <Typography variant="caption" color="error">{errors.role}</Typography>}
              </FormControl>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                onBlur={() => setErrors((s) => ({ ...s, password: validateField("password") }))}
                helperText={errors.password || "ต้องมี a-z, A-Z, 0-9 และอักขระพิเศษ ความยาว ≥ 8"}
                error={!!errors.password}
                fullWidth
              />
              <TextField
                label="Confirm Password"
                type="password"
                value={form.confirm}
                onChange={(e) => setField("confirm", e.target.value)}
                onBlur={() => setErrors((s) => ({ ...s, confirm: validateField("confirm") }))}
                helperText={errors.confirm}
                error={!!errors.confirm}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="First Name"
                value={form.firstName}
                onChange={(e) => setField("firstName", e.target.value)}
                onBlur={() => setErrors((s) => ({ ...s, firstName: validateField("firstName") }))}
                helperText={errors.firstName}
                error={!!errors.firstName}
                fullWidth
              />
              <TextField
                label="Last Name"
                value={form.lastName}
                onChange={(e) => setField("lastName", e.target.value)}
                onBlur={() => setErrors((s) => ({ ...s, lastName: validateField("lastName") }))}
                helperText={errors.lastName}
                error={!!errors.lastName}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <FormControl fullWidth error={!!errors.gender}>
                <InputLabel id="gender-label">Gender</InputLabel>
                <Select
                  labelId="gender-label"
                  label="Gender"
                  value={form.gender || ""}
                  onChange={(e) => setField("gender", e.target.value as Gender)}
                  onBlur={() => setErrors((s) => ({ ...s, gender: validateField("gender") }))}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
                {errors.gender && <Typography variant="caption" color="error">{errors.gender}</Typography>}
              </FormControl>
              <TextField
                label="Phone Number"
                value={form.phoneNumber}
                onChange={(e) => setField("phoneNumber", e.target.value)}
                onBlur={() => setErrors((s) => ({ ...s, phoneNumber: validateField("phoneNumber") }))}
                helperText={errors.phoneNumber}
                error={!!errors.phoneNumber}
                fullWidth
              />
            </Stack>

            <TextField
              label="Gmail"
              value={form.gmail}
              onChange={(e) => setField("gmail", e.target.value)}
              onBlur={() => setErrors((s) => ({ ...s, gmail: validateField("gmail") }))}
              helperText={errors.gmail}
              error={!!errors.gmail}
              fullWidth
            />

            {form.role === "TRAINER" && (
              <TextField
                label="Specialty"
                value={form.specialty}
                onChange={(e) => setField("specialty", e.target.value)}
                onBlur={() => setErrors((s) => ({ ...s, specialty: validateField("specialty") }))}
                helperText={errors.specialty}
                error={!!errors.specialty}
                fullWidth
              />
            )}

            <Stack direction="row" gap={2} justifyContent="flex-end" sx={{ pt: 1 }}>
              <Button variant="outlined" onClick={() => router.back()} disabled={saving}>ยกเลิก</Button>
              <Button variant="contained" onClick={onSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}