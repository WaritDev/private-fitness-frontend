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
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
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
  DialogActions,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import SearchIcon from "@mui/icons-material/Search";

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" };

type Order = "asc" | "desc";
type Status = "Active" | "Suspended" | "Expired";
type FilterStatus = "All" | Status;

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  packageName: string; // current membership/package display
  sessions?: number;   // remaining sessions if applicable
  status: Status;
  joinedAt: string;    // ISO date (YYYY-MM-DD)
  expiresAt?: string;  // ISO date or undefined
}

const MOCK: Customer[] = [
  { id: 1, name: "Somchai Prasert", email: "somchai@example.com", phone: "081-234-5678", packageName: "Monthly (30d)", status: "Active", joinedAt: "2025-09-01", expiresAt: "2025-10-01" },
  { id: 2, name: "Warunee Boonmee", email: "warunee@example.com", phone: "089-999-8888", packageName: "10 Sessions", sessions: 6, status: "Active", joinedAt: "2025-08-20" },
  { id: 3, name: "Arthit Meechai", email: "arthit@example.com", phone: "082-777-5555", packageName: "Monthly (30d)", status: "Suspended", joinedAt: "2025-07-10", expiresAt: "2025-08-10" },
  { id: 4, name: "Nok Srikanya", email: "nok@example.com", phone: "064-333-2222", packageName: "PT 20 Sessions", sessions: 12, status: "Active", joinedAt: "2025-06-01" },
  { id: 5, name: "Anon Yingsak", email: "anon@example.com", phone: "090-111-2222", packageName: "Monthly (30d)", status: "Expired", joinedAt: "2025-05-01", expiresAt: "2025-06-01" },
];

