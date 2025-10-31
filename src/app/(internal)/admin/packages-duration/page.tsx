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
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/pop-up/ConfirmDialog";
import { useSnack } from "@/components/snack/SnackProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const TOKENS = {
  heading: { variant: "h5" as const, weight: 500 as const },
  table: { headerFontWeight: 600 as const, actionsColWidth: 140, cellY: 1.25 },
  spacing: { sectionY: 3 },
};

const PAGE_SIZE = 10;

type NullString = { String: string; Valid: boolean };
type NullInt32 = { Int32: number; Valid: boolean };

type Status = "ACTIVE" | "EXPIRED" | "SUSPENDED" | "REFUNDED" | "CANCELLED";

type ApiRow = {
  id: number;
  customerUsername: NullString;
  customerFirstName: string;
  customerLastName: string;
  productId: NullInt32;
  productName: string;
  type: "DURATION" | "SESSION";
  category: string;
  durationDays: NullInt32;
  salesUsername: NullString;
  purchaseDate: string;
  startDate: string;
  endDate: string;
  pricePaid: string;
  discountAmount: NullString;
  status: Status;
};

type ApiResp = {
  data: ApiRow[];
  message?: string;
};

type Row = {
  id: number;
  customerUsername: string;
  customerName: string;
  productId?: number | null;
  productName: string;
  productType: string;
  productCategory: string;
  durationDays?: number | null;
  salesUsername: string;
  purchaseDate: string;
  startDate: string;
  endDate: string;
  pricePaid: number;
  discountAmount: number;
  status: Status;
};

const ns = (v?: NullString | null) => (v && v.Valid ? v.String : "");
const ni32 = (v?: NullInt32 | null) => (v && v.Valid ? v.Int32 : null);

const fmtTH = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("th-TH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const money = (n?: number | null) =>
  typeof n === "number" && !Number.isNaN(n)
    ? new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n)
    : "—";

