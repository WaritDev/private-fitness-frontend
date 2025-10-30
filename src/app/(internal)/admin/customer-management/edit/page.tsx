"use client";

import * as React from "react";
import {
  Box, Container, Stack, Typography, TextField, MenuItem, Button,
  FormControlLabel, Switch, InputAdornment, Paper, Alert
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import { useRouter, useSearchParams } from "next/navigation";
import { useSnack } from "@/components/snack/SnackProvider";

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" } as const;

type Gender = "M" | "F" | "OTHER";
type Role = "TRAINER" | "SALES" | "MANAGER" | "ADMIN";
type MaritalStatus = "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";

type Customer = {
  username: string;
  firstName: string;
  lastName: string;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  phoneNumber: string;
  gmail: string;
  healthInfo?: string | null;
  address?: string | null;
  companyName?: string | null;
  companyPosition?: string | null;
  maritalStatus?: MaritalStatus | null;
  emergencyContactName?: string | null;
  emergencyContactRelationship?: string | null;
  emergencyContactPhone?: string | null;
  marketingSource?: string | null;
  isActive: boolean;
  role?: Role | null;
  specialty?: string | null;
};

// MOCK
const MOCK: Customer[] = [
  { username: "c.ploy", firstName: "Ploy", lastName: "Kawin", gender: "F", dateOfBirth: "1998-05-01", phoneNumber: "0811111111", gmail: "c.ploy@example.com", address: "Bangkok", maritalStatus: "SINGLE", marketingSource: "Facebook", isActive: true, role: "SALES" },
  { username: "c.noon", firstName: "Noon", lastName: "Nita", gender: "F", dateOfBirth: "1996-03-03", phoneNumber: "0822222222", gmail: "c.noon@example.com", address: "Nonthaburi", maritalStatus: "MARRIED", marketingSource: "Walk-in", isActive: true, role: "TRAINER", specialty: "Yoga" },
  { username: "c.oak", firstName: "Oak", lastName: "Rit", gender: "M", dateOfBirth: "1990-10-10", phoneNumber: "0833333333", gmail: "c.oak@example.com", companyName: "ACME", companyPosition: "Engineer", isActive: false, role: "MANAGER" },
];

const RE_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const RE_PHONE10 = /^[0-9]{10}$/;
const RE_EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

export default function EditCustomerPage(): React.JSX.Element {
  const router = useRouter();
  const sp = useSearchParams();
  const { setSnack } = useSnack();           // ✅ ใช้ SnackProvider
  const username = sp.get("u") || "";

  const [notFound, setNotFound] = React.useState(false);
  const [globalErr, setGlobalErr] = React.useState("");

  // ฟิลด์หลัก
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [gender, setGender] = React.useState<Gender | "">("");
  const [dateOfBirth, setDateOfBirth] = React.useState<string>("");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [gmail, setGmail] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);

  // เพิ่มเติม (Customer)
  const [healthInfo, setHealthInfo] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [companyPosition, setCompanyPosition] = React.useState("");
  const [maritalStatus, setMaritalStatus] = React.useState<MaritalStatus | "">("");
  const [emergencyContactName, setEmergencyContactName] = React.useState("");
  const [emergencyContactRelationship, setEmergencyContactRelationship] = React.useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = React.useState("");
  const [marketingSource, setMarketingSource] = React.useState("");

  // Use Case: Role/Specialty
  const [role, setRole] = React.useState<Role | "">("");
  const [specialty, setSpecialty] = React.useState("");

  // Reset password (optional)
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmNewPassword, setConfirmNewPassword] = React.useState("");

  // errors
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const found = MOCK.find((c) => c.username === username);
    if (!found) {
      setNotFound(true);
      return;
    }
    setFirstName(found.firstName || "");
    setLastName(found.lastName || "");
    setGender(found.gender || "");
    setDateOfBirth(found.dateOfBirth || "");
    setPhoneNumber(found.phoneNumber || "");
    setGmail(found.gmail || "");
    setIsActive(found.isActive);

    setHealthInfo(found.healthInfo || "");
    setAddress(found.address || "");
    setCompanyName(found.companyName || "");
    setCompanyPosition(found.companyPosition || "");
    setMaritalStatus(found.maritalStatus || "");
    setEmergencyContactName(found.emergencyContactName || "");
    setEmergencyContactRelationship(found.emergencyContactRelationship || "");
    setEmergencyContactPhone(found.emergencyContactPhone || "");
    setMarketingSource(found.marketingSource || "");

    setRole(found.role || "");
    setSpecialty(found.specialty || "");
  }, [username]);

  const goBack = () => router.push("/admin/customer-management");

  const validate = () => {
    const e: Record<string, string> = {};
    setGlobalErr("");

    if (newPassword || confirmNewPassword) {
      if (!RE_PASSWORD.test(newPassword)) e.newPassword = "รหัสผ่านต้องยาว ≥ 8 ตัว มีตัวพิมพ์เล็ก/ใหญ่ ตัวเลข และอักขระพิเศษ";
      if (confirmNewPassword !== newPassword) e.confirmNewPassword = "รหัสยืนยันไม่ตรงกับรหัสผ่านใหม่";
    }

    if (!firstName.trim()) e.firstName = "ห้ามว่าง";
    if (!lastName.trim()) e.lastName = "ห้ามว่าง";

    if (!phoneNumber.trim()) e.phoneNumber = "ห้ามว่าง";
    else if (!RE_PHONE10.test(phoneNumber)) e.phoneNumber = "กรอกเป็นตัวเลข 10 หลัก";

    if (!gmail.trim()) e.gmail = "ห้ามว่าง";
    else if (!RE_EMAIL.test(gmail.toLowerCase())) e.gmail = "อีเมลไม่ถูกต้อง";

    // Duplicate ใน MOCK (ยกเว้น record ปัจจุบัน)
    const lowerMail = gmail.toLowerCase();
    const phoneDup = MOCK.some((c) => c.username !== username && c.phoneNumber === phoneNumber);
    if (phoneDup) e.phoneNumber = "เบอร์นี้ถูกใช้แล้ว";
    const emailDup = MOCK.some((c) => c.username !== username && c.gmail.toLowerCase() === lowerMail);
    if (emailDup) e.gmail = "อีเมลนี้ถูกใช้แล้ว";

    if (!role) e.role = "กรุณาเลือกบทบาท";
    if (role === "TRAINER" && !specialty.trim()) e.specialty = "กรุณาระบุความถนัดสำหรับ TRAINER";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = () => {
    if (!validate()) return;

    // ✅ แจ้งเตือนด้วย SnackProvider ตามมาตรฐานโปรเจ็กต์ แล้ว redirect
    setSnack({
      open: true,
      msg: `Customer: ${username} updated successfully`,
      severity: "success",
    });
    router.push("/admin/customer-management");
  };

  if (notFound) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>ไม่พบผู้ใช้ {username}</Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>
          กลับ
        </Button>
      </Container>
    );
  }

  const Row2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
      {children}
    </Stack>
  );
  const Col = (props: React.ComponentProps<typeof Box>) => (
    <Box sx={{ flex: 1, minWidth: { xs: "100%", md: 320 } }} {...props} />
  );

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={400}>Edit Customer: {username}</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>
            ยกเลิก
          </Button>
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
          <Col>
            <TextField
              select label="Role" value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              fullWidth error={!!errors.role} helperText={errors.role}
            >
              <MenuItem value="TRAINER">TRAINER</MenuItem>
              <MenuItem value="SALES">SALES</MenuItem>
              <MenuItem value="MANAGER">MANAGER</MenuItem>
              <MenuItem value="ADMIN">ADMIN</MenuItem>
            </TextField>
          </Col>
        </Row2>

        {role === "TRAINER" && (
          <Row2>
            <Col>
              <TextField
                label="Specialty" value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                fullWidth error={!!errors.specialty}
                helperText={errors.specialty || "ระบุความถนัด (เช่น Yoga, HIIT)"}
              />
            </Col>
            <Col />
          </Row2>
        )}

        <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>Reset Password (Optional)</Typography>
        <Row2>
          <Col>
            <TextField
              label="New Password" type="password" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth placeholder="≥ 8 ตัว รวม a-z, A-Z, ตัวเลข, อักขระพิเศษ"
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

        <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>ข้อมูลส่วนตัว</Typography>
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
              onChange={(e) => setGender(e.target.value as Gender)}
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
              label="Date of Birth" type="date" value={dateOfBirth || ""}
              onChange={(e) => setDateOfBirth(e.target.value)}
              fullWidth InputLabelProps={{ shrink: true }}
            />
          </Col>
        </Row2>

        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} color="success" />}
            label={isActive ? "ใช้งาน (Is Active)" : "ปิดใช้งาน (Inactive)"}
          />
        </Box>

        <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>การติดต่อ</Typography>
        <Row2>
          <Col>
            <TextField
              label="Phone Number" value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)} fullWidth
              placeholder="ตัวเลข 10 หลัก" error={!!errors.phoneNumber} helperText={errors.phoneNumber}
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

        <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>ข้อมูลการทำงาน</Typography>
        <Row2>
          <Col><TextField label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} fullWidth /></Col>
          <Col><TextField label="Company Position" value={companyPosition} onChange={(e) => setCompanyPosition(e.target.value)} fullWidth /></Col>
        </Row2>

        <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>สุขภาพ & การตลาด</Typography>
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

        <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>ผู้ติดต่อฉุกเฉิน</Typography>
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
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>ยกเลิก</Button>
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