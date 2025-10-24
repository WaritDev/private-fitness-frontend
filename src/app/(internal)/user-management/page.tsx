"use client";

import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  IconButton,
  Tooltip,
  TextField,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LockResetIcon from "@mui/icons-material/LockReset";

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" };
interface User {
  id: number;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Trainer" | "Member";
  status: "Active" | "Inactive";
}

type Order = "asc" | "desc";

const MOCK: User[] = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "Admin", status: "Active" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "Manager", status: "Inactive" },
  { id: 3, name: "Mark Lee", email: "mark@example.com", role: "Trainer", status: "Active" },
  { id: 4, name: "Alice Brown", email: "alice@example.com", role: "Member", status: "Active" },
  { id: 5, name: "Bob Chan", email: "bob@example.com", role: "Trainer", status: "Inactive" },
  { id: 6, name: "Nina Park", email: "nina@example.com", role: "Manager", status: "Active" },
];

export default function AdminUsers_NoGrid() {
  const [rows, setRows] = React.useState<User[]>(MOCK);
  const [search, setSearch] = React.useState("");
  const [order, setOrder] = React.useState<Order>("asc");
  const [orderBy, setOrderBy] = React.useState<keyof User>("name");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [confirmDelete, setConfirmDelete] = React.useState<User | null>(null);

  const filtered = rows.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const aVal = String(a[orderBy]).toLowerCase();
    const bVal = String(b[orderBy]).toLowerCase();
    const cmp = aVal.localeCompare(bVal);
    return order === "asc" ? cmp : -cmp;
  });

  const paged = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleRequestSort = (property: keyof User) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleDelete = (u: User) => setConfirmDelete(u);
  const confirmDeleteRow = () => {
    if (confirmDelete) setRows((prev) => prev.filter((r) => r.id !== confirmDelete.id));
    setConfirmDelete(null);
  };

  const resetPassword = (u: User) => {
    alert(`Reset password for ${u.email}`);
  };

  const editUser = (u: User) => {
    alert(`Edit user: ${u.name}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={400}>จัดการบัญชีผู้ใช้งาน</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ backgroundColor: PRIMARY.main, '&:hover': { backgroundColor: PRIMARY.dark } }}
          onClick={() => alert("Create user form…")}
        >
          เพิ่มผู้ใช้งาน
        </Button>
      </Stack>

      <TextField
        placeholder="ค้นหาชื่อหรืออีเมล…"
        size="small"
        fullWidth
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        sx={{ mb: 2 }}
      />

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              {([
                { key: "name", label: "ชื่อ" },
                { key: "email", label: "อีเมล" },
                { key: "role", label: "บทบาท" },
                { key: "status", label: "สถานะ" },
              ] as const).map((col) => (
                <TableCell key={col.key} sx={{ fontWeight: 500 }}>
                  <TableSortLabel
                    active={orderBy === col.key}
                    direction={orderBy === col.key ? order : "asc"}
                    onClick={() => handleRequestSort(col.key as keyof User)}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: 500, width: 160 }}>การจัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={u.status}
                    color={u.status === "Active" ? "success" : "default"}
                    variant={u.status === "Active" ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="แก้ไข">
                      <IconButton onClick={() => editUser(u)} color="primary" size="small"><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="รีเซ็ตรหัสผ่าน">
                      <IconButton onClick={() => resetPassword(u)} color="secondary" size="small"><LockResetIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="ลบ">
                      <IconButton onClick={() => handleDelete(u)} color="error" size="small"><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={sorted.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </TableContainer>

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>ลบผู้ใช้งาน</DialogTitle>
        <DialogContent>คุณต้องการลบผู้ใช้ {confirmDelete?.name} หรือไม่?</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>ยกเลิก</Button>
          <Button color="error" variant="contained" onClick={confirmDeleteRow}>ลบ</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}