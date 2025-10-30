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
  Avatar,
  Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter, useSearchParams } from "next/navigation";
import ConfirmDialog from "@/components/pop-up/ConfirmDialog";
import { useSnack } from "@/components/snack/SnackProvider";

type PaymentAccount = {
  Payment_Account_Id: number;
  Account_Name: string;
  Account_Number: string; // โชว์แบบแมสก์
  Bank_Name: string;
  QR_Code_URL: string | null; // แสดง Avatar เล็ก ๆ ถ้ามี
  Is_Active: boolean;
};

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" } as const;

// ===== MOCK (แทนผล Q7A.1: ORDER BY Is_Active DESC, Payment_Account_Id DESC) =====
const MOCK: PaymentAccount[] = [
  {
    Payment_Account_Id: 105,
    Account_Name: "Gym Co.,Ltd - KBank",
    Account_Number: "123-4-56789-0",
    Bank_Name: "KASIKORNBANK",
    QR_Code_URL: "https://fakeimg.pl/80x80/?text=QR1",
    Is_Active: true,
  },
  {
    Payment_Account_Id: 104,
    Account_Name: "Gym Co.,Ltd - SCB",
    Account_Number: "111-2-33333-4",
    Bank_Name: "SCB",
    QR_Code_URL: "https://fakeimg.pl/80x80/?text=QR2",
    Is_Active: true,
  },
  {
    Payment_Account_Id: 90,
    Account_Name: "Gym Co.,Ltd - BBL",
    Account_Number: "777-0-11111-2",
    Bank_Name: "BANGKOK BANK",
    QR_Code_URL: null,
    Is_Active: false,
  },
];

function maskAcct(acct: string) {
  // 123-4-56789-0 -> 123-*-*****-0
  if (!acct) return "—";
  return acct.replace(/\d(?=\d{2,3}(\D|$))/g, "*");
}

export default function PaymentsManagementPage(): React.JSX.Element {
  const router = useRouter();
  const sp = useSearchParams();
  const { setSnack } = useSnack();

  // เรียงตาม Q7A.1: Active ก่อน แล้ว id มาก -> น้อย
  const [rows, setRows] = React.useState<PaymentAccount[]>(
    [...MOCK].sort((a, b) => (a.Is_Active === b.Is_Active ? 0 : a.Is_Active ? -1 : 1) || b.Payment_Account_Id - a.Payment_Account_Id)
  );

  // Pagination แบบเดียวกับหน้าที่คุณใช้ก่อนหน้า
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  // Confirm ลบ
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [target, setTarget] = React.useState<PaymentAccount | null>(null);

  // รับ toast จากหน้า add/edit ผ่าน query ?toast=
  React.useEffect(() => {
    const toast = sp.get("toast");
    if (toast) setSnack({ open: true, msg: toast, severity: "success" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const paged = React.useMemo(
    () => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [rows, page, rowsPerPage]
  );

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const goAdd = () => router.push("/admin/payments-management/add");
  const goEdit = (row: PaymentAccount) =>
    router.push(`/admin/payments-management/edit?id=${encodeURIComponent(String(row.Payment_Account_Id))}`);

  const askDelete = (row: PaymentAccount) => {
    setTarget(row);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (target) {
      // MOCK ลบ
      setRows((prev) => prev.filter((r) => r.Payment_Account_Id !== target.Payment_Account_Id));
      setSnack({
        open: true,
        msg: `Payment Account: ${target.Payment_Account_Id} deleted successfully`,
        severity: "success",
      });
    }
    setConfirmOpen(false);
    setTarget(null);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={400}>Payment Accounts</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={goAdd}
          sx={{ backgroundColor: PRIMARY.main, "&:hover": { backgroundColor: PRIMARY.dark } }}
        >
          Add
        </Button>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: 3, overflowX: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>Account Name</TableCell>
              <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>Account Number</TableCell>
              <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>Bank</TableCell>
              <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>QR</TableCell>
              <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>Active</TableCell>
              <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap", width: 140 }}>การจัดการ</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paged.map((r) => (
              <TableRow key={r.Payment_Account_Id} hover>
                <TableCell>{r.Payment_Account_Id}</TableCell>
                <TableCell>{r.Account_Name}</TableCell>
                <TableCell>{maskAcct(r.Account_Number)}</TableCell>
                <TableCell>{r.Bank_Name}</TableCell>
                <TableCell>
                  {r.QR_Code_URL ? (
                    <Avatar
                      src={r.QR_Code_URL}
                      alt="qr"
                      sx={{ width: 28, height: 28 }}
                      variant="rounded"
                    />
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
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* ✅ Pagination แบบเดียวกับที่คุณใช้ */}
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

      {/* Confirm ลบ */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="ยืนยันการลบบัญชีรับชำระเงิน"
        message={
          target
            ? `Warning: Deleting payment account ${target.Payment_Account_Id} (${target.Account_Name}) is permanent. Continue?`
            : ""
        }
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}