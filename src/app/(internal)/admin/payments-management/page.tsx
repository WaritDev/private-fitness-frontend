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
import ConfirmDialog from "@/components/pop-up/ConfirmPopUpUI";
import { useAlertPopUp } from "@/components/pop-up/AlertPopUpUI";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" } as const;
const TOKENS = {
  heading: { variant: "h5" as const, weight: 500 as const },
  table: { headerFontWeight: 600 as const, actionsColWidth: 140, cellY: 1.25 },
  button: { height: 40, borderRadius: 10 },
  spacing: { sectionY: 3 },
};

type ApiItem = {
  id: number;
  accountName: string;
  accountNumber: string;
  bankName: string;
  qrCodeUrl: string | null;
  isActive: boolean;
};
type ApiResponse = {
  data: ApiItem[];
  message?: string;
};

type PaymentAccount = {
  Payment_Account_Id: number;
  Account_Name: string;
  Account_Number: string;
  Bank_Name: string;
  QR_Code_URL: string | null;
  Is_Active: boolean;
};

function maskAcct(acct: string) {
  if (!acct) return "—";
  const digits = acct.replace(/\D/g, "");
  if (digits.length < 5) return acct.replace(/\d/g, "*");
  const head = digits.slice(0, 3);
  const tail = digits.slice(-1);
  return `${head}${"*".repeat(Math.max(1, digits.length - 4))}${tail}`;
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
  const { setAlert } = useAlertPopUp();

  const [allRows, setAllRows] = React.useState<PaymentAccount[]>([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const [loading, setLoading] = React.useState(false);
  const [globalErr, setGlobalErr] = React.useState("");

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [target, setTarget] = React.useState<PaymentAccount | null>(null);

  React.useEffect(() => {
    const toast = sp.get("toast");
    if (toast) setAlert({ open: true, msg: toast, severity: "success" });
  }, [sp, setAlert]);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    setGlobalErr("");
    try {
      const res = await fetch(`${API_BASE}/api/payments`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const body = (await res.json().catch(() => null)) as ApiResponse | null;
      if (!res.ok) {
        const msg = (body && body.message) || `Failed to load data (HTTP ${res.status})`;
        throw new Error(msg);
      }
      const mapped = (body?.data ?? []).map(mapApiToUI);
      mapped.sort(
        (a, b) =>
          (a.Is_Active === b.Is_Active ? 0 : a.Is_Active ? -1 : 1) ||
          b.Payment_Account_Id - a.Payment_Account_Id
      );
      setAllRows(mapped);
      setPage((p) => {
        const maxPage = Math.max(0, Math.ceil(mapped.length / rowsPerPage) - 1);
        return p > maxPage ? maxPage : p;
      });
    } catch (e) {
      setGlobalErr(e instanceof Error ? e.message : String(e));
      setAllRows([]);
      setPage(0);
    } finally {
      setLoading(false);
    }
  }, [rowsPerPage]);

  React.useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const totalItems = allRows.length;
  const pagedRows = React.useMemo(() => {
    const start = page * rowsPerPage;
    return allRows.slice(start, start + rowsPerPage);
  }, [allRows, page, rowsPerPage]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(e.target.value);
    setRowsPerPage(next);
    setPage(0);
  };

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
        const b = (await res.json().catch(() => null)) as { message?: string } | null;
        const msg = b?.message || `Delete failed (HTTP ${res.status})`;
        throw new Error(msg);
      }

      setAlert({
        open: true,
        msg: `Payment Account: ${target.Payment_Account_Id} deleted successfully`,
        severity: "success",
      });

      setAllRows((prev) => {
        const next = prev.filter((x) => x.Payment_Account_Id !== target.Payment_Account_Id);
        const maxPage = Math.max(0, Math.ceil(next.length / rowsPerPage) - 1);
        setPage((p) => (p > maxPage ? maxPage : p));
        return next;
      });
    } catch (e) {
      setAlert({
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
    <Box sx={{ p: { xs: 2, md: TOKENS.spacing.sectionY } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} gap={2} flexWrap="wrap">
        <Typography variant={TOKENS.heading.variant} fontWeight={TOKENS.heading.weight}>
          Payment Accounts
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={goAdd}
          sx={{
            height: TOKENS.button.height,
            borderRadius: TOKENS.button.borderRadius,
            backgroundColor: PRIMARY.main,
            "&:hover": { backgroundColor: PRIMARY.dark },
          }}
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
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ p: 4 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: TOKENS.table.headerFontWeight, whiteSpace: "nowrap", py: TOKENS.table.cellY }}>
                  ID
                </TableCell>
                <TableCell sx={{ fontWeight: TOKENS.table.headerFontWeight, whiteSpace: "nowrap", py: TOKENS.table.cellY }}>
                  Account Name
                </TableCell>
                <TableCell sx={{ fontWeight: TOKENS.table.headerFontWeight, whiteSpace: "nowrap", py: TOKENS.table.cellY }}>
                  Account Number
                </TableCell>
                <TableCell sx={{ fontWeight: TOKENS.table.headerFontWeight, whiteSpace: "nowrap", py: TOKENS.table.cellY }}>
                  Bank
                </TableCell>
                <TableCell sx={{ fontWeight: TOKENS.table.headerFontWeight, whiteSpace: "nowrap", py: TOKENS.table.cellY }}>
                  QR
                </TableCell>
                <TableCell sx={{ fontWeight: TOKENS.table.headerFontWeight, whiteSpace: "nowrap", py: TOKENS.table.cellY }}>
                  Active
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: TOKENS.table.headerFontWeight,
                    whiteSpace: "nowrap",
                    width: TOKENS.table.actionsColWidth,
                    py: TOKENS.table.cellY,
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {pagedRows.map((r) => (
                <TableRow key={r.Payment_Account_Id} hover>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{r.Payment_Account_Id}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{r.Account_Name}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{maskAcct(r.Account_Number)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{r.Bank_Name}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>
                    {r.QR_Code_URL ? (
                      <Avatar src={r.QR_Code_URL} alt="QR" sx={{ width: 28, height: 28 }} variant="rounded" />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>
                    <Chip
                      label={r.Is_Active ? "Active" : "Inactive"}
                      size="small"
                      color={r.Is_Active ? "success" : "default"}
                      variant={r.Is_Active ? "filled" : "outlined"}
                    />
                  </TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => goEdit(r)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => askDelete(r)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

              {!loading && pagedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No data found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <TablePagination
        component="div"
        count={totalItems}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 20, 50]}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Deletion"
        message={
          target
            ? `Warning: Are you sure you want to permanently delete this payment account (ID: ${target.Payment_Account_Id})? This action is irreversible and may affect ongoing payments.`
            : ""
        }
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}