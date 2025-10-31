"use client";

import * as React from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/pop-up/ConfirmDialog";
import { useSnack } from "@/components/snack/SnackProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" } as const;
const TOKENS = {
  heading: { variant: "h5" as const, weight: 500 as const },
  table: { headerFontWeight: 600 as const, actionsColWidth: 140, cellY: 1.25 },
  button: { height: 40, borderRadius: 10 },
  spacing: { sectionY: 3 },
};

type ProductType = "DURATION" | "SESSION";

type ApiProduct = {
  id: number;
  name: string;
  type: ProductType;
  category: string;
  listPrice: number;
  durationDays?: number;
  sessionAmount?: number;
  isActive: boolean;
  paymentAccountId: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

type ApiResponse = {
  message?: string;
  result: ApiProduct[]; // returns ALL products
  status?: string;
  status_code?: number;
};

type ErrResponse = { message?: string };

type UIRow = {
  Product_Id: number;
  Name: string;
  Product_Type: ProductType;
  Product_Category: string;
  List_Price: number;
  Duration_Days: number | null;
  Session_Amount: number | null;
  Is_Active: boolean;
  Created_At: string;
  Updated_At: string;
};

const COLUMNS: ReadonlyArray<{ key: keyof UIRow; label: string }> = [
  { key: "Product_Id", label: "Product ID" },
  { key: "Name", label: "Name" },
  { key: "Product_Type", label: "Type" },
  { key: "Product_Category", label: "Category" },
  { key: "List_Price", label: "List Price" },
  { key: "Duration_Days", label: "Duration (days)" },
  { key: "Session_Amount", label: "Sessions" },
  { key: "Is_Active", label: "Active" },
  { key: "Created_At", label: "Created At" },
  { key: "Updated_At", label: "Updated At" },
] as const;

const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fmtTHB = (n: number) =>
  n.toLocaleString("en-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });

export default function ProductsManagementPage(): React.JSX.Element {
  const router = useRouter();
  const { setSnack } = useSnack();

  const [page, setPage] = React.useState(0);
  const rowsPerPage = 10;

  const [allRows, setAllRows] = React.useState<UIRow[]>([]); // keep ALL here
  const totalItems = allRows.length;

  const [loading, setLoading] = React.useState(false);
  const [globalErr, setGlobalErr] = React.useState("");

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [target, setTarget] = React.useState<UIRow | null>(null);

  const mapToUI = (p: ApiProduct): UIRow => ({
    Product_Id: p.id,
    Name: p.name,
    Product_Type: p.type,
    Product_Category: p.category,
    List_Price: p.listPrice,
    Duration_Days: p.type === "DURATION" ? p.durationDays ?? null : null,
    Session_Amount: p.type === "SESSION" ? p.sessionAmount ?? null : null,
    Is_Active: p.isActive,
    Created_At: p.createdAt,
    Updated_At: p.updatedAt,
  });

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    setGlobalErr("");
    try {
      const res = await fetch(`${API_BASE}/api/products`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err: ErrResponse | null = await res.json().catch(() => null);
        throw new Error(err?.message ?? `Failed to load data (HTTP ${res.status})`);
      }

      const body: ApiResponse = await res.json();
      const items = Array.isArray(body.result) ? body.result : [];
      const mapped = items.map(mapToUI);

      mapped.sort((a, b) => b.Product_Id - a.Product_Id);

      setAllRows(mapped);

      const maxPage = Math.max(0, Math.ceil(mapped.length / rowsPerPage) - 1);
      setPage((p) => (p > maxPage ? maxPage : p));
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

  const pagedRows = React.useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return allRows.slice(start, end);
  }, [allRows, page, rowsPerPage]);

  const goAdd = () => router.push("/admin/products-management/add");
  const goEdit = (row: UIRow) =>
    router.push(`/admin/products-management/edit/${encodeURIComponent(String(row.Product_Id))}`);

  const askDelete = (row: UIRow) => {
    setTarget(row);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!target) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/products/${encodeURIComponent(String(target.Product_Id))}`,
        { method: "DELETE", credentials: "include", headers: { "Content-Type": "application/json" } }
      );

      if (!res.ok) {
        const err: ErrResponse | null = await res.json().catch(() => null);
        throw new Error(err?.message ?? `Delete failed (HTTP ${res.status})`);
      }

      setSnack({ open: true, msg: `Product: ${target.Product_Id} deleted successfully`, severity: "success" });

      setAllRows((prev) => {
        const next = prev.filter((r) => r.Product_Id !== target.Product_Id);
        const maxPage = Math.max(0, Math.ceil(next.length / rowsPerPage) - 1);
        setPage((p) => (p > maxPage ? maxPage : p));
        return next;
      });
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
          Products
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
          Add Product
        </Button>
      </Stack>

      {globalErr && <Alert severity="error" sx={{ mb: 2 }}>{globalErr}</Alert>}

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
              {pagedRows.map((r) => (
                <TableRow key={r.Product_Id} hover>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{r.Product_Id}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{r.Name}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>
                    <Chip
                      size="small"
                      label={r.Product_Type}
                      color={r.Product_Type === "DURATION" ? "success" : "primary"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{r.Product_Category}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{fmtTHB(r.List_Price)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>
                    {r.Product_Type === "DURATION" ? r.Duration_Days ?? "—" : "—"}
                  </TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>
                    {r.Product_Type === "SESSION" ? r.Session_Amount ?? "—" : "—"}
                  </TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>
                    <Chip
                      size="small"
                      label={r.Is_Active ? "Active" : "Inactive"}
                      color={r.Is_Active ? "success" : "default"}
                      variant={r.Is_Active ? "filled" : "outlined"}
                    />
                  </TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{fmtDateTime(r.Created_At)}</TableCell>
                  <TableCell sx={{ py: TOKENS.table.cellY }}>{fmtDateTime(r.Updated_At)}</TableCell>

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
          onPageChange={(_, newPage) => setPage(newPage)}
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
            ? `Warning: Deleting this product may affect historical data. Are you sure?`
            : ""
        }
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}