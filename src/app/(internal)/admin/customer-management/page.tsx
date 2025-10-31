"use client";

import * as React from "react";
import {
  Box,
  Stack,
  Typography,
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
  CircularProgress,
} from "@mui/material";
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
  gender: GenderAPI;
  dateOfBirth: string;
  phoneNumber: string;
  gmail: string;
  healthInfo: string;
  address: string;
  companyName: string;
  companyPosition: string;
  maritalStatus: MaritalStatus;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  marketingSource: string;
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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const TOKENS = {
  heading: { variant: "h5" as const, weight: 500 as const },
  table: { headerFontWeight: 600 as const, actionsColWidth: 140, cellY: 1.25 },
  spacing: { sectionY: 3 },
};

const COLUMNS = [
  { key: "firstName", label: "First Name", sortable: true },
  { key: "lastName", label: "Last Name", sortable: false },
  { key: "username", label: "Username", sortable: false },
  { key: "gender", label: "Gender", sortable: false },
  { key: "dateOfBirth", label: "Date of Birth", sortable: false },
  { key: "phoneNumber", label: "Phone", sortable: false },
  { key: "gmail", label: "Email", sortable: false },
  { key: "healthInfo", label: "Health Info", sortable: false },
  { key: "address", label: "Address", sortable: false },
  { key: "companyName", label: "Company", sortable: false },
  { key: "companyPosition", label: "Position", sortable: false },
  { key: "maritalStatus", label: "Marital Status", sortable: false },
  { key: "emergencyContactName", label: "Emergency Contact", sortable: false },
  { key: "emergencyContactRelationship", label: "Relationship", sortable: false },
  { key: "emergencyContactPhone", label: "Emergency Phone", sortable: false },
  { key: "marketingSource", label: "Marketing Source", sortable: false },
  { key: "isActive", label: "Status", sortable: false },
] as const;

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

const fmt = (v?: string | null) => (v && v.trim() !== "" ? v : "—");

const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = /\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("th-TH");
};

const fmtGender = (g?: GenderAPI | null) =>
  g === "MALE" ? "Male" : g === "FEMALE" ? "Female" : g ? "Other" : "—";

const fmtMarital = (m?: MaritalStatus | null) =>
  m === "SINGLE" ? "Single" : m === "MARRIED" ? "Married" : m === "DIVORCED" ? "Divorced" : m === "WIDOWED" ? "Widowed" : "—";

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

export default function CustomersListPage(): React.JSX.Element {
  const router = useRouter();
  const { setSnack } = useSnack();

  const [rows, setRows] = React.useState<Customer[]>([]);
  const [totalItems, setTotalItems] = React.useState(0);

  const [order, setOrder] = React.useState<Order>("asc");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [loading, setLoading] = React.useState(false);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [targetUser, setTargetUser] = React.useState<Customer | null>(null);

  const fetchPage = React.useCallback(async () => {
    setLoading(true);
    const currentPage = page + 1;
    try {
      const res = await fetch(`${API_BASE}/api/customers?page=${currentPage}&limit=${rowsPerPage}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const body = (await res.json().catch(() => ({}))) as Partial<ApiResponse>;
      if (!res.ok) {
        throw new Error(body?.message || `Failed to load data (HTTP ${res.status})`);
      }
      const items = Array.isArray(body?.data) ? body.data : [];
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
    void fetchPage();
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

  const goEdit = (u: Customer) =>
    router.push(`/admin/customer-management/edit/${encodeURIComponent(u.username)}`);

  const askDelete = (u: Customer) => {
    setTargetUser(u);
    setConfirmOpen(true);
  };

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

  return (
    <Box sx={{ p: { xs: 2, md: TOKENS.spacing.sectionY } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} gap={2} flexWrap="wrap">
        <Typography variant={TOKENS.heading.variant} fontWeight={TOKENS.heading.weight}>
          Customer Accounts
        </Typography>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: 3, overflowX: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {COLUMNS.map((c) => (
                <TableCell
                  key={c.key as string}
                  sx={{ fontWeight: TOKENS.table.headerFontWeight, whiteSpace: "nowrap", py: TOKENS.table.cellY }}
                >
                  {c.key === "firstName" ? (
                    <TableSortLabel active direction={order} onClick={() => setOrder((o) => (o === "asc" ? "desc" : "asc"))}>
                      {c.label}
                    </TableSortLabel>
                  ) : (
                    c.label
                  )}
                </TableCell>
              ))}
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
            {loading && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length + 1} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              sorted.map((u) => (
                <TableRow key={u.username} hover>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{fmt(u.firstName)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{fmt(u.lastName)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{u.username}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{fmtGender(u.gender)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{fmtDate(u.dateOfBirth)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{fmt(u.phoneNumber)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{fmt(u.gmail)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{fmt(u.healthInfo)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{fmt(u.address)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{fmt(u.companyName)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{fmt(u.companyPosition)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{fmtMarital(u.maritalStatus)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{fmt(u.emergencyContactName)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{fmt(u.emergencyContactRelationship)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{fmt(u.emergencyContactPhone)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{fmt(u.marketingSource)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>
                    <Chip size="small" label={u.isActive ? "Active" : "Inactive"} color={u.isActive ? "success" : "default"} variant={u.isActive ? "filled" : "outlined"} />
                  </TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => goEdit(u)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => askDelete(u)}>
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
                  No data found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
        <TablePagination
          component="div"
          count={totalItems}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </Box>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Deletion"
        message={
          targetUser ? (
            <>
              Warning: Deleting this customer will also remove related records.
              <br />
              Confirm delete customer: <b>{targetUser.username}</b>?
            </>
          ) : (
            ""
          )
        }
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}