const parseDecimal = (s?: string | null) => {
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

export default function CustomerDurationPackagesPage(): React.JSX.Element {
  const router = useRouter();
  const { setSnack } = useSnack();

  const [allRows, setAllRows] = React.useState<Row[]>([]);
  const totalItems = allRows.length;
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(PAGE_SIZE);
  const [loading, setLoading] = React.useState(false);
  const [confirm, setConfirm] = React.useState<{ open: boolean; target?: Row }>({ open: false });

  const mapRow = (a: ApiRow): Row => ({
    id: a.id,
    customerUsername: ns(a.customerUsername),
    customerName: `${a.customerFirstName} ${a.customerLastName}`.trim(),
    productId: ni32(a.productId),
    productName: a.productName,
    productType: a.type,
    productCategory: a.category,
    durationDays: ni32(a.durationDays),
    salesUsername: ns(a.salesUsername),
    purchaseDate: a.purchaseDate,
    startDate: a.startDate,
    endDate: a.endDate,
    pricePaid: parseDecimal(a.pricePaid),
    discountAmount: parseDecimal(ns(a.discountAmount)),
    status: a.status,
  });

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/customer-durations`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const body = (await res.json().catch(() => null)) as ApiResp | null;
      if (!res.ok) {
        throw new Error((body as { message?: string } | null)?.message || `Failed to load data (HTTP ${res.status})`);
      }
      const items = Array.isArray(body?.data) ? body!.data : [];
      const mapped = items.map(mapRow).sort((a, b) => b.id - a.id);
      setAllRows(mapped);
      setPage((p) => {
        const maxPage = Math.max(0, Math.ceil(mapped.length / rowsPerPage) - 1);
        return p > maxPage ? maxPage : p;
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSnack({ open: true, msg, severity: "error" });
      setAllRows([]);
      setPage(0);
    } finally {
      setLoading(false);
    }
  }, [rowsPerPage, setSnack]);

  React.useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

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

  const goEdit = (r: Row) => router.push(`/admin/packages-duration/edit/${r.id}`);
  const onDeleteClick = (r: Row) => setConfirm({ open: true, target: r });

  const doDelete = async () => {
    const id = confirm.target?.id;
    setConfirm({ open: false });
    if (!id) return;
    try {
      const res = await fetch(`${API_BASE}/api/customer-durations/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message || `Delete failed (HTTP ${res.status})`);
      }
      setSnack({ open: true, msg: `Duration Package ID: ${id} deleted successfully`, severity: "success" });
      setAllRows((prev) => {
        const next = prev.filter((x) => x.id !== id);
        const maxPage = Math.max(0, Math.ceil(next.length / rowsPerPage) - 1);
        setPage((p) => (p > maxPage ? maxPage : p));
        return next;
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSnack({ open: true, msg, severity: "error" });
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: TOKENS.spacing.sectionY } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} gap={2} flexWrap="wrap">
        <Typography variant={TOKENS.heading.variant} fontWeight={TOKENS.heading.weight}>
          Customer Duration Packages
        </Typography>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: 3, overflowX: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: TOKENS.table.headerFontWeight, py: TOKENS.table.cellY }}>Duration_Id</TableCell>
              <TableCell sx={{ fontWeight: TOKENS.table.headerFontWeight, py: TOKENS.table.cellY }}>Customer Username</TableCell>
              <TableCell sx={{ fontWeight: TOKENS.table.headerFontWeight, py: TOKENS.table.cellY }}>Customer Name</TableCell>
              <TableCell sx={{ fontWeight: TOKENS.table.headerFontWeight, py: TOKENS.table.cellY }}>Product_Id</TableCell>
              <TableCell sx={{ fontWeight: TOKENS.table.headerFontWeight, py: TOKENS.table.cellY }}>Product_Name</TableCell>
              <TableCell sx={{ fontWeight: TOKENS.table.headerFontWeight, py: TOKENS.table.cellY }}>Product_Type</TableCell>
              <TableCell sx={{ fontWeight: TOKENS.table.headerFontWeight, py: TOKENS.table.cellY }}>Product_Category</TableCell>
              <TableCell align="right" sx={{ fontWeight: TOKENS.table.headerFontWeight, py: TOKENS.table.cellY }}>Duration_Days</TableCell>
              <TableCell sx={{ fontWeight: TOKENS.table.headerFontWeight, py: TOKENS.table.cellY }}>Sales_Username</TableCell>
              <TableCell sx={{ fontWeight: TOKENS.table.headerFontWeight, py: TOKENS.table.cellY }}>Purchase_Date</TableCell>
              <TableCell sx={{ fontWeight: TOKENS.table.headerFontWeight, py: TOKENS.table.cellY }}>Start_Date</TableCell>
              <TableCell sx={{ fontWeight: TOKENS.table.headerFontWeight, py: TOKENS.table.cellY }}>End_Date</TableCell>
              <TableCell align="right" sx={{ fontWeight: TOKENS.table.headerFontWeight, py: TOKENS.table.cellY }}>Price_Paid</TableCell>
              <TableCell align="right" sx={{ fontWeight: TOKENS.table.headerFontWeight, py: TOKENS.table.cellY }}>Discount_Amount</TableCell>
              <TableCell sx={{ fontWeight: TOKENS.table.headerFontWeight, py: TOKENS.table.cellY }}>Status</TableCell>
              <TableCell sx={{ fontWeight: TOKENS.table.headerFontWeight, py: TOKENS.table.cellY, whiteSpace: "nowrap", width: TOKENS.table.actionsColWidth }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={16} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              pagedRows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{r.id}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{r.customerUsername || "—"}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{r.customerName || "—"}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{r.productId ?? "—"}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{r.productName || "—"}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{r.productType}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{r.productCategory}</TableCell>
                  <TableCell align="right" sx={{ py: TOKENS.table.cellY }}>{r.durationDays ?? "—"}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{r.salesUsername || "—"}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{fmtTH(r.purchaseDate)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{fmtTH(r.startDate)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{fmtTH(r.endDate)}</TableCell>
                  <TableCell align="right" sx={{ py: TOKENS.table.cellY }}>{money(r.pricePaid)}</TableCell>
                  <TableCell align="right" sx={{ py: TOKENS.table.cellY }}>{money(r.discountAmount)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>
                    <Chip
                      size="small"
                      label={r.status}
                      color={
                        r.status === "ACTIVE"
                          ? "success"
                          : r.status === "EXPIRED"
                          ? "default"
                          : r.status === "SUSPENDED"
                          ? "warning"
                          : r.status === "REFUNDED"
                          ? "info"
                          : "error"
                      }
                      variant="outlined"
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
                        <IconButton size="small" color="error" onClick={() => onDeleteClick(r)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

            {!loading && pagedRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={16} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  No data found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalItems}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10]}
      />

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false })}
        title="Confirm Deletion"
        message={
          confirm.target
            ? `Warning: Are you sure you want to permanently delete this duration package (ID: ${confirm.target.id}) for customer ${confirm.target.customerUsername}?`
            : ""
        }
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={doDelete}
      />
    </Box>
  );
}