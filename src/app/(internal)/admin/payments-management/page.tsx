"use client";

import * as React from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter, useSearchParams } from "next/navigation";
import ConfirmDialog from "@/components/pop-up/ConfirmDialog";
import { useSnack } from "@/components/snack/SnackProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const PRIMARY = { main: "#38E07A", dark: "#2fbb65" } as const;

// ---------- API Types ----------
type ApiItem = {
  id: number;
  accountName: string;
  accountNumber: string;
  bankName: string;
  qrCodeUrl: string | null;
  isActive: boolean;
};
type ApiMeta = {
  page: number;       // 1-based
  limit: number;
  total_items: number;
  total_pages: number;
};
type ApiResponse = {
  data: ApiItem[];
  meta: ApiMeta;
};

// ---------- UI Row ----------
type PaymentAccount = {
  Payment_Account_Id: number;
  Account_Name: string;
  Account_Number: string;
  Bank_Name: string;
  QR_Code_URL: string | null;
  Is_Active: boolean;
};

// ---------- Helpers ----------
function maskAcct(acct: string) {
  // ปิดเลขกลาง ๆ ไว้: "123-456789-0" -> "123-*****-0" (แบบยืดหยุ่น)
  if (!acct) return "—";
  // คง 3 ตัวต้น และตัวท้ายสุด ที่เหลือเป็น *
  const digits = acct.replace(/\D/g, "");
  if (digits.length < 5) return acct.replace(/\d/g, "*");
  const head = digits.slice(0, 3);
  const tail = digits.slice(-1);
  const masked = `${head}${"*".repeat(Math.max(1, digits.length - 4))}${tail}`;

  // ใส่ขีดง่าย ๆ: 3-*-*-1 (ถ้าอยากคงรูปแบบเดิม ให้ข้ามส่วนนี้)
  return masked;
}

const mapApiToUI = (r: ApiItem): PaymentAccount => ({
  Payment_Account_Id: r.id,
  Account_Name: r.accountName,
  Account_Number: r.accountNumber,
  Bank_Name: r.bankName,
  QR_Code_URL: r.qrCodeUrl,
  Is_Active: r.isActive,
});

export default function PaymentsManagementPage(): React.JSX.Element {
  const router = useRouter();
  const sp = useSearchParams();
  const { setSnack } = useSnack();

  // table + paging
  const [rows, setRows] = React.useState<PaymentAccount[]>([]);
  const [page, setPage] = React.useState(0); // 0-based (UI)
  const rowsPerPage = 10;                    // ตามสเปค

  // meta
  const [totalItems, setTotalItems] = React.useState(0);

  // ui states
  const [loading, setLoading] = React.useState(false);
  const [globalErr, setGlobalErr] = React.useState("");

  // delete confirm
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [target, setTarget] = React.useState<PaymentAccount | null>(null);

  // toast from ?toast=
  React.useEffect(() => {
    const toast = sp.get("toast");
    if (toast) setSnack({ open: true, msg: toast, severity: "success" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const fetchPage = React.useCallback(async () => {
    setLoading(true);
    setGlobalErr("");
    try {
      const apiPage = page + 1; // API เป็น 1-based
      const res = await fetch(`${API_BASE}/api/payments?page=${apiPage}&limit=${rowsPerPage}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        let msg = `โหลดข้อมูลล้มเหลว (HTTP ${res.status})`;
        try {
          const body = (await res.json()) as { message?: string };
          if (body?.message) msg = body.message;
        } catch {}
        throw new Error(msg);
      }
      const body = (await res.json()) as ApiResponse;

      const mapped = body.data.map(mapApiToUI);
      // เรียง Active ก่อน จากนั้น id มาก -> น้อย
      mapped.sort(
        (a, b) =>
          (a.Is_Active === b.Is_Active ? 0 : a.Is_Active ? -1 : 1) ||
          b.Payment_Account_Id - a.Payment_Account_Id
      );

      setRows(mapped);
      setTotalItems(body.meta?.total_items ?? mapped.length);
    } catch (e) {
      setGlobalErr(e instanceof Error ? e.message : String(e));
      setRows([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  React.useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);

  const goAdd = () => router.push("/admin/payments-management/add");
  const goEdit = (row: PaymentAccount) =>
    router.push(`/admin/payments-management/edit/${encodeURIComponent(String(row.Payment_Account_Id))}`);

  const askDelete = (row: PaymentAccount) => {
    setTarget(row);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!target) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/payments/${encodeURIComponent(String(target.Payment_Account_Id))}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) {
        let msg = `Delete failed (HTTP ${res.status})`;
        try {
          const b = (await res.json()) as { message?: string };
          if (b?.message) msg = b.message;
        } catch {}
        throw new Error(msg);
      }

      setSnack({
        open: true,
        msg: `Payment Account: ${target.Payment_Account_Id} deleted successfully`,
        severity: "success",
      });

      // ถ้าหน้านี้เหลือแถวเดียวและไม่ใช่หน้าแรก → ถอยหน้าก่อนเพื่อไม่ให้หน้าโล่ง
      if (rows.length === 1 && page > 0) {
        setPage((p) => p - 1);
      } else {
        await fetchPage();
      }
    } catch (e) {
      setSnack({
        open: true,
        msg: e instanceof Error ? e.message : String(e),
        severity: "error",
      });
    } finally {
      setConfirmOpen(false);
      setTarget(null);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={400}>Payment Accounts</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={goAdd}
          sx={{ backgroundColor: PRIMARY.main, "&:hover": { backgroundColor: PRIMARY.dark } }}
        >
          Add
        </Button>
      </Stack>

      {globalErr && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {globalErr}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ borderRadius: 3, overflowX: "auto", position: "relative" }}>
        {loading && (
          <Stack alignItems="center" justifyContent="center" sx={{ p: 4 }}>
            <CircularProgress />
          </Stack>
        )}

        {!loading && (
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>Account Name</TableCell>
                <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>Account Number</TableCell>
                <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>Bank</TableCell>
                <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>QR</TableCell>
                <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>Active</TableCell>
                <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap", width: 140 }}>การจัดการ</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.Payment_Account_Id} hover>
                  <TableCell>{r.Payment_Account_Id}</TableCell>
                  <TableCell>{r.Account_Name}</TableCell>
                  <TableCell>{maskAcct(r.Account_Number)}</TableCell>
                  <TableCell>{r.Bank_Name}</TableCell>
                  <TableCell>
                    {r.QR_Code_URL ? (
                      <Avatar
                        src={r.QR_Code_URL}
                        alt="qr"
                        sx={{ width: 28, height: 28 }}
                        variant="rounded"
                      />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={r.Is_Active ? "Active" : "Inactive"}
                      size="small"
                      color={r.Is_Active ? "success" : "default"}
                      variant={r.Is_Active ? "filled" : "outlined"}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="แก้ไข">
                        <IconButton size="small" color="primary" onClick={() => goEdit(r)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="ลบ">
                        <IconButton size="small" color="error" onClick={() => askDelete(r)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    ไม่พบข้อมูล
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        <TablePagination
          component="div"
          count={totalItems}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={() => {}}
          rowsPerPageOptions={[10]}
        />
      </TableContainer>

      {/* Confirm ลบ */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="ยืนยันการลบบัญชีรับชำระเงิน"
        message={
          target
            ? `Warning: Deleting payment account ${target.Payment_Account_Id} (${target.Account_Name}) is permanent. Continue?`
            : ""
        }
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}