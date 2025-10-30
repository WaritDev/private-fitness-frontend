"use client";

import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  TableSortLabel,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/pop-up/ConfirmDialog";
import { useSnack } from "@/components/snack/SnackProvider";

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" } as const;

type Role = "ADMIN" | "MANAGER" | "TRAINER" | "SALES";
type Gender = "M" | "F" | "OTHER";
type Order = "asc" | "desc";

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
  { username: "jane.m", role: "MANAGER", firstName: "Jane", lastName: "Moon", gender: "F", dateOfBirth: "1990-03-11", phoneNumber: "080-111-2233", gmail: "jane.m@example.com", specialty: "Ops", isActive: true },
  { username: "john.d", role: "ADMIN", firstName: "John", lastName: "Doe", gender: "M", dateOfBirth: "1989-07-22", phoneNumber: "081-222-3344", gmail: "john.d@example.com", specialty: "Infra", isActive: true },
  { username: "alice.b", role: "TRAINER", firstName: "Alice", lastName: "Brown", gender: "F", dateOfBirth: "1996-01-09", phoneNumber: "089-777-8899", gmail: "alice.b@example.com", specialty: "Yoga", isActive: true },
  { username: "mark.l", role: "TRAINER", firstName: "Mark", lastName: "Lee", gender: "M", dateOfBirth: "1993-12-30", phoneNumber: "086-333-4455", gmail: "mark.l@example.com", specialty: "Strength", isActive: false },
  { username: "nina.p", role: "MANAGER", firstName: "Nina", lastName: "Park", gender: "F", dateOfBirth: "1992-04-15", phoneNumber: "085-555-6677", gmail: "nina.p@example.com", specialty: "Strategy", isActive: true },
  { username: "bob.c", role: "SALES", firstName: "Bob", lastName: "Chan", gender: "M", dateOfBirth: "1995-10-08", phoneNumber: "084-999-0001", gmail: "bob.c@example.com", specialty: "B2B", isActive: false },
  { username: "pam.s", role: "SALES", firstName: "Pam", lastName: "Somsri", gender: "F", dateOfBirth: "1998-02-02", phoneNumber: "083-666-7788", gmail: "pam.s@example.com", specialty: "Retail", isActive: true },
  { username: "krit.t", role: "TRAINER", firstName: "Krit", lastName: "Tana", gender: "M", dateOfBirth: "1994-05-25", phoneNumber: "082-111-2223", gmail: "krit.t@example.com", specialty: "HIIT", isActive: true },
  { username: "ploy.k", role: "TRAINER", firstName: "Ploy", lastName: "Kawin", gender: "F", dateOfBirth: "1997-06-14", phoneNumber: "081-999-1234", gmail: "ploy.k@example.com", specialty: "Pilates", isActive: false },
  { username: "anong.m", role: "ADMIN", firstName: "Anong", lastName: "Manee", gender: "F", dateOfBirth: "1987-09-19", phoneNumber: "080-333-5544", gmail: "anong.m@example.com", specialty: "Security", isActive: true },
  { username: "boss.z", role: "MANAGER", firstName: "Boss", lastName: "Zhang", gender: "M", dateOfBirth: "1985-11-03", phoneNumber: "089-212-4545", gmail: "boss.z@example.com", specialty: "Finance", isActive: true },
  { username: "fon.w", role: "SALES", firstName: "Fon", lastName: "Wipa", gender: "F", dateOfBirth: "1999-08-08", phoneNumber: "086-120-3040", gmail: "fon.w@example.com", specialty: "Online", isActive: true },
  { username: "ice.k", role: "TRAINER", firstName: "Ice", lastName: "Korn", gender: "OTHER", dateOfBirth: "1996-07-01", phoneNumber: "088-223-3344", gmail: "ice.k@example.com", specialty: "Mobility", isActive: true },
  { username: "mike.t", role: "SALES", firstName: "Mike", lastName: "Tan", gender: "M", dateOfBirth: "1991-02-27", phoneNumber: "083-333-4445", gmail: "mike.t@example.com", specialty: "Partners", isActive: false },
  { username: "noon.n", role: "TRAINER", firstName: "Noon", lastName: "Nita", gender: "F", dateOfBirth: "1994-03-03", phoneNumber: "087-888-9990", gmail: "noon.n@example.com", specialty: "Dance", isActive: true },
  { username: "oak.r", role: "MANAGER", firstName: "Oak", lastName: "Rit", gender: "M", dateOfBirth: "1990-10-10", phoneNumber: "086-777-9090", gmail: "oak.r@example.com", specialty: "HR", isActive: true },
  { username: "ploys.h", role: "SALES", firstName: "Ploys", lastName: "Hong", gender: "F", dateOfBirth: "1998-12-12", phoneNumber: "082-555-6666", gmail: "ploys.h@example.com", specialty: "Events", isActive: true },
  { username: "yui.c", role: "TRAINER", firstName: "Yui", lastName: "Chaya", gender: "F", dateOfBirth: "1993-01-15", phoneNumber: "089-333-3232", gmail: "yui.c@example.com", specialty: "Cardio", isActive: true },
];

