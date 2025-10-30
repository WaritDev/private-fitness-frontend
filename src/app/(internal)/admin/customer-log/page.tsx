"use client";

import * as React from "react";
import {
  Box, Paper, Stack, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  TablePagination, IconButton, Tooltip, Chip, Alert, CircularProgress
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/pop-up/ConfirmDialog";
import { useSnack } from "@/components/snack/SnackProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type LogType = "CHECK_IN" | "CHECK_OUT" | "BOOK_SESSION" | "CANCEL_SESSION";

// ---------- API Types (ตามที่ส่งมา) ----------
type ApiNullString = { String: string; Valid: boolean };
type ApiNullTime = { Time: string; Valid: boolean };

type ApiRow = {
  logId: number;
  customerUsername?: ApiNullString;
  customerFirstName: string;
  customerLastName: string;
  createdAt?: ApiNullTime;
  logType: LogType;
};

type ApiResp = {
  data: ApiRow[];
  meta: {
    page: number;       // 1-based
    limit: number;
    total_items: number;
    total_pages: number;
  };
};

// ---------- UI Row ----------
type UIRow = {
  logId: number;
  customerUsername: string;
  customerFirstName: string;
  customerLastName: string;
  timestampISO: string; // ISO (จาก createdAt.Time)
  logType: LogType;
};

const COLUMNS = [
  { key: "logId", label: "Log ID" },
  { key: "customerUsername", label: "Username" },
  { key: "customerFirstName", label: "ชื่อลูกค้า" },
  { key: "customerLastName", label: "นามสกุล" },
  { key: "timestampISO", label: "เวลาบันทึก" },
  { key: "logType", label: "ประเภท Log" },
] as const;

function ns(v?: ApiNullString | null) {
  return v && v.Valid ? v.String : "";
}
function nt(v?: ApiNullTime | null) {
  return v && v.Valid ? v.Time : "";
}
function formatDateTimeTH(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("th-TH", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export default function CustomerLogPage(): React.JSX.Element {
  const router = useRouter();
  const { setSnack } = useSnack();

  // table states
  const [rows, setRows] = React.useState<UIRow[]>([]);
  const [totalItems, setTotalItems] = React.useState(0);
  const [page, setPage] = React.useState(0); // 0-based (UI)
  const rowsPerPage = 10;                    // fixed 10

  // ui states
  const [loading, setLoading] = React.useState(false);
  const [globalErr, setGlobalErr] = React.useState("");

  // confirm delete
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [target, setTarget] = React.useState<UIRow | null>(null);

  const mapRow = (r: ApiRow): UIRow => ({
    logId: r.logId,
    customerUsername: ns(r.customerUsername),
    customerFirstName: r.customerFirstName ?? "",
    customerLastName: r.customerLastName ?? "",
    timestampISO: nt(r.createdAt),
    logType: r.logType,
  });

  const fetchPage = React.useCallback(async () => {
    setLoading(true);
    setGlobalErr("");
    try {
      // API เป็น 1-based
      const apiPage = page + 1;
      const res = await fetch(`${API_BASE}/api/customer-logs?page=${apiPage}&limit=${rowsPerPage}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const body = (await res.json().catch(() => ({}))) as Partial<ApiResp>;
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        const msg = body?.message ?? `โหลดข้อมูลล้มเหลว (HTTP ${res.status})`;
        throw new Error(msg);
      }

      const items = Array.isArray(body?.data) ? body!.data : [];
      const mapped = items.map(mapRow);

      // ให้เรียงใหม่สุดก่อน (ตามตัวอย่าง) — ถ้า API จัดให้แล้วเอา sort ออกได้
      mapped.sort((a, b) => {
        const t = (b.timestampISO || "").localeCompare(a.timestampISO || "");
        return t !== 0 ? t : b.logId - a.logId;
      });

      setRows(mapped);
      setTotalItems(body?.meta?.total_items ?? mapped.length);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setGlobalErr(msg);
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

  const goEdit = (r: UIRow) => {
    // ✅ path แบบ dynamic segment
    router.push(`/admin/customer-log/edit/${encodeURIComponent(String(r.logId))}`);
  };

  const askDelete = (r: UIRow) => {
    setTarget(r);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!target) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/customer-logs/${encodeURIComponent(String(target.logId))}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message || `Delete failed (HTTP ${res.status})`);
      }

      setSnack({
        open: true,
        msg: `Log: ${target.logId} deleted successfully`,
        severity: "success",
      });

      // ถ้าลบแถวสุดท้ายของหน้า และไม่ใช่หน้าแรก → ถอยหน้า 1 เพื่อไม่ให้หน้าโล่ง
      if (rows.length === 1 && page > 0) {
        setPage((p) => p - 1);
      } else {
        await fetchPage();
      }
    } catch (e: unknown) {
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
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={400}>Customer Log</Typography>
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
                {COLUMNS.map((c) => (
                  <TableCell key={c.key as string} sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                    {c.label}
                  </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap", width: 140 }}>การจัดการ</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.logId} hover>
                  <TableCell>{r.logId}</TableCell>
                  <TableCell>{r.customerUsername || "—"}</TableCell>
                  <TableCell>{r.customerFirstName}</TableCell>
                  <TableCell>{r.customerLastName}</TableCell>
                  <TableCell>{formatDateTimeTH(r.timestampISO)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={r.logType}
                      color={
                        r.logType === "CHECK_IN" ? "success" :
                        r.logType === "CHECK_OUT" ? "default" :
                        r.logType === "BOOK_SESSION" ? "primary" :
                        "warning"
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
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={() => {}}
          rowsPerPageOptions={[10]}
        />
      </TableContainer>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="ยืนยันการลบ Log"
        message={
          target
            ? `Warning: Deleting this log (ID: ${target.logId}) for customer ${target.customerUsername || "—"} is permanent. Continue?`
            : ""
        }
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}