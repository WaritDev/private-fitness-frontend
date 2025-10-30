"use client";

import * as React from "react";
import {
  Box, Paper, Stack, Typography, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  TablePagination, TableSortLabel, Chip, IconButton, Tooltip
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter, useSearchParams } from "next/navigation";
import ConfirmDialog from "@/components/pop-up/ConfirmDialog";
import { useSnack } from "@/components/snack/SnackProvider";

type ProductType = "DURATION" | "SESSION";

type ProductRow = {
  Product_Id: string;
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

const MOCK_PRODUCTS: ProductRow[] = [
  { Product_Id: "DUR30BASIC", Name: "Gym 30 Days (Basic)", Product_Type: "DURATION", Product_Category: "GYM_PASS", List_Price: 1490, Duration_Days: 30, Session_Amount: null, Is_Active: true,  Created_At: "2025-10-20T09:00:00", Updated_At: "2025-10-28T10:15:00" },
  { Product_Id: "DUR90PLUS",  Name: "Gym 90 Days (Plus)",  Product_Type: "DURATION", Product_Category: "GYM_PASS", List_Price: 3990, Duration_Days: 90, Session_Amount: null, Is_Active: true,  Created_At: "2025-10-10T11:30:00", Updated_At: "2025-10-25T08:40:00" },
  { Product_Id: "SPA30",      Name: "Spa 30 Days",        Product_Type: "DURATION", Product_Category: "SPA",      List_Price: 1990, Duration_Days: 30, Session_Amount: null, Is_Active: false, Created_At: "2025-09-15T13:10:00", Updated_At: "2025-10-05T17:20:00" },
  { Product_Id: "PT12",       Name: "Personal Training 12 Sessions", Product_Type: "SESSION", Product_Category: "PT",    List_Price: 8900, Duration_Days: null, Session_Amount: 12, Is_Active: true,  Created_At: "2025-10-18T09:10:00", Updated_At: "2025-10-28T08:55:00" },
  { Product_Id: "YOGA8",      Name: "Yoga 8 Sessions",                 Product_Type: "SESSION", Product_Category: "CLASS", List_Price: 4200, Duration_Days: null, Session_Amount: 8,  Is_Active: true,  Created_At: "2025-10-16T15:22:00", Updated_At: "2025-10-26T18:03:00" },
  { Product_Id: "HIIT6",      Name: "HIIT 6 Sessions",                  Product_Type: "SESSION", Product_Category: "CLASS", List_Price: 3000, Duration_Days: null, Session_Amount: 6,  Is_Active: false, Created_At: "2025-09-30T10:05:00", Updated_At: "2025-10-01T09:00:00" },
];

const COLUMNS = [
  { key: "Product_Id", label: "Product ID", sortable: false },
  { key: "Name", label: "Name", sortable: false },
  { key: "Product_Type", label: "Type", sortable: false },
  { key: "Product_Category", label: "Category", sortable: false },
  { key: "List_Price", label: "List Price", sortable: false },
  { key: "Duration_Days", label: "Duration (days)", sortable: false },
  { key: "Session_Amount", label: "Sessions", sortable: false },
  { key: "Is_Active", label: "Active", sortable: false },
  { key: "Created_At", label: "Created At", sortable: false },
  { key: "Updated_At", label: "Updated At", sortable: false },
] as const;

type Order = "asc" | "desc";
type SortKey = (typeof COLUMNS)[number]["key"];

function fmtDateTimeTH(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("th-TH", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });
}
function fmtTHB(n: number) {
  return n.toLocaleString("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
}

export default function ProductsManagementPage(): React.JSX.Element {
  const router = useRouter();
  const sp = useSearchParams();
  const { setSnack } = useSnack();

  const [rows, setRows] = React.useState<ProductRow[]>([...MOCK_PRODUCTS]);
  const [order, setOrder] = React.useState<Order>("asc");
  const [orderBy, setOrderBy] = React.useState<SortKey>("Is_Active");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [target, setTarget] = React.useState<ProductRow | null>(null);

  React.useEffect(() => {
    const toast = sp.get("toast");
    if (toast) setSnack({ open: true, msg: toast, severity: "success" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const handleSort = (key: SortKey) => {
    const isAsc = orderBy === key && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(key);
  };

  const sorted = React.useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const dir = order === "asc" ? 1 : -1;
      switch (orderBy) {
        case "Name": return a.Name.localeCompare(b.Name) * dir;
        case "Product_Type": return a.Product_Type.localeCompare(b.Product_Type) * dir;
        case "Product_Category": return a.Product_Category.localeCompare(b.Product_Category) * dir;
        case "List_Price": return (a.List_Price - b.List_Price) * dir;
        case "Is_Active": return ((a.Is_Active === b.Is_Active) ? 0 : a.Is_Active ? -1 : 1) * dir;
        default: return 0;
      }
    });
    return arr;
  }, [rows, order, orderBy]);

  const paged = React.useMemo(
    () => sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sorted, page, rowsPerPage]
  );

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const goAdd = () => router.push("/admin/products-management/add");
  const goEdit = (row: ProductRow) => router.push(`/admin/products-management/edit?id=${encodeURIComponent(row.Product_Id)}`);

  const askDelete = (row: ProductRow) => {
    setTarget(row);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (target) {
      setRows(prev => prev.filter(p => p.Product_Id !== target.Product_Id));
      setSnack({ open: true, msg: `Product: ${target.Product_Id} deleted successfully`, severity: "success" });
    }
    setConfirmOpen(false);
    setTarget(null);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} gap={2} flexWrap="wrap">
        <Typography variant="h5" fontWeight={400}>Products</Typography>
        {/* ✅ ปุ่ม Add */}
        <Button variant="contained" startIcon={<AddIcon />} onClick={goAdd}>
          Add Product
        </Button>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: 3, overflowX: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {COLUMNS.map((c) => (
                <TableCell key={c.key as string} sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                  {c.sortable ? (
                    <TableSortLabel
                      active={orderBy === c.key}
                      direction={orderBy === c.key ? order : "asc"}
                      onClick={() => handleSort(c.key)}
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
            {paged.map((r) => (
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

            {paged.length === 0 && (
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
          count={rows.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
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