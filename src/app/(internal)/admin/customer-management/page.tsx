"use client";

import * as React from "react";
import {
  Box, Stack, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
  TableSortLabel, TablePagination, Chip, IconButton, Tooltip
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/pop-up/ConfirmDialog";
import { useSnack } from "@/components/snack/SnackProvider";

type Gender = "M" | "F" | "OTHER";
type Order = "asc" | "desc";
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
};

const MOCK: Customer[] = [
  { username: "c.ploy", firstName: "Ploy", lastName: "Kawin", gender: "F", dateOfBirth: "1998-05-01", phoneNumber: "0811111111", gmail: "c.ploy@example.com", address: "Bangkok", maritalStatus: "SINGLE", marketingSource: "Facebook", isActive: true },
  { username: "c.noon", firstName: "Noon", lastName: "Nita", gender: "F", dateOfBirth: "1996-03-03", phoneNumber: "0822222222", gmail: "c.noon@example.com", address: "Nonthaburi", maritalStatus: "MARRIED", marketingSource: "Walk-in", isActive: true },
  { username: "c.oak", firstName: "Oak", lastName: "Rit", gender: "M", dateOfBirth: "1990-10-10", phoneNumber: "0833333333", gmail: "c.oak@example.com", companyName: "ACME", companyPosition: "Engineer", isActive: false },
];

const COLUMNS = [
  { key: "firstName", label: "ชื่อ", sortable: true },
  { key: "lastName", label: "นามสกุล", sortable: false },
  { key: "username", label: "Username", sortable: false },
  { key: "gender", label: "เพศ", sortable: false },
  { key: "dateOfBirth", label: "วันเกิด", sortable: false },
  { key: "phoneNumber", label: "โทรศัพท์", sortable: false },
  { key: "gmail", label: "Gmail", sortable: false },
  { key: "healthInfo", label: "สุขภาพ", sortable: false },
  { key: "address", label: "ที่อยู่", sortable: false },
  { key: "companyName", label: "บริษัท", sortable: false },
  { key: "companyPosition", label: "ตำแหน่ง", sortable: false },
  { key: "maritalStatus", label: "สถานภาพสมรส", sortable: false },
  { key: "emergencyContactName", label: "ผู้ติดต่อฉุกเฉิน", sortable: false },
  { key: "emergencyContactRelationship", label: "ความสัมพันธ์", sortable: false },
  { key: "emergencyContactPhone", label: "เบอร์ติดต่อฉุกเฉิน", sortable: false },
  { key: "marketingSource", label: "ช่องทางการตลาด", sortable: false },
  { key: "isActive", label: "สถานะ", sortable: false },
] as const;

export default function CustomersListPage() {
  const router = useRouter();
  const { setSnack } = useSnack();

  const [rows, setRows] = React.useState<Customer[]>(MOCK);
  const [order, setOrder] = React.useState<Order>("asc");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [targetUser, setTargetUser] = React.useState<Customer | null>(null);

  const fmt = (v?: string | null) => (v && v.trim() !== "" ? v : "—");
  const fmtDate = (iso?: string | null) => {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleDateString("th-TH"); } catch { return "—"; }
  };
  const fmtGender = (g?: Gender | null) => g === "M" ? "ชาย" : g === "F" ? "หญิง" : g ? "อื่น ๆ" : "—";
  const fmtMarital = (m?: MaritalStatus | null) =>
    m === "SINGLE" ? "โสด" :
    m === "MARRIED" ? "สมรส" :
    m === "DIVORCED" ? "หย่า" :
    m === "WIDOWED" ? "หม้าย" : "—";

  const sorted = React.useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const cmp = a.firstName.localeCompare(b.firstName, "th");
      return order === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [rows, order]);

  const paged = React.useMemo(
    () => sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sorted, page, rowsPerPage]
  );

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const goEdit = (u: Customer) =>
    router.push(`/admin/customer-management/edit?u=${encodeURIComponent(u.username)}`);

  const askDelete = (u: Customer) => {
    setTargetUser(u);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (targetUser) {
      setRows((prev) => prev.filter((r) => r.username !== targetUser.username));
      // ✅ แจ้งผ่าน SnackProvider ตามมาตรฐานโปรเจ็กต์
      setSnack({
        open: true,
        msg: `Username: ${targetUser.username} deleted successfully`,
        severity: "success",
      });
    }
    setConfirmOpen(false);
    setTargetUser(null);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} gap={2} flexWrap="wrap">
        <Typography variant="h5" fontWeight={400}>Customer Accounts</Typography>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: 3, overflowX: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {COLUMNS.map((c) => (
                <TableCell key={c.key as string} sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                  {c.key === "firstName" ? (
                    <TableSortLabel
                      active
                      direction={order}
                      onClick={() => setOrder((o) => (o === "asc" ? "desc" : "asc"))}
                    >
                      {c.label}
                    </TableSortLabel>
                  ) : c.label}
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap", width: 140 }}>การจัดการ</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paged.map((u) => (
              <TableRow key={u.username} hover>
                <TableCell>{fmt(u.firstName)}</TableCell>
                <TableCell>{fmt(u.lastName)}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell>{fmtGender(u.gender)}</TableCell>
                <TableCell>{fmtDate(u.dateOfBirth)}</TableCell>
                <TableCell>{fmt(u.phoneNumber)}</TableCell>
                <TableCell>{fmt(u.gmail)}</TableCell>
                <TableCell>{fmt(u.healthInfo)}</TableCell>
                <TableCell>{fmt(u.address)}</TableCell>
                <TableCell>{fmt(u.companyName)}</TableCell>
                <TableCell>{fmt(u.companyPosition)}</TableCell>
                <TableCell>{fmtMarital(u.maritalStatus)}</TableCell>
                <TableCell>{fmt(u.emergencyContactName)}</TableCell>
                <TableCell>{fmt(u.emergencyContactRelationship)}</TableCell>
                <TableCell>{fmt(u.emergencyContactPhone)}</TableCell>
                <TableCell>{fmt(u.marketingSource)}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={u.isActive ? "Active" : "Inactive"}
                    color={u.isActive ? "success" : "default"}
                    variant={u.isActive ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="แก้ไข">
                      <IconButton size="small" color="primary" onClick={() => goEdit(u)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="ลบ">
                      <IconButton size="small" color="error" onClick={() => askDelete(u)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}

            {paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length + 1} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
        <TablePagination
          component="div"
          count={sorted.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10]}
        />
      </Box>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="ยืนยันการลบลูกค้า"
        message={
          targetUser
            ? `Warning: Deleting this customer will permanently remove all associated data (memberships, sessions, logs, etc.). Are you sure you want to delete customer: ${targetUser.username}?`
            : ""
        }
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}