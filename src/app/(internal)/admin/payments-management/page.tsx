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
  IconButton,
  Tooltip,
  Chip,
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

type ApiWireItem = {
  id: number;
  accountName: string;
  accountNumber: string;
  bankName: string;
  qrCodeImageUrl?: string | null;
  qrCodeUrl?: string | null;
  column6?: boolean;
  isActive?: boolean;
};

type ApiWireEnvelope = {
  data?: ApiWireItem[];
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

function mapApiToUI(r: ApiWireItem): PaymentAccount {
  const active = typeof r.column6 === "boolean" ? r.column6 : !!r.isActive;
  const qr = r.qrCodeImageUrl ?? r.qrCodeUrl ?? null;
  return {
    Payment_Account_Id: r.id,
    Account_Name: r.accountName,
    Account_Number: r.accountNumber,
    Bank_Name: r.bankName,
    QR_Code_URL: qr,
    Is_Active: active,
  };
}

function parseWire(resp: unknown): ApiWireItem[] {
  if (Array.isArray(resp)) return resp;
  const env = resp as ApiWireEnvelope | null;
  if (env && Array.isArray(env.data)) return env.data;
  return [];
}

export default function PaymentsManagementPage(): React.JSX.Element {
  const router = useRouter();
  const sp = useSearchParams();
  const { setAlert } = useAlertPopUp();

  const [allRows, setAllRows] = React.useState<PaymentAccount[]>([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage] = React.useState(100);
  const [loading, setLoading] = React.useState(false);
  const [globalErr, setGlobalErr] = React.useState("");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [target, setTarget] = React.useState<PaymentAccount | null>(null);

  React.useEffect(() => {
    const toast = sp.get("toast");
    if (toast) setAlert({ open: true, msg: toast, severity: "success" });
  }, [sp, setAlert]);

  const loadAllPaymentAccounts = React.useCallback(async () => {
    setLoading(true);
    setGlobalErr("");
    try {
      const res = await fetch(`${API_BASE}/api/payments`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const raw = (await res.json().catch(() => null)) as unknown;

      if (!res.ok) {
        const msg = (raw as { message?: string } | null)?.message || `Failed to load data (HTTP ${res.status})`;
        throw new Error(msg);
      }

      const wireItems = parseWire(raw);
      const mapped = wireItems.map(mapApiToUI);
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
    void loadAllPaymentAccounts();
  }, [loadAllPaymentAccounts]);

  const pagedRows = React.useMemo(() => {
    const start = page * rowsPerPage;
    return allRows.slice(start, start + rowsPerPage);
  }, [allRows, page, rowsPerPage]);

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
                <TableCell>ID</TableCell>
                <TableCell>Account Name</TableCell>
                <TableCell>Account Number</TableCell>
                <TableCell>Bank</TableCell>
                <TableCell>QR (URL)</TableCell>
                <TableCell>Active</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {pagedRows.map((r) => (
                <TableRow key={r.Payment_Account_Id} hover>
                  <TableCell>{r.Payment_Account_Id}</TableCell>
                  <TableCell>{r.Account_Name}</TableCell>
                  {/* ✅ แสดงเลขบัญชีจริง ไม่ mask */}
                  <TableCell>{r.Account_Number || "—"}</TableCell>
                  <TableCell>{r.Bank_Name}</TableCell>

                  <TableCell>
                    {r.QR_Code_URL ? (
                      <a
                        href={r.QR_Code_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#1976d2",
                          textDecoration: "none",
                          wordBreak: "break-all",
                        }}
                      >
                        {r.QR_Code_URL}
                      </a>
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

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Deletion"
        message={
          target
            ? `Warning: Are you sure you want to permanently delete this payment account (ID: ${target.Payment_Account_Id})?`
            : ""
        }
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}