export default function AdminCustomers_NoGrid(): React.JSX.Element {
  const [rows, setRows] = React.useState<Customer[]>(MOCK);
  const [search, setSearch] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<FilterStatus>("All");
  const [order, setOrder] = React.useState<Order>("asc");
  const [orderBy, setOrderBy] = React.useState<keyof Customer>("name");
  const [page, setPage] = React.useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = React.useState<number>(5);

  // add/edit dialog state (mock form state lives here)
  const [openEdit, setOpenEdit] = React.useState<Customer | null>(null);

  // --- derived data ---
  const filtered: Customer[] = rows.filter((c) => {
    const q = search.toLowerCase();
    const hit =
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q);
    const okStatus = statusFilter === "All" ? true : c.status === statusFilter;
    return hit && okStatus;
  });

  const sorted: Customer[] = [...filtered].sort((a, b) => {
    const av = String(a[orderBy] ?? "").toLowerCase();
    const bv = String(b[orderBy] ?? "").toLowerCase();
    const cmp = av.localeCompare(bv);
    return order === "asc" ? cmp : -cmp;
  });

  const paged: Customer[] = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // --- handlers ---
  const handleRequestSort = (key: keyof Customer): void => {
    const isAsc = orderBy === key && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(key);
  };

  const handleChangePage = (_: React.MouseEvent<HTMLButtonElement> | null, newPage: number): void => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const onChangeStatusFilter = (e: SelectChangeEvent<FilterStatus>): void => {
    setStatusFilter(e.target.value as FilterStatus);
    setPage(0);
  };

  const softDelete = (id: number): void => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleFreeze = (id: number): void => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: r.status === "Suspended" ? "Active" : "Suspended" } : r
      )
    );
  };

  // --- UI ---
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
        flexWrap="wrap"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" fontWeight={400}>
          จัดการข้อมูลลูกค้า
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ backgroundColor: PRIMARY.main, "&:hover": { backgroundColor: PRIMARY.dark } }}
          onClick={() =>
            setOpenEdit({
              id: 0,
              name: "",
              email: "",
              phone: "",
              packageName: "Monthly (30d)",
              status: "Active",
              joinedAt: new Date().toISOString().slice(0, 10),
            })
          }
        >
          เพิ่มลูกค้า
        </Button>
      </Stack>

      {/* Filters */}
      <Stack direction={{ xs: "column", sm: "row" }} gap={2} sx={{ mb: 2 }}>
        <TextField
          placeholder="ค้นหาชื่อ / อีเมล / เบอร์โทร"
          size="small"
          fullWidth
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="statusFilterLabel">สถานะ</InputLabel>
          <Select<FilterStatus>
            labelId="statusFilterLabel"
            label="สถานะ"
            value={statusFilter}
            onChange={onChangeStatusFilter}
          >
            <MenuItem value="All">ทั้งหมด</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Suspended">Suspended</MenuItem>
            <MenuItem value="Expired">Expired</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              {(
                [
                  { key: "name", label: "ชื่อลูกค้า" },
                  { key: "phone", label: "เบอร์โทร" },
                  { key: "email", label: "อีเมล" },
                  { key: "packageName", label: "แพ็กเกจ/คอร์ส" },
                  { key: "status", label: "สถานะ" },
                  { key: "joinedAt", label: "วันที่เริ่ม" },
                  { key: "expiresAt", label: "หมดอายุ" },
                ] as const
              ).map((col) => (
                <TableCell key={col.key} sx={{ fontWeight: 500 }}>
                  <TableSortLabel
                    active={orderBy === (col.key as keyof Customer)}
                    direction={orderBy === (col.key as keyof Customer) ? order : "asc"}
                    onClick={() => handleRequestSort(col.key as keyof Customer)}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: 500, width: 220 }}>การจัดการ</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paged.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>
                  {c.packageName}
                  {typeof c.sessions === "number" && (
                    <Typography component="span" sx={{ ml: 1 }} color="text.secondary">
                      ({c.sessions} sessions left)
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={c.status}
                    color={
                      c.status === "Active" ? "success" : c.status === "Suspended" ? "warning" : "default"
                    }
                    variant={c.status === "Active" ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell>{c.joinedAt || "-"}</TableCell>
                <TableCell>{c.expiresAt || "-"}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="รายละเอียด">
                      <IconButton size="small" color="primary">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="แก้ไข">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setOpenEdit(c)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={c.status === "Suspended" ? "ปลดระงับ" : "ระงับการใช้งาน"}>
                      <IconButton size="small" color="secondary" onClick={() => toggleFreeze(c.id)}>
                        <AcUnitIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="ลบ">
                      <IconButton size="small" color="error" onClick={() => softDelete(c.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}

            {paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
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

      {/* Add/Edit Dialog (mock form) */}
      <Dialog open={openEdit !== null} onClose={() => setOpenEdit(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{openEdit && openEdit.id ? "แก้ไขลูกค้า" : "เพิ่มลูกค้า"}</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ mt: 1 }}>
            <TextField
              label="ชื่อลูกค้า"
              value={openEdit?.name ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setOpenEdit((v) => (v ? { ...v, name: e.target.value } : v))
              }
              fullWidth
            />
            <TextField
              label="อีเมล"
              value={openEdit?.email ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setOpenEdit((v) => (v ? { ...v, email: e.target.value } : v))
              }
              fullWidth
            />
            <TextField
              label="เบอร์โทร"
              value={openEdit?.phone ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setOpenEdit((v) => (v ? { ...v, phone: e.target.value } : v))
              }
              fullWidth
            />
            <TextField
              label="แพ็กเกจ/คอร์ส"
              value={openEdit?.packageName ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setOpenEdit((v) => (v ? { ...v, packageName: e.target.value } : v))
              }
              fullWidth
            />
            <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
              <TextField
                label="วันที่เริ่ม (YYYY-MM-DD)"
                value={openEdit?.joinedAt ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setOpenEdit((v) => (v ? { ...v, joinedAt: e.target.value } : v))
                }
                fullWidth
              />
              <TextField
                label="หมดอายุ (ถ้ามี)"
                value={openEdit?.expiresAt ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setOpenEdit((v) => (v ? { ...v, expiresAt: e.target.value } : v))
                }
                fullWidth
              />
            </Stack>
            <FormControl fullWidth>
              <InputLabel id="statusLabel">สถานะ</InputLabel>
              <Select<Status>
                labelId="statusLabel"
                label="สถานะ"
                value={openEdit?.status ?? "Active"}
                onChange={(e: SelectChangeEvent<Status>) =>
                  setOpenEdit((v) => (v ? { ...v, status: e.target.value as Status } : v))
                }
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Suspended">Suspended</MenuItem>
                <MenuItem value="Expired">Expired</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(null)}>ยกเลิก</Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: PRIMARY.main, "&:hover": { backgroundColor: PRIMARY.dark } }}
            onClick={() => {
              if (!openEdit) return;
              if (openEdit.id === 0) {
                const nextId = Math.max(0, ...rows.map((r) => r.id)) + 1;
                setRows((prev) => [{ ...openEdit, id: nextId }, ...prev]);
              } else {
                setRows((prev) => prev.map((r) => (r.id === openEdit.id ? openEdit : r)));
              }
              setOpenEdit(null);
            }}
          >
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}