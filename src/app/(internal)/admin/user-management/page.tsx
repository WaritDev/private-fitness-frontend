"use client";

import * as React from "react";
import {
  Box, Stack, Typography, Button, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Paper, TableSortLabel, TablePagination, Chip,
  IconButton, Tooltip, CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/pop-up/ConfirmDialog";
import { useSnack } from "@/components/snack/SnackProvider";

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" } as const;

type Role = "ADMIN" | "MANAGER" | "TRAINER" | "SALES";
type Gender = "MALE" | "FEMALE" | "OTHER";
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

type ApiNullString = { String: string; Valid: boolean };
type ApiNullBool = { Bool: boolean; Valid: boolean };

type ApiStaff = {
  username: string;
  role: Role;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string; // ISO with TZ
  phoneNumber: string;
  gmail: string;
  specialty: ApiNullString;
  isActive: ApiNullBool;
};

type ApiResponse = {
  data: ApiStaff[];
  meta: { page: number; limit: number; total_items: number; total_pages: number };
  message?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const renderGender = (g?: Gender | null) =>
  g === "MALE" ? "ชาย" : g === "FEMALE" ? "หญิง" : g ? "อื่น ๆ" : "—";

export default function StaffAccounts() {
  const router = useRouter();
  const { setSnack } = useSnack();

  const [rows, setRows] = React.useState<Staff[]>([]);
  const [totalItems, setTotalItems] = React.useState(0);

  const [order, setOrder] = React.useState<Order>("asc");
  const [page, setPage] = React.useState(0); // zero-based
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [loading, setLoading] = React.useState(false);

  const [confirm, setConfirm] = React.useState<{ open: boolean; target?: Staff }>({ open: false });

  const mapStaff = (s: ApiStaff): Staff => ({
    username: s.username,
    role: s.role,
    firstName: s.firstName,
    lastName: s.lastName,
    gender: s.gender ?? null,
    dateOfBirth: s.dateOfBirth ?? null,
    phoneNumber: s.phoneNumber ?? null,
    gmail: s.gmail ?? null,
    specialty: s.specialty?.Valid ? s.specialty.String : null,
    isActive: s.isActive?.Valid ? s.isActive.Bool : false,
  });

  // --- ดึงข้อมูลหน้า (ใช้ซ้ำหลังลบ) ---
  const fetchPage = React.useCallback(async () => {
    setLoading(true);
    const controller = new AbortController();
    try {
      const currentPage = page + 1; // API 1-based
      const url = `${API_BASE}/api/staffs?page=${currentPage}&limit=${rowsPerPage}`;
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      const data = (await res.json().catch(() => ({}))) as Partial<ApiResponse>;

      if (!res.ok) {
        setSnack({
          open: true,
          msg: data?.message || `โหลดข้อมูลล้มเหลว (HTTP ${res.status})`,
          severity: "error",
        });
        setRows([]);
        setTotalItems(0);
        return;
      }

      const items = Array.isArray(data?.data) ? data!.data : [];
      setRows(items.map(mapStaff));
      setTotalItems(data?.meta?.total_items ?? items.length);
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") {
        setSnack({ open: true, msg: e.message || "Network error", severity: "error" });
        setRows([]);
        setTotalItems(0);
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, [page, rowsPerPage, setSnack]);

  // ดึงข้อมูลเมื่อ page/rowsPerPage เปลี่ยน
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await fetchPage();
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  const sorted = React.useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const cmp = a.firstName.localeCompare(b.firstName, "th");
      return order === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [rows, order]);

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
    router.push(`/admin/user-management/edit/${encodeURIComponent(u.username)}`);
  };

  const onDeleteClick = (u: Staff) => setConfirm({ open: true, target: u });

  // DELETE /api/staffs/:username
  const doDelete = async () => {
    const username = confirm.target?.username;
    if (!username) return;

    try {
      const res = await fetch(`${API_BASE}/api/staffs/${encodeURIComponent(username)}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      let successMsg = `Username: ${username} deleted successfully`;
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message || `Delete failed (HTTP ${res.status})`);
      } else if (res.status !== 204) {
        const body = await res.json().catch(() => ({}));
        if (body?.message) successMsg = body.message;
      }

      setSnack({ open: true, msg: successMsg, severity: "success" });
      setConfirm({ open: false });

      const isLastItemOnPage = rows.length === 1 && page > 0;
      if (isLastItemOnPage) {
        setPage((p) => p - 1);
      } else {
        await fetchPage();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Delete failed";
      setSnack({ open: true, msg, severity: "error" });
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3} }}>
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
            {loading && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length + 1} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            )}

            {!loading && sorted.map((u) => (
              <TableRow key={u.username} hover>
                <TableCell>{u.firstName}</TableCell>
                <TableCell>{u.lastName}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>{renderGender(u.gender)}</TableCell>
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

            {!loading && sorted.length === 0 && (
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
          count={totalItems}
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