"use client";

import * as React from "react";
import {
  Box, Paper, Stack, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  TablePagination, IconButton, Tooltip, Chip
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/pop-up/ConfirmDialog";
import { useSnack } from "@/components/snack/SnackProvider"; // ✅ ใช้ SnackProvider

type LogType = "CHECK_IN" | "CHECK_OUT" | "BOOK_SESSION" | "CANCEL_SESSION";

type CustomerLogRow = {
  logId: number;
  customerUsername: string;
  customerFirstName: string;
  customerLastName: string;
  timestamp: string;   // ISO
  logType: LogType;
};

// MOCK ตาม Q6A.1 (เรียงใหม่สุดก่อน)
const MOCK_LOGS: CustomerLogRow[] = [
  { logId: 104, customerUsername: "c.noon", customerFirstName: "Noon", customerLastName: "Nita", timestamp: "2025-10-30T14:25:36", logType: "CHECK_OUT" },
  { logId: 103, customerUsername: "c.noon", customerFirstName: "Noon", customerLastName: "Nita", timestamp: "2025-10-30T12:01:00", logType: "CHECK_IN" },
  { logId: 102, customerUsername: "c.ploy", customerFirstName: "Ploy", customerLastName: "Kawin", timestamp: "2025-10-29T18:45:00", logType: "CANCEL_SESSION" },
  { logId: 101, customerUsername: "c.ploy", customerFirstName: "Ploy", customerLastName: "Kawin", timestamp: "2025-10-29T10:00:00", logType: "BOOK_SESSION" },
  { logId: 100, customerUsername: "c.oak",  customerFirstName: "Oak",  customerLastName: "Rit",   timestamp: "2025-10-28T09:30:00", logType: "CHECK_IN" },
];

const COLUMNS = [
  { key: "logId", label: "Log ID" },
  { key: "customerUsername", label: "Username" },
  { key: "customerFirstName", label: "ชื่อลูกค้า" },
  { key: "customerLastName", label: "นามสกุล" },
  { key: "timestamp", label: "เวลาบันทึก" },
  { key: "logType", label: "ประเภท Log" },
] as const;

function formatDateTimeTH(iso: string) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("th-TH", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch { return "—"; }
}

export default function CustomerLogPage(): React.JSX.Element {
  const router = useRouter();
  const { setSnack } = useSnack(); // ✅ ดึง setSnack

  const [rows, setRows] = React.useState<CustomerLogRow[]>(
    [...MOCK_LOGS].sort((a, b) => {
      const t = b.timestamp.localeCompare(a.timestamp);
      return t !== 0 ? t : b.logId - a.logId;
    })
  );

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [targetRow, setTargetRow] = React.useState<CustomerLogRow | null>(null);

  const paged = React.useMemo(
    () => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [rows, page, rowsPerPage]
  );

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // ไปหน้าแก้ไข
  const goEdit = (r: CustomerLogRow) => {
    router.push(`/admin/customer-log/edit?id=${encodeURIComponent(String(r.logId))}`);
  };

  // ลบ (mock)
  const askDelete = (r: CustomerLogRow) => {
    setTargetRow(r);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (targetRow) {
      setRows((prev) => prev.filter((x) => x.logId !== targetRow.logId));
      // ✅ แจ้งเตือนผ่าน SnackProvider (มาตรฐานทั้งโปรเจ็กต์)
      setSnack({
        open: true,
        msg: `Log: ${targetRow.logId} deleted successfully`,
        severity: "success",
      });
    }
    setConfirmOpen(false);
    setTargetRow(null);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={400}>Customer Log</Typography>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: 3, position: "relative" }}>
        <Box sx={{ overflowX: "auto" }}>
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
              {paged.map((r) => (
                <TableRow key={r.logId} hover>
                  <TableCell>{r.logId}</TableCell>
                  <TableCell>{r.customerUsername}</TableCell>
                  <TableCell>{r.customerFirstName}</TableCell>
                  <TableCell>{r.customerLastName}</TableCell>
                  <TableCell>{formatDateTimeTH(r.timestamp)}</TableCell>
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

              {paged.length === 0 && (
                <TableRow>
                  <TableCell colSpan={COLUMNS.length + 1} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    ไม่พบข้อมูล
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        <Box
          sx={{
            position: "sticky",
            bottom: 0, right: 0, left: 0,
            background: (theme) => theme.palette.background.paper,
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <TablePagination
            component="div"
            count={rows.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10]}
          />
        </Box>
      </TableContainer>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="ยืนยันการลบ Log"
        message={
          targetRow
            ? `Warning: Deleting this log (ID: ${targetRow.logId}) for customer ${targetRow.customerUsername} is permanent. Continue?`
            : ""
        }
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}