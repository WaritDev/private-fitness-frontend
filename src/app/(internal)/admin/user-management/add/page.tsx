"use client";

import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Card,
  CardContent,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useSnack } from "@/components/snack/SnackProvider";

type Role = "ADMIN" | "MANAGER" | "TRAINER" | "SALES";
type Gender = "MALE" | "FEMALE" | "OTHER";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const RE_USERNAME = /^[A-Za-z][A-Za-z0-9]{3,29}$/;
const RE_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;
const RE_PHONE = /^[0-9]{10}$/;
const RE_EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

export default function AddStaffPage(): React.ReactElement {
  const router = useRouter();
  const { setSnack } = useSnack();

  const [form, setForm] = React.useState({
    username: "",
    password: "",
    confirmPassword: "",
    role: "" as Role | "",
    firstName: "",
    lastName: "",
    gender: "" as Gender | "",
    dateOfBirth: "",
    phoneNumber: "",
    gmail: "",
    specialty: "",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  const setField = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const validateField = (key: keyof typeof form): string => {
    const v = (form[key] as string) ?? "";
    switch (key) {
      case "username":
        if (!v.trim()) return "Required";
        if (!RE_USERNAME.test(v.trim())) return "Use 4–30 chars: start with A–Z, then letters/digits.";
        return "";
      case "password":
        if (!v) return "Required";
        if (!RE_PASSWORD.test(v)) return "Min 8 chars with a-z, A-Z, 0-9, and a special char.";
        return "";
      case "confirmPassword": {
        const pass = form.password.trim();
        const conf = v.trim();
        if (!conf) return "Required";
        if (conf !== pass) return "Passwords do not match.";
        return "";
      }
      case "role":
        return form.role ? "" : "Required";
      case "firstName":
        return v.trim() ? "" : "Required";
      case "lastName":
        return v.trim() ? "" : "Required";
      case "gender":
        return form.gender ? "" : "Required";
      case "dateOfBirth": {
        if (!v) return "Required";
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return "Use YYYY-MM-DD.";
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) return "Invalid date.";
        return "";
      }
      case "phoneNumber":
        if (!v.trim()) return "Required";
        if (!RE_PHONE.test(v.trim())) return "10 digits only.";
        return "";
      case "gmail":
        if (!v.trim()) return "Required";
        if (!RE_EMAIL.test(v.trim().toLowerCase())) return "Invalid email.";
        return "";
      case "specialty":
        if (form.role === "TRAINER" && !v.trim()) return "Required for TRAINER.";
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
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  React.useEffect(() => {
    setErrors((prev) => ({
      ...prev,
      password: validateField("password"),
      confirmPassword: validateField("confirmPassword"),
    }));
  }, [form.password, form.confirmPassword]);

  const onSave = async () => {
    if (!validateAll()) return;
    setSaving(true);
    try {
      const payload = {
        username: form.username.trim(),
        password: form.password.trim(),
        confirmPassword: form.confirmPassword.trim(),
        role: form.role as Role,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        gender: form.gender as Gender,
        dateOfBirth: form.dateOfBirth,
        phoneNumber: form.phoneNumber.trim(),
        gmail: form.gmail.trim().toLowerCase(),
        specialty: form.role === "TRAINER" ? (form.specialty || "").trim() || null : null,
        isActive: true,
      };

      const res = await fetch(`${API_BASE}/api/staffs/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err?.message || `Create failed (HTTP ${res.status})`);
      }

      setSnack({ open: true, msg: `User: ${payload.username} created successfully`, severity: "success" });
      router.push("/admin/user-management");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create failed";
      setSnack({ open: true, msg, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" fontWeight={500} sx={{ mb: 2 }}>
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
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                onBlur={() => setErrors((s) => ({ ...s, password: validateField("password") }))}
                helperText={errors.password || "Min 8 chars with a-z, A-Z, 0-9, and a special char."}
                error={!!errors.password}
                fullWidth
              />
              <TextField
                label="Confirm Password"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) => setField("confirmPassword", e.target.value)}
                onBlur={() => setErrors((s) => ({ ...s, confirmPassword: validateField("confirmPassword") }))}
                helperText={errors.confirmPassword}
                error={!!errors.confirmPassword}
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
                  <MenuItem value="MALE">Male</MenuItem>
                  <MenuItem value="FEMALE">Female</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
                {errors.gender && <Typography variant="caption" color="error">{errors.gender}</Typography>}
              </FormControl>

              <TextField
                label="Date of Birth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setField("dateOfBirth", e.target.value)}
                onBlur={() => setErrors((s) => ({ ...s, dateOfBirth: validateField("dateOfBirth") }))}
                helperText={errors.dateOfBirth || "YYYY-MM-DD"}
                error={!!errors.dateOfBirth}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Phone Number"
                value={form.phoneNumber}
                onChange={(e) => setField("phoneNumber", e.target.value)}
                onBlur={() => setErrors((s) => ({ ...s, phoneNumber: validateField("phoneNumber") }))}
                helperText={errors.phoneNumber}
                error={!!errors.phoneNumber}
                fullWidth
              />
              <TextField
                label="Email"
                value={form.gmail}
                onChange={(e) => setField("gmail", e.target.value)}
                onBlur={() => setErrors((s) => ({ ...s, gmail: validateField("gmail") }))}
                helperText={errors.gmail}
                error={!!errors.gmail}
                fullWidth
              />
            </Stack>

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
              <Button variant="outlined" onClick={() => router.back()} disabled={saving}>
                Cancel
              </Button>
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