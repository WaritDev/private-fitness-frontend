"use client";

import * as React from "react";
import {
  Box, Paper, Stack, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  IconButton, Tooltip, Chip, TablePagination, CircularProgress
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/pop-up/ConfirmDialog";
import { useSnack } from "@/components/snack/SnackProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const PAGE_SIZE = 10;

// -------- Types from API --------
type NullString = { String: string; Valid: boolean };
type NullInt32  = { Int32: number; Valid: boolean };

type Status =
  | "ACTIVE"
  | "EXPIRED"
  | "SUSPENDED"
  | "REFUNDED"
  | "CANCELLED"; // มีในตัวอย่าง API

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
  purchaseDate: string; // ISO
  startDate: string;    // ISO
  endDate: string;      // ISO
  pricePaid: string;    // "1800.00"
  discountAmount: NullString; // "0.00"
  status: Status;
};

type ApiResp = {
  data: ApiRow[];
  meta: { page: number; limit: number; total_items: number; total_pages: number };
  message?: string;
};

// -------- UI Row --------
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
  pricePaid: number;        // THB
  discountAmount: number;   // THB
  status: Status;
};

const ns = (v?: NullString | null) => (v && v.Valid ? v.String : "");
const ni32 = (v?: NullInt32 | null) => (v && v.Valid ? v.Int32 : null);

const fmtTH = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("th-TH", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit",
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

  const [rows, setRows] = React.useState<Row[]>([]);
  const [totalItems, setTotalItems] = React.useState(0);
  const [page, setPage] = React.useState(0); // zero-based
  const rowsPerPage = PAGE_SIZE;
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

  const fetchPage = React.useCallback(async () => {
    setLoading(true);
    const currentPage = page + 1; // API is 1-based
    try {
      const res = await fetch(
        `${API_BASE}/api/customer-durations?page=${currentPage}&limit=${rowsPerPage}`,
        { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } }
      );
      const body = (await res.json().catch(() => ({}))) as Partial<ApiResp>;
      if (!res.ok) {
        throw new Error(body?.message || `โหลดข้อมูลล้มเหลว (HTTP ${res.status})`);
      }
      const items = Array.isArray(body?.data) ? body!.data : [];
      setRows(items.map(mapRow));
      setTotalItems(body?.meta?.total_items ?? items.length);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setSnack({ open: true, msg, severity: "error" });
      setRows([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, setSnack]);

  React.useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = () => setPage(0); // fixed 10

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
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Delete failed (HTTP ${res.status})`);
      }
      setSnack({ open: true, msg: `Duration_Id: ${id} deleted successfully`, severity: "success" });

      // ถ้าลบแถวสุดท้ายของหน้า (และไม่ใช่หน้าแรก) → ถอยหน้าก่อน
      if (rows.length === 1 && page > 0) {
        setPage((p) => p - 1);
      } else {
        fetchPage();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setSnack({ open: true, msg, severity: "error" });
    }
  };

    return (
        <Box sx={{ p: 3 }}>
        {/* Header */}
        <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={2}
            flexWrap="wrap"
            sx={{ mb: 2 }}
        >
            <Typography variant="h5" fontWeight={400}>
            แพ็กเกจ Duration
            </Typography>
            <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
                backgroundColor: PRIMARY.main,
                "&:hover": { backgroundColor: PRIMARY.dark }
            }}
            onClick={() =>
                setOpenEdit({
                id: 0,
                name: "",
                durationDays: 30,
                priceTHB: 0,
                allowFreezeDays: 0,
                maxFreezeTimes: 0,
                description: "",
                isActive: true,
                createdAt: new Date().toISOString().slice(0, 10),
                updatedAt: new Date().toISOString().slice(0, 10)
                })
            }
            >
            เพิ่มแพ็กเกจ
            </Button>
        </Stack>

        {/* Filters */}
        <Stack direction={{ xs: "column", sm: "row" }} gap={2} sx={{ mb: 2 }}>
            <TextField
            placeholder="ค้นหาชื่อ / ราคา / จำนวนวัน"
            size="small"
            fullWidth
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearch(e.target.value);
                setPage(0);
            }}
            InputProps={{
                startAdornment: (
                <InputAdornment position="start">
                    <SearchIcon />
                </InputAdornment>
                )
            }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="activeFilterLabel">สถานะ</InputLabel>
            <Select<ActiveFilter>
                labelId="activeFilterLabel"
                label="สถานะ"
                value={activeFilter}
                onChange={onChangeActiveFilter}
            >
                <MenuItem value="All">ทั้งหมด</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>
            </FormControl>
        </Stack>

        {/* Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
            <TableHead>
                <TableRow>
                {(
                    [
                    { key: "name", label: "ชื่อแพ็กเกจ" },
                    { key: "durationDays", label: "จำนวนวัน" },
                    { key: "priceTHB", label: "ราคา" },
                    { key: "allowFreezeDays", label: "พักได้ (วัน)" },
                    { key: "maxFreezeTimes", label: "พักได้ (ครั้ง)" },
                    { key: "isActive", label: "สถานะ" },
                    { key: "updatedAt", label: "อัปเดตล่าสุด" }
                    ] as const
                ).map((col) => (
                    <TableCell key={col.key} sx={{ fontWeight: 500 }}>
                    <TableSortLabel
                        active={orderBy === (col.key as keyof DurationPackage)}
                        direction={orderBy === (col.key as keyof DurationPackage) ? order : "asc"}
                        onClick={() => handleRequestSort(col.key as keyof DurationPackage)}
                    >
                        {col.label}
                    </TableSortLabel>
                    </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 500, width: 220 }}>การจัดการ</TableCell>
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

            {!loading && rows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.id}</TableCell>
                <TableCell>{r.customerUsername || "—"}</TableCell>
                <TableCell>{r.customerName || "—"}</TableCell>
                <TableCell>{r.productId ?? "—"}</TableCell>
                <TableCell>{r.productName || "—"}</TableCell>
                <TableCell>{r.productType}</TableCell>
                <TableCell>{r.productCategory}</TableCell>
                <TableCell align="right">{r.durationDays ?? "—"}</TableCell>
                <TableCell>{r.salesUsername || "—"}</TableCell>
                <TableCell>{fmtTH(r.purchaseDate)}</TableCell>
                <TableCell>{fmtTH(r.startDate)}</TableCell>
                <TableCell>{fmtTH(r.endDate)}</TableCell>
                <TableCell align="right">{money(r.pricePaid)}</TableCell>
                <TableCell align="right">{money(r.discountAmount)}</TableCell>
                <TableCell>
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
                        : "error" // CANCELLED
                    }
                    variant="outlined"
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
                      <IconButton size="small" color="error" onClick={() => onDeleteClick(r)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}

            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={16} align="center" sx={{ py: 6, color: "text.secondary" }}>
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
        onClose={() => setConfirm({ open: false })}
        title="ยืนยันการลบแพ็กเกจ Duration"
        message={
          confirm.target
            ? `ลบ Duration_Id: ${confirm.target.id} ของลูกค้า ${confirm.target.customerUsername} ?`
            : ""
        }
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={doDelete}
      />
    </Box>
  );
}