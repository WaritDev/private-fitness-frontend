"use client";

import * as React from "react";
import {
  Box, Paper, Stack, Typography, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  TablePagination, Chip, IconButton, Tooltip, CircularProgress, Alert
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/pop-up/ConfirmDialog";
import { useSnack } from "@/components/snack/SnackProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type ProductType = "DURATION" | "SESSION";

type ApiProduct = {
  id: number;
  name: string;
  type: ProductType;
  category: string;
  listPrice: number;
  durationDays?: number;      // only when type = DURATION
  sessionAmount?: number;     // only when type = SESSION
  isActive: boolean;
  paymentAccountId: number;
  createdAt: string;          // ISO
  updatedAt: string;          // ISO
};

type ApiResponse = {
  message?: string;
  result: ApiProduct[];
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

const fmtDateTimeTH = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("th-TH", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });
};
const fmtTHB = (n: number) =>
  n.toLocaleString("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });

export default function ProductsManagementPage(): React.JSX.Element {
  const router = useRouter();
  const { setSnack } = useSnack();

  // table / paging
  const [rows, setRows] = React.useState<UIRow[]>([]);
  const [page, setPage] = React.useState(0);        // 0-based (UI)
  const rowsPerPage = 10;                           // fixed 10
  const [totalItems, setTotalItems] = React.useState(0);

  // ui state
  const [loading, setLoading] = React.useState(false);
  const [globalErr, setGlobalErr] = React.useState("");

  // confirm delete
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [target, setTarget] = React.useState<UIRow | null>(null);

  const mapToUI = (p: ApiProduct): UIRow => ({
    Product_Id: p.id,
    Name: p.name,
    Product_Type: p.type,
    Product_Category: p.category,
    List_Price: p.listPrice,
    Duration_Days: p.type === "DURATION" ? (p.durationDays ?? null) : null,
    Session_Amount: p.type === "SESSION" ? (p.sessionAmount ?? null) : null,
    Is_Active: p.isActive,
    Created_At: p.createdAt,
    Updated_At: p.updatedAt,
  });

  const fetchPage = React.useCallback(async () => {
    setLoading(true);
    setGlobalErr("");
    try {
      const apiPage = page + 1; // API 1-based
      const res = await fetch(`${API_BASE}/api/products?page=${apiPage}&limit=${rowsPerPage}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err: ErrResponse | null = await res.json().catch(() => null);
        throw new Error(err?.message ?? `โหลดข้อมูลล้มเหลว (HTTP ${res.status})`);
      }

      const body: ApiResponse = await res.json();
      const items = Array.isArray(body.result) ? body.result : [];
      const mapped = items.map(mapToUI);

      // เรียงใหม่สุดก่อน (ถ้าต้องการตาม API ลบ sort ออก)
      mapped.sort((a, b) => b.Product_Id - a.Product_Id);

      setRows(mapped);
      // BE ไม่ส่ง meta รวมมา → ใช้ความยาวหน้า ณ ตอนนี้ไปก่อน
      setTotalItems(apiPage === 1 && items.length < rowsPerPage
        ? items.length
        : apiPage * rowsPerPage - (rowsPerPage - items.length));
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

  const goAdd = () => router.push("/admin/products-management/add");

  // 👉 เปลี่ยนเป็น path dynamic: /admin/products-management/edit/[id]
  const goEdit = (row: UIRow) =>
    router.push(`/admin/products-management/edit/${encodeURIComponent(String(row.Product_Id))}`);

  const askDelete = (row: UIRow) => {
    setTarget(row);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!target) return;
    try {
      const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(String(target.Product_Id))}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err: ErrResponse | null = await res.json().catch(() => null);
        throw new Error(err?.message ?? `Delete failed (HTTP ${res.status})`);
      }

      setSnack({ open: true, msg: `Product: ${target.Product_Id} deleted successfully`, severity: "success" });

      // ถ้าลบแถวสุดท้ายของหน้าและมีหน้าก่อนหน้า → ถอยหน้าลงก่อน
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
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} gap={2} flexWrap="wrap">
        <Typography variant="h5" fontWeight={400}>Products</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={goAdd}>
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
                  <TableCell key={String(c.key)} sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                    {c.label}
                  </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap", width: 140 }}>
                  การจัดการ
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.Product_Id} hover>
                  <TableCell>{r.Product_Id}</TableCell>
                  <TableCell>{r.Name}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={r.Product_Type}
                      color={r.Product_Type === "DURATION" ? "success" : "primary"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{r.Product_Category}</TableCell>
                  <TableCell>{fmtTHB(r.List_Price)}</TableCell>
                  <TableCell>{r.Product_Type === "DURATION" ? (r.Duration_Days ?? "—") : "—"}</TableCell>
                  <TableCell>{r.Product_Type === "SESSION" ? (r.Session_Amount ?? "—") : "—"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={r.Is_Active ? "Active" : "Inactive"}
                      color={r.Is_Active ? "success" : "default"}
                      variant={r.Is_Active ? "filled" : "outlined"}
                    />
                  </TableCell>
                  <TableCell>{fmtDateTimeTH(r.Created_At)}</TableCell>
                  <TableCell>{fmtDateTimeTH(r.Updated_At)}</TableCell>

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
                  <TableCell colSpan={COLUMNS.length + 1} align="center" sx={{ py: 6, color: "text.secondary" }}>
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
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={() => {}}
          rowsPerPageOptions={[10]}
        />
      </TableContainer>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="ยืนยันการลบสินค้า"
        message={
          target
            ? `Warning: Deleting product ${target.Product_Id} (${target.Name}) is permanent. Continue?`
            : ""
        }
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}