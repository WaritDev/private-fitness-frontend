"use client";

import * as React from "react";
import {
  Box, Container, Stack, Typography, TextField, MenuItem, Button,
  InputAdornment, Paper, Alert, CircularProgress
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import { useRouter, useParams } from "next/navigation";
import { useAlertPopUp } from "@/components/pop-up/AlertPopUpUI";

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" } as const;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type GenderUI  = "M" | "F" | "OTHER";
type GenderAPI = "MALE" | "FEMALE" | "OTHER";
type MaritalStatus = "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";

type ApiNullString = { String: string; Valid: boolean };
type ApiNullBool   = { Bool: boolean; Valid: boolean };

type ApiCustomer = {
  username: string;
  firstName: string;
  lastName: string;
  gender: GenderAPI;
  dateOfBirth: string;
  phoneNumber: string;
  gmail: string;
  isActive: ApiNullBool;

  healthInfo: ApiNullString;
  address: ApiNullString;
  companyName: ApiNullString;
  companyPosition: ApiNullString;
  maritalStatus: ApiNullString;
  emergencyContactName: ApiNullString;
  emergencyContactRelationship: ApiNullString;
  emergencyContactPhone: ApiNullString;
  marketingSource: ApiNullString;
};

const RE_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const RE_PHONE10 = /^[0-9]{10}$/;
const RE_EMAIL   = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
const RE_DATE    = /^\d{4}-\d{2}-\d{2}$/;

const ns = (v?: ApiNullString | null) => (v && v.Valid ? v.String : "");
const nb = (v?: ApiNullBool | null)   => (v && v.Valid ? v.Bool : false);
const toYMD = (s: string) => {
  if (RE_DATE.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${dd}`;
};
const toUIgender  = (g: GenderAPI): GenderUI  => (g === "MALE" ? "M" : g === "FEMALE" ? "F" : "OTHER");
const toAPIgender = (g: GenderUI): GenderAPI => (g === "M" ? "MALE" : g === "F" ? "FEMALE" : "OTHER");
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

const Row2: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => (
  <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
    {children}
  </Stack>
));
Row2.displayName = "Row2";

const Col: React.FC<React.ComponentProps<typeof Box>> = React.memo((props) => (
  <Box sx={{ flex: 1, minWidth: { xs: "100%", md: 320 } }} {...props} />
));
Col.displayName = "Col";

export default function EditCustomerPage(): React.JSX.Element {
  const router = useRouter();
  const { setAlert } = useAlertPopUp();
  const params = useParams<{ u: string }>();
  const username = params?.u || "";

  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [globalErr, setGlobalErr] = React.useState("");

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName]   = React.useState("");
  const [gender, setGender]       = React.useState<GenderUI | "">("");
  const [dateOfBirth, setDateOfBirth] = React.useState<string>("");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [gmail, setGmail] = React.useState("");

  const [isActive, setIsActive] = React.useState<boolean>(true);

  const [healthInfo, setHealthInfo] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [companyPosition, setCompanyPosition] = React.useState("");
  const [maritalStatus, setMaritalStatus] = React.useState<MaritalStatus | "">("");
  const [emergencyContactName, setEmergencyContactName] = React.useState("");
  const [emergencyContactRelationship, setEmergencyContactRelationship] = React.useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = React.useState("");
  const [marketingSource, setMarketingSource] = React.useState("");

  const [newPassword, setNewPassword] = React.useState("");
  const [confirmNewPassword, setConfirmNewPassword] = React.useState("");

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const cutoff = React.useMemo(() => {
    const now = new Date();
    const d = new Date(now.getFullYear() - 14, now.getMonth(), now.getDate());
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const dd = `${d.getDate()}`.padStart(2, "0");
    return { date: d, ymd: `${y}-${m}-${dd}`, en: d.toLocaleDateString("en-GB") };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!username) {
        setNotFound(true); setLoading(false); return;
      }
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/customers/${encodeURIComponent(username)}`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          if (res.status === 404) { setNotFound(true); return; }
          const body = (await res.json().catch(() => ({}))) as { message?: string };
          throw new Error(body?.message || `Load failed (HTTP ${res.status})`);
        }
        const c = (await res.json()) as ApiCustomer;
        if (cancelled) return;

        setFirstName(c.firstName || "");
        setLastName(c.lastName || "");
        setGender(toUIgender(c.gender));
        setDateOfBirth(toYMD(c.dateOfBirth));
        setPhoneNumber(c.phoneNumber || "");
        setGmail(c.gmail || "");
        setIsActive(nb(c.isActive));

        setHealthInfo(ns(c.healthInfo));
        setAddress(ns(c.address));
        setCompanyName(ns(c.companyName));
        setCompanyPosition(ns(c.companyPosition));
        setMaritalStatus((ns(c.maritalStatus) as MaritalStatus) || "");
        setEmergencyContactName(ns(c.emergencyContactName));
        setEmergencyContactRelationship(ns(c.emergencyContactRelationship));
        setEmergencyContactPhone(ns(c.emergencyContactPhone));
        setMarketingSource(ns(c.marketingSource));
      } catch (e) {
        setGlobalErr(errMsg(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [username]);

  const goBack = React.useCallback(() => {
    router.push("/admin/customer-management");
  }, [router]);

  const validateFormInputs = React.useCallback(() => {
    const e: Record<string, string> = {};
    setGlobalErr("");

    if (newPassword || confirmNewPassword) {
      if (!RE_PASSWORD.test(newPassword)) e.newPassword = "Password must be ≥ 8 chars and include a-z, A-Z, 0-9 and a special character.";
      if (confirmNewPassword !== newPassword) e.confirmNewPassword = "Confirm password does not match.";
    }

    if (!firstName.trim()) e.firstName = "Required";
    if (!lastName.trim())  e.lastName  = "Required";

    if (!phoneNumber.trim()) e.phoneNumber = "Required";
    else if (!RE_PHONE10.test(phoneNumber)) e.phoneNumber = "Must be 10 digits.";

    if (!gmail.trim()) e.gmail = "Required";
    else if (!RE_EMAIL.test(gmail.toLowerCase())) e.gmail = "Invalid email address.";

    if (dateOfBirth) {
      if (!RE_DATE.test(dateOfBirth)) e.dateOfBirth = "Use format YYYY-MM-DD.";
      else {
        const dob = new Date(`${dateOfBirth}T00:00:00`);
        if (!(dob < cutoff.date)) e.dateOfBirth = `Must be older than 14 years (before ${cutoff.en}).`;
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [newPassword, confirmNewPassword, firstName, lastName, phoneNumber, gmail, dateOfBirth, cutoff.en, cutoff.date]);

  const onSave = React.useCallback(async () => {
    if (!validateFormInputs()) return;

    const payload: Record<string, unknown> = {
      ...(newPassword && { newPassword, confirmNewPassword }),
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      gender:    gender ? toAPIgender(gender) : undefined,
      dateOfBirth: dateOfBirth || undefined,
      phoneNumber: phoneNumber.trim(),
      gmail:       gmail.trim().toLowerCase(),
      isActive,

      healthInfo:  healthInfo.trim(),
      companyName: companyName.trim(),
      companyPosition: companyPosition.trim(),
      maritalStatus: (maritalStatus || "").trim(),
      address: address.trim(),
      emergencyContactName:         emergencyContactName.trim(),
      emergencyContactRelationship: emergencyContactRelationship.trim(),
      emergencyContactPhone:        emergencyContactPhone.trim(),
      marketingSource:              marketingSource.trim(),
    };

    try {
      const res = await fetch(
        `${API_BASE}/api/customers/${encodeURIComponent(username)}/update`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body?.message || `Update failed (HTTP ${res.status})`);
      }

      let msg = `Customer: ${username} updated successfully`;
      if (res.status !== 204) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        if (body?.message) msg = body.message;
      }

      setAlert({ open: true, msg, severity: "success" });
      router.push("/admin/customer-management");
    } catch (e) {
      setAlert({ open: true, msg: errMsg(e) || "Update failed", severity: "error" });
    }
  }, [
    validateFormInputs, newPassword, confirmNewPassword, firstName, lastName, gender, dateOfBirth,
    phoneNumber, gmail, isActive, healthInfo, companyName, companyPosition, maritalStatus,
    address, emergencyContactName, emergencyContactRelationship, emergencyContactPhone,
    marketingSource, setAlert, router, username
  ]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );
  }
  if (notFound) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>Customer not found: {username}</Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>
          Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={400}>Edit Customer Accounts</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={onSave}
            sx={{ backgroundColor: PRIMARY.main, "&:hover": { backgroundColor: PRIMARY.dark } }}
          >
            Save
          </Button>
        </Stack>
      </Stack>

      {globalErr && <Alert severity="error" sx={{ mb: 2 }}>{globalErr}</Alert>}

      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Row2>
          <Col>
            <TextField label="Username" value={username} fullWidth InputProps={{ readOnly: true }} />
          </Col>
          <Col />
        </Row2>

        <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>Reset Password (Optional)</Typography>
        <Row2>
          <Col>
            <TextField
              label="New Password" type="password" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth placeholder="≥ 8 chars with a-z, A-Z, 0-9 and special character"
              error={!!errors.newPassword} helperText={errors.newPassword}
            />
          </Col>
          <Col>
            <TextField
              label="Confirm New Password" type="password" value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              fullWidth error={!!errors.confirmNewPassword} helperText={errors.confirmNewPassword}
            />
          </Col>
        </Row2>

        <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>Personal Information</Typography>
        <Row2>
          <Col>
            <TextField
              label="First Name" value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              fullWidth error={!!errors.firstName} helperText={errors.firstName}
            />
          </Col>
          <Col>
            <TextField
              label="Last Name" value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              fullWidth error={!!errors.lastName} helperText={errors.lastName}
            />
          </Col>
        </Row2>

        <Row2>
          <Col>
            <TextField
              select label="Gender" value={gender || ""}
              onChange={(e) => setGender(e.target.value as GenderUI)}
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              <MenuItem value="M">Male</MenuItem>
              <MenuItem value="F">Female</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </TextField>
          </Col>
          <Col>
            <TextField
              label="Date of Birth" type="text" value={dateOfBirth || ""}
              onChange={(e) => setDateOfBirth(e.target.value)}
              fullWidth InputLabelProps={{ shrink: true }}
              inputProps={{ max: cutoff.ymd }}
              helperText={errors.dateOfBirth || `YYYY-MM-DD`}
              error={!!errors.dateOfBirth}
            />
          </Col>
        </Row2>

        <Row2>
          <Col>
            <TextField
              select label="Is Active" value={String(isActive)}
              onChange={(e) => setIsActive(e.target.value === "true")}
              fullWidth
            >
              <MenuItem value="true">Active (true)</MenuItem>
              <MenuItem value="false">Inactive (false)</MenuItem>
            </TextField>
          </Col>
          <Col />
        </Row2>

        <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>Contact</Typography>
        <Row2>
          <Col>
            <TextField
              label="Phone Number" value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)} fullWidth
              placeholder="10 digits" error={!!errors.phoneNumber} helperText={errors.phoneNumber}
              InputProps={{ startAdornment: <InputAdornment position="start">+66</InputAdornment> }}
            />
          </Col>
          <Col>
            <TextField
              label="Gmail" value={gmail}
              onChange={(e) => setGmail(e.target.value)} fullWidth
              placeholder="example@gmail.com" error={!!errors.gmail} helperText={errors.gmail}
            />
          </Col>
        </Row2>

        <Box sx={{ mb: 2 }}>
          <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} fullWidth multiline minRows={2} />
        </Box>

        <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>Employment</Typography>
        <Row2>
          <Col><TextField label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} fullWidth /></Col>
          <Col><TextField label="Company Position" value={companyPosition} onChange={(e) => setCompanyPosition(e.target.value)} fullWidth /></Col>
        </Row2>

        <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>Health & Marketing</Typography>
        <Box sx={{ mb: 2 }}>
          <TextField label="Health Info" value={healthInfo} onChange={(e) => setHealthInfo(e.target.value)} fullWidth multiline minRows={2} />
        </Box>

        <Row2>
          <Col>
            <TextField
              select label="Marital Status" value={maritalStatus || ""}
              onChange={(e) => setMaritalStatus(e.target.value as MaritalStatus)} fullWidth
            >
              <MenuItem value="">—</MenuItem>
              <MenuItem value="SINGLE">SINGLE</MenuItem>
              <MenuItem value="MARRIED">MARRIED</MenuItem>
              <MenuItem value="DIVORCED">DIVORCED</MenuItem>
              <MenuItem value="WIDOWED">WIDOWED</MenuItem>
            </TextField>
          </Col>
          <Col>
            <TextField label="Marketing Source" value={marketingSource} onChange={(e) => setMarketingSource(e.target.value)} fullWidth />
          </Col>
        </Row2>

        <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>Emergency Contact</Typography>
        <Row2>
          <Col><TextField label="Name" value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} fullWidth /></Col>
          <Col><TextField label="Relationship" value={emergencyContactRelationship} onChange={(e) => setEmergencyContactRelationship(e.target.value)} fullWidth /></Col>
        </Row2>
        <Row2>
          <Col><TextField label="Phone" value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} fullWidth /></Col>
          <Col />
        </Row2>
      </Paper>

      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={onSave}
          sx={{ backgroundColor: PRIMARY.main, "&:hover": { backgroundColor: PRIMARY.dark } }}
        >
          Save
        </Button>
      </Stack>
    </Container>
  );
}