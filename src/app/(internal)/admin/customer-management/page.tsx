"use client";

import * as React from "react";
import {
  Box, Stack, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
  TableSortLabel, TablePagination, Chip, IconButton, Tooltip, CircularProgress
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/pop-up/ConfirmDialog";
import { useSnack } from "@/components/snack/SnackProvider";

type Order = "asc" | "desc";
type GenderAPI = "MALE" | "FEMALE" | "OTHER";
type MaritalStatus = "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";

type ApiCustomer = {
  username: string;
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: string;            // ISO with TZ หรือ YYYY-MM-DD
  phoneNumber: string;
  gmail: string;

  // ⬇️ จาก ApiNullString → string ปกติ
  healthInfo: string;
  address: string;
  companyName: string;
  companyPosition: string;
  maritalStatus: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  marketingSource: string;

  // อันนี้ยังคงเป็น NullBool ตาม BE
  isActive: { Bool: boolean; Valid: boolean };
};

type ApiResponse = {
  data: ApiCustomer[];
  meta: { page: number; limit: number; total_items: number; total_pages: number };
  message?: string;
};

type Customer = {
  username: string;
  firstName: string;
  lastName: string;
  gender?: GenderAPI | null;
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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function CustomersListPage() {
  const router = useRouter();
  const { setSnack } = useSnack();

  const [rows, setRows] = React.useState<Customer[]>([]);
  const [totalItems, setTotalItems] = React.useState(0);

  const [order, setOrder] = React.useState<Order>("asc");
  const [page, setPage] = React.useState(0);         // zero-based
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [loading, setLoading] = React.useState(false);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [targetUser, setTargetUser] = React.useState<Customer | null>(null);

  const fmt = (v?: string | null) => (v && v.trim() !== "" ? v : "—");
  const fmtDate = (iso?: string | null) => {
    if (!iso) return "—";
    const d = /\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("th-TH");
  };
  const fmtGender = (g?: GenderAPI | null) => g === "MALE" ? "ชาย" : g === "FEMALE" ? "หญิง" : g ? "อื่น ๆ" : "—";
  const fmtMarital = (m?: MaritalStatus | null) =>
    m === "SINGLE" ? "โสด" :
    m === "MARRIED" ? "สมรส" :
    m === "DIVORCED" ? "หย่า" :
    m === "WIDOWED" ? "หม้าย" : "—";

const mapCustomer = (c: ApiCustomer): Customer => ({
  username: c.username,
  firstName: c.firstName,
  lastName: c.lastName,
  gender: c.gender ?? null,
  dateOfBirth: c.dateOfBirth ?? null,
  phoneNumber: c.phoneNumber,
  gmail: c.gmail,

  healthInfo: c.healthInfo || null,
  address: c.address || null,
  companyName: c.companyName || null,
  companyPosition: c.companyPosition || null,
  maritalStatus: (c.maritalStatus ?? null) as MaritalStatus | null,
  emergencyContactName: c.emergencyContactName || null,
  emergencyContactRelationship: c.emergencyContactRelationship || null,
  emergencyContactPhone: c.emergencyContactPhone || null,
  marketingSource: c.marketingSource || null,

  isActive: c.isActive?.Valid ? c.isActive.Bool : false,
});
  // โหลดข้อมูลจาก BE
  const fetchPage = React.useCallback(async () => {
    setLoading(true);
    const currentPage = page + 1; // API 1-based
    try {
      const res = await fetch(`${API_BASE}/api/customers?page=${currentPage}&limit=${rowsPerPage}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const body = (await res.json().catch(() => ({}))) as Partial<ApiResponse>;
      if (!res.ok) {
        throw new Error(body?.message || `โหลดข้อมูลล้มเหลว (HTTP ${res.status})`);
      }

      const items = Array.isArray(body?.data) ? body!.data : [];
      setRows(items.map(mapCustomer));
      setTotalItems(body?.meta?.total_items ?? items.length);
    } catch (e: unknown) {
      setSnack({ open: true, msg: errorMessage(e) || "Network error", severity: "error" });
      setRows([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, setSnack]);

  React.useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  // sort ชื่อภายในหน้า
  const sorted = React.useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const cmp = a.firstName.localeCompare(b.firstName, "th");
      return order === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [rows, order]);

  const handleChangePage = (_: React.MouseEvent<HTMLButtonElement> | null, newPage: number): void => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // ไปหน้าแก้ไขแบบ dynamic segment: /admin/customer-management/edit/[u]
  const goEdit = (u: Customer) =>
    router.push(`/admin/customer-management/edit/${encodeURIComponent(u.username)}`);

  const askDelete = (u: Customer) => { setTargetUser(u); setConfirmOpen(true); };

  // DELETE /api/customers/:username
  const handleConfirmDelete = async () => {
    if (!targetUser) return;
    try {
      const res = await fetch(`${API_BASE}/api/customers/${encodeURIComponent(targetUser.username)}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      let msg = `Username: ${targetUser.username} deleted successfully`;
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err?.message || `Delete failed (HTTP ${res.status})`);
      } else if (res.status !== 204) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        if (body?.message) msg = body.message;
      }

      setSnack({ open: true, msg, severity: "success" });
      setConfirmOpen(false);
      setTargetUser(null);

      // ถ้าลบแถวสุดท้ายของหน้าและไม่ใช่หน้าแรก → ถอยหน้าลง 1 ก่อนค่อยรีเฟช
      if (rows.length === 1 && page > 0) {
        setPage((p) => p - 1);
      } else {
        await fetchPage();
      }
    } catch (e: unknown) {
      setSnack({ open: true, msg: errorMessage(e) || "Delete failed", severity: "error" });
      setConfirmOpen(false);
      setTargetUser(null);
    }
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
            {loading && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length + 1} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            )}

            {!loading && sorted.map((u) => (
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

            {!loading && sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={totalItems}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Box>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="ยืนยันการลบลูกค้า"
        message={
          targetUser
            ? <>Warning: การลบจะลบข้อมูลที่เกี่ยวข้องทั้งหมดด้วย<br/>ยืนยันลบลูกค้า: <b>{targetUser.username}</b> ?</>
            : ""
        }
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}

// ---------- utils (UI-only) ----------
function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  try { return JSON.stringify(e); } catch { return String(e); }
}