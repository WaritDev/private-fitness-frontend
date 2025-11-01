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
import { useAlertPopUp } from "@/components/pop-up/AlertPopUpUI";

type Role = "ADMIN" | "MANAGER" | "TRAINER" | "SALES";
type Gender = "MALE" | "FEMALE" | "OTHER";

const RE_USERNAME = /^[A-Za-z][A-Za-z0-9]{3,29}$/;
const RE_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const RE_PHONE = /^[0-9]{10}$/;
const RE_EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const pad2 = (n: number) => String(n).padStart(2, "0");
const ymdLocal = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const todayLocal = () => new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
const addYears = (d: Date, years: number) => new Date(d.getFullYear() + years, d.getMonth(), d.getDate());
const parseYMDStrict = (v: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const [Y, M, D] = v.split("-").map(Number);
  const dt = new Date(Y, M - 1, D);
  return (dt.getFullYear() === Y && dt.getMonth() === M - 1 && dt.getDate() === D) ? dt : null;
};

export default function AddStaffPage(): React.ReactElement {
  const router = useRouter();
  const { setAlert } = useAlertPopUp();

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
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const setField = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const touch = (k: keyof typeof form) =>
    setTouched((t) => ({ ...t, [k]: true }));

  const showError = (k: keyof typeof form) =>
    (submitted || touched[k]) && !!errors[k];

  const helper = (k: keyof typeof form, fallback?: string) =>
    showError(k) ? errors[k] : (fallback ?? "");

  const maxDob = React.useMemo(() => {
    const t = todayLocal();
    return ymdLocal(new Date(t.getFullYear() - 14, t.getMonth(), t.getDate()));
  }, []);

  const validateFormInputs = (key: keyof typeof form): string => {
    const v = (form[key] as string) ?? "";

    switch (key) {
      case "username":
        if (!v.trim()) return "Required";
        if (!RE_USERNAME.test(v.trim())) return "Use 4–30 chars: start with A–Z, then a–z/0–9.";
        return "";

      case "password":
        if (!v) return "Required";
        if (!RE_PASSWORD.test(v)) return "At least 8 chars incl. a–z, A–Z, 0–9, and one of @$!%*?&.";
        return "";

      case "confirmPassword":
        if (!v) return "Required";
        if (v !== form.password) return "Passwords do not match.";
        return "";

      case "role":
        return form.role ? "" : "Required";

      case "firstName":
        return v.trim() ? "" : "Required";

      case "lastName":
        return v.trim() ? "" : "Required";

      case "gender":
        return form.gender ? "" : "Required";

      case "dateOfBirth": {
        const raw = v.trim();
        if (!raw) return "Required";
        if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "Use YYYY-MM-DD.";
        const dob = parseYMDStrict(raw);
        if (!dob) return "Invalid date.";
        if (addYears(dob, 14) > todayLocal()) return `Must be at least 14 years old (DOB ≤ ${maxDob}).`;
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
      if (k === "specialty" && form.role !== "TRAINER") {
        next[k] = "";
        return;
      }
      next[k] = validateFormInputs(k);
    });
    setErrors(next);
    return Object.values(next).every((m) => m === "");
  };

  const onSave = async () => {
    setSubmitted(true);
    if (!validateAll()) return;

    const dob = parseYMDStrict(form.dateOfBirth);
    if (!dob) {
      setErrors((s) => ({ ...s, dateOfBirth: "Invalid date." }));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        username: form.username.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role as Role,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        gender: form.gender as Gender,
        dateOfBirth: ymdLocal(dob),
        phoneNumber: form.phoneNumber.trim(),
        gmail: form.gmail.trim().toLowerCase(),
        specialty: form.role === "TRAINER" ? form.specialty.trim() || null : null,
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

      setAlert({ open: true, msg: `User: ${payload.username} created successfully`, severity: "success" });
      router.push("/admin/user-management");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create failed";
      setAlert({ open: true, msg, severity: "error" });
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
                onBlur={() => {
                  touch("username");
                  setErrors((s) => ({ ...s, username: validateFormInputs("username") }));
                }}
                helperText={helper("username")}
                error={showError("username")}
                fullWidth
              />
              <FormControl fullWidth error={showError("role")}>
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  label="Role"
                  value={form.role || ""}
                  onChange={(e) => setField("role", e.target.value as Role)}
                  onBlur={() => {
                    touch("role");
                    setErrors((s) => ({ ...s, role: validateFormInputs("role") }));
                  }}
                >
                  <MenuItem value="TRAINER">TRAINER</MenuItem>
                  <MenuItem value="SALES">SALES</MenuItem>
                  <MenuItem value="MANAGER">MANAGER</MenuItem>
                  <MenuItem value="ADMIN">ADMIN</MenuItem>
                </Select>
                {showError("role") && <Typography variant="caption" color="error">{errors.role}</Typography>}
              </FormControl>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                onBlur={() => {
                  touch("password");
                  setErrors((s) => ({ ...s, password: validateFormInputs("password") }));
                }}
                helperText={helper("password", "At least 8 chars incl. a–z, A–Z, 0–9, and @$!%*?&.")}
                error={showError("password")}
                fullWidth
              />
              <TextField
                label="Confirm Password"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setField("confirmPassword", e.target.value)}
                onBlur={() => {
                  touch("confirmPassword");
                  setErrors((s) => ({ ...s, confirmPassword: validateFormInputs("confirmPassword") }));
                }}
                helperText={helper("confirmPassword")}
                error={showError("confirmPassword")}
                fullWidth
              />
            </Stack>

            {/* Names */}
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="First Name"
                value={form.firstName}
                onChange={(e) => setField("firstName", e.target.value)}
                onBlur={() => {
                  touch("firstName");
                  setErrors((s) => ({ ...s, firstName: validateFormInputs("firstName") }));
                }}
                helperText={helper("firstName")}
                error={showError("firstName")}
                fullWidth
              />
              <TextField
                label="Last Name"
                value={form.lastName}
                onChange={(e) => setField("lastName", e.target.value)}
                onBlur={() => {
                  touch("lastName");
                  setErrors((s) => ({ ...s, lastName: validateFormInputs("lastName") }));
                }}
                helperText={helper("lastName")}
                error={showError("lastName")}
                fullWidth
              />
            </Stack>

            {/* Gender + DOB */}
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <FormControl fullWidth error={showError("gender")}>
                <InputLabel id="gender-label">Gender</InputLabel>
                <Select
                  labelId="gender-label"
                  label="Gender"
                  value={form.gender || ""}
                  onChange={(e) => setField("gender", e.target.value as Gender)}
                  onBlur={() => {
                    touch("gender");
                    setErrors((s) => ({ ...s, gender: validateFormInputs("gender") }));
                  }}
                >
                  <MenuItem value="MALE">Male</MenuItem>
                  <MenuItem value="FEMALE">Female</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
                {showError("gender") && <Typography variant="caption" color="error">{errors.gender}</Typography>}
              </FormControl>

              <TextField
                label="Date of Birth"
                type="text"
                value={form.dateOfBirth}
                onChange={(e) => setField("dateOfBirth", e.target.value)}
                onBlur={() => {
                  touch("dateOfBirth");
                  setErrors((s) => ({ ...s, dateOfBirth: validateFormInputs("dateOfBirth") }));
                }}
                helperText={helper("dateOfBirth", "YYYY-MM-DD")}
                error={showError("dateOfBirth")}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  max: maxDob,
                  pattern: "\\d{4}-\\d{2}-\\d{2}",
                }}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Phone Number"
                value={form.phoneNumber}
                onChange={(e) => setField("phoneNumber", e.target.value)}
                onBlur={() => {
                  touch("phoneNumber");
                  setErrors((s) => ({ ...s, phoneNumber: validateFormInputs("phoneNumber") }));
                }}
                helperText={helper("phoneNumber")}
                error={showError("phoneNumber")}
                fullWidth
              />
              <TextField
                label="Email"
                value={form.gmail}
                onChange={(e) => setField("gmail", e.target.value)}
                onBlur={() => {
                  touch("gmail");
                  setErrors((s) => ({ ...s, gmail: validateFormInputs("gmail") }));
                }}
                helperText={helper("gmail")}
                error={showError("gmail")}
                fullWidth
              />
            </Stack>

            {form.role === "TRAINER" && (
              <TextField
                label="Specialty"
                value={form.specialty}
                onChange={(e) => setField("specialty", e.target.value)}
                onBlur={() => {
                  touch("specialty");
                  setErrors((s) => ({ ...s, specialty: validateFormInputs("specialty") }));
                }}
                helperText={helper("specialty")}
                error={showError("specialty")}
                fullWidth
              />
            )}

            <Stack direction="row" justifyContent="flex-end" spacing={2}>
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