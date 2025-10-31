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
  Alert,
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

type Status = "ACTIVE" | "EXPIRED" | "FROZEN" | "CANCELLED" | "COMPLETED";

type ApiNullString = { String: string; Valid: boolean };
type ApiNullInt32 = { Int32: number; Valid: boolean };

type ApiRow = {
  id: number;
  customerUsername?: ApiNullString;
  customerFirstName: string;
  customerLastName: string;
  trainerUsername?: ApiNullString;
  trainerFirstName: string;
  trainerLastName: string;
  productId?: ApiNullInt32;
  productName: string;
  type: "SESSION" | "DURATION";
  category: string;
  sessionAmount?: ApiNullInt32;
  salesUsername?: ApiNullString;
  purchaseDate: string;
  totalSessions: number;
  usedSessions?: ApiNullInt32;
  remainingSessions: number;
  pricePaid: string;
  discountAmount?: ApiNullString;
  status: Status;
};

type ApiMeta = {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
};

type ApiResponse = {
  data: ApiRow[];
  meta: ApiMeta;
  message?: string;
};

type ErrResponse = { message?: string };

type UIRow = {
  Session_Id: number;
  Customer_Username: string;
  Customer_First_Name: string;
  Customer_Last_Name: string;
  Trainer_Username: string;
  Trainer_First_Name: string;
  Trainer_Last_Name: string;
  Product_Id: string;
  Product_Name: string;
  Product_Type: "SESSION" | "DURATION";
  Product_Category: string;
  Session_Amount: number | null;
  Sales_Username: string;
  Purchase_Date: string;
  Total_Sessions: number;
  Used_Sessions: number;
  Remaining_Sessions: number;
  Price_Paid_Baht: number;
  Discount_Baht: number;
  Status: Status;
};

const ns = (v?: ApiNullString | null) => (v && v.Valid ? v.String : "");
const ni = (v?: ApiNullInt32 | null) => (v && v.Valid ? v.Int32 : undefined);

const moneyStrToIntBaht = (s?: string) => {
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : 0;
};

const isoToYMD = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    return "";
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

const fmtBaht = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

const COLUMNS: ReadonlyArray<{ key: keyof UIRow; label: string }> = [
  { key: "Session_Id", label: "Session ID" },
  { key: "Customer_Username", label: "Customer" },
  { key: "Trainer_Username", label: "Trainer" },
  { key: "Product_Name", label: "Product" },
  { key: "Session_Amount", label: "Session/Pack" },
  { key: "Total_Sessions", label: "Total" },
  { key: "Used_Sessions", label: "Used" },
  { key: "Remaining_Sessions", label: "Remaining" },
  { key: "Price_Paid_Baht", label: "Paid" },
  { key: "Discount_Baht", label: "Discount" },
  { key: "Status", label: "Status" },
] as const;