const COLUMNS = [
  { key: "firstName", label: "ชื่อ", sortable: true },
  { key: "lastName", label: "นามสกุล", sortable: false },
  { key: "username", label: "Username", sortable: false },
  { key: "role", label: "บทบาท", sortable: false },
  { key: "gender", label: "เพศ", sortable: false },
  { key: "dateOfBirth", label: "วันเกิด", sortable: false },
  { key: "phoneNumber", label: "โทรศัพท์", sortable: false },
  { key: "gmail", label: "Gmail", sortable: false },
  { key: "specialty", label: "ความถนัด", sortable: false },
  { key: "isActive", label: "สถานะ", sortable: false },
] as const;

export default function StaffAccountsMockOnlyFirstNameSort() {
  const [rows, setRows] = React.useState<Staff[]>(MOCK);
  const [order, setOrder] = React.useState<Order>("asc");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const router = useRouter();

  const [confirm, setConfirm] = React.useState<{ open: boolean; target?: Staff }>({ open: false });

  const { setSnack } = useSnack();

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

  const formatDOB = (iso?: string | null) => {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleDateString("th-TH"); } catch { return "—"; }
  };

  const goEdit = (u: Staff) => {
    router.push(`/admin/user-management/edit?u=${encodeURIComponent(u.username)}`);
  };

  const onDeleteClick = (u: Staff) => setConfirm({ open: true, target: u });

  const doDelete = async () => {
    await new Promise((r) => setTimeout(r, 300));
    const username = confirm.target?.username;
    if (!username) return;

    setRows((prev) => prev.filter((it) => it.username !== username));

    setSnack({
      open: true,
      msg: `Username: ${username} deleted successfully`,
      severity: "success",
    });

    setConfirm({ open: false });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={400}>จัดการบัญชีผู้ใช้งาน</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ backgroundColor: PRIMARY.main, "&:hover": { backgroundColor: PRIMARY.dark } }}
          onClick={() => router.push("/admin/user-management/add")}
        >
          เพิ่มผู้ใช้งาน
        </Button>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: 3, overflowX: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {COLUMNS.map((c) => (
                <TableCell key={c.key} sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                  {c.key === "firstName" ? (
                    <TableSortLabel
                      active
                      direction={order}
                      onClick={() => setOrder((o) => (o === "asc" ? "desc" : "asc"))}
                    >
                      {c.label}
                    </TableSortLabel>
                  ) : (
                    c.label
                  )}
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap", width: 140 }}>
                การจัดการ
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paged.map((u) => (
              <TableRow key={u.username} hover>
                <TableCell>{u.firstName}</TableCell>
                <TableCell>{u.lastName}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>{u.gender === "M" ? "ชาย" : u.gender === "F" ? "หญิง" : u.gender ? "อื่น ๆ" : "—"}</TableCell>
                <TableCell>{formatDOB(u.dateOfBirth)}</TableCell>
                <TableCell>{u.phoneNumber || "—"}</TableCell>
                <TableCell>{u.gmail || "—"}</TableCell>
                <TableCell>{u.role === "TRAINER" ? (u.specialty || "—") : "ไม่มี"}</TableCell>
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
                      <IconButton size="small" color="error" onClick={() => onDeleteClick(u)}>
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

        <TablePagination
          component="div"
          count={rows.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10]}
        />
      </TableContainer>

      <ConfirmDialog
        open={confirm.open}
        title="ยืนยันการลบผู้ใช้งาน"
        message={
          <>
            Warning: Are you sure you want to delete user: <b>{confirm.target?.username}</b> ?
            <br />
            บทบาท: <b>{confirm.target?.role}</b>
          </>
        }
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={doDelete}
        onClose={() => setConfirm({ open: false })}
      />
    </Box>
  );
}