export default function CustomerSessionCoursesPage(): React.JSX.Element {
  const router = useRouter();
  const { setSnack } = useSnack();

  const [rows, setRows] = React.useState<UIRow[]>([]);
  const [totalItems, setTotalItems] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const rowsPerPage = 10;

  const [loading, setLoading] = React.useState(false);
  const [globalErr, setGlobalErr] = React.useState("");

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [target, setTarget] = React.useState<UIRow | null>(null);

  const mapRow = (r: ApiRow): UIRow => ({
    Session_Id: r.id,
    Customer_Username: ns(r.customerUsername),
    Customer_First_Name: r.customerFirstName || "",
    Customer_Last_Name: r.customerLastName || "",
    Trainer_Username: ns(r.trainerUsername),
    Trainer_First_Name: r.trainerFirstName || "",
    Trainer_Last_Name: r.trainerLastName || "",
    Product_Id: String(ni(r.productId) ?? ""),
    Product_Name: r.productName || "",
    Product_Type: r.type,
    Product_Category: r.category,
    Session_Amount: ni(r.sessionAmount) ?? null,
    Sales_Username: ns(r.salesUsername),
    Purchase_Date: isoToYMD(r.purchaseDate),
    Total_Sessions: r.totalSessions ?? 0,
    Used_Sessions: ni(r.usedSessions) ?? 0,
    Remaining_Sessions: r.remainingSessions ?? Math.max(0, (r.totalSessions ?? 0) - (ni(r.usedSessions) ?? 0)),
    Price_Paid_Baht: moneyStrToIntBaht(r.pricePaid),
    Discount_Baht: moneyStrToIntBaht(ns(r.discountAmount)),
    Status: r.status,
  });

  const fetchPage = React.useCallback(async () => {
    setLoading(true);
    setGlobalErr("");
    try {
      const apiPage = page + 1;
      const res = await fetch(`${API_BASE}/api/customer-sessions?page=${apiPage}&limit=${rowsPerPage}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err: ErrResponse | null = await res.json().catch(() => null);
        throw new Error(err?.message ?? `Failed to load data (HTTP ${res.status})`);
      }

      const body: ApiResponse = await res.json();
      const items: ApiRow[] = Array.isArray(body.data) ? body.data : [];
      const mapped = items.map(mapRow).sort((a, b) => b.Session_Id - a.Session_Id);

      setRows(mapped);
      setTotalItems(body.meta?.total_items ?? mapped.length);
    } catch (e) {
      setGlobalErr(e instanceof Error ? e.message : String(e));
      setRows([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  React.useEffect(() => {
    void fetchPage();
  }, [fetchPage]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);

  const goEdit = (r: UIRow) =>
    router.push(`/admin/courses-sessions/edit/${encodeURIComponent(String(r.Session_Id))}`);

  const askDelete = (r: UIRow) => {
    setTarget(r);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!target) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/customer-sessions/${encodeURIComponent(String(target.Session_Id))}`,
        { method: "DELETE", credentials: "include", headers: { "Content-Type": "application/json" } }
      );
      if (!res.ok) {
        const errBody: ErrResponse | null = await res.json().catch(() => null);
        throw new Error(errBody?.message ?? `Delete failed (HTTP ${res.status})`);
      }

      setSnack({ open: true, msg: `Session: ${target.Session_Id} deleted successfully`, severity: "success" });

      if (rows.length === 1 && page > 0) {
        setPage((p) => p - 1);
      } else {
        await fetchPage();
      }
    } catch (e) {
      setSnack({ open: true, msg: e instanceof Error ? e.message : String(e), severity: "error" });
    } finally {
      setConfirmOpen(false);
      setTarget(null);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: TOKENS.spacing.sectionY } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} gap={2} flexWrap="wrap">
        <Typography variant={TOKENS.heading.variant} fontWeight={TOKENS.heading.weight}>
          Customer Session Courses
        </Typography>
      </Stack>

      {globalErr && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {globalErr}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ borderRadius: 3, overflowX: "auto" }}>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ p: 4 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {COLUMNS.map((c) => (
                  <TableCell
                    key={String(c.key)}
                    sx={{ fontWeight: TOKENS.table.headerFontWeight, whiteSpace: "nowrap", py: TOKENS.table.cellY }}
                  >
                    {c.label}
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
              {rows.map((r) => (
                <TableRow key={r.Session_Id} hover>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{r.Session_Id}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>
                    {r.Customer_First_Name} {r.Customer_Last_Name}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {r.Customer_Username}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>
                    {r.Trainer_First_Name} {r.Trainer_Last_Name}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {r.Trainer_Username || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>
                    {r.Product_Name}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {r.Product_Category} • {r.Product_Type}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{r.Session_Amount ?? "—"}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{r.Total_Sessions}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{r.Used_Sessions}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>
                    <Chip size="small" label={r.Remaining_Sessions} color={r.Remaining_Sessions > 0 ? "success" : "default"} variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{fmtBaht(r.Price_Paid_Baht)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{fmtBaht(r.Discount_Baht)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>
                    <Chip
                      size="small"
                      label={r.Status}
                      color={
                        r.Status === "ACTIVE"
                          ? "success"
                          : r.Status === "FROZEN"
                          ? "warning"
                          : r.Status === "CANCELLED"
                          ? "error"
                          : r.Status === "COMPLETED"
                          ? "primary"
                          : "default"
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
                  <TableCell colSpan={COLUMNS.length + 1} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No data found
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

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Deletion"
        message={
          target
            ? `Warning: Are you sure you want to permanently delete this course session (ID: ${target.Session_Id}) for customer ${target.Customer_Username}?`
            : ""
        }
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}