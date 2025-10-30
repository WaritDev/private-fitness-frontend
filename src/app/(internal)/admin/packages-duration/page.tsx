"use client";

import * as React from "react";
import {
  Box, Paper, Stack, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  IconButton, Tooltip, Chip, TablePagination
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter, useSearchParams } from "next/navigation";
import ConfirmDialog from "@/components/pop-up/ConfirmDialog";
import { useSnack } from "@/components/snack/SnackProvider";

type Status = "ACTIVE" | "EXPIRED" | "SUSPENDED" | "REFUNDED";

type Row = {
  Duration_Id: number;
  Customer_Username: string;
  Customer_First_Name: string;
  Customer_Last_Name: string;
  Product_Id: string;
  Product_Name: string;
  Product_Type: string;
  Product_Category: string;
  Duration_Days: number;
  Sales_Username: string;
  Purchase_Date: string; // ISO
  Start_Date: string;    // ISO
  End_Date: string;      // ISO
  Price_Paid: number;
  Discount_Amount: number;
  Status: Status;
  Created_At: string;    // ISO
};

// ---------- MOCK DATA (แทน Q3A.1 / Q3A.2) ----------
const MOCK: Row[] = Array.from({ length: 37 }).map((_, i) => {
  const id = 2000 + (36 - i);
  const start = new Date(2025, 9, 1 + (i % 10), 10, 0, 0);
  const end = new Date(start); end.setDate(start.getDate() + 30);
  const purch = new Date(start); purch.setDate(start.getDate() - 1);
  return {
    Duration_Id: id,
    Customer_Username: ["c.ploy", "c.noon", "c.oak"][i % 3],
    Customer_First_Name: ["Ploy", "Noon", "Oak"][i % 3],
    Customer_Last_Name: ["Kawin", "Nita", "Rit"][i % 3],
    Product_Id: `P${(i % 5) + 1}`,
    Product_Name: ["Monthly Gym", "Yoga 30d", "PT 12 Sessions", "Sauna 30d", "All Access 30d"][i % 5],
    Product_Type: ["DURATION", "SESSION"][i % 2],
    Product_Category: ["GYM", "YOGA", "PT", "SAUNA"][i % 4],
    Duration_Days: [30, 60, 90][i % 3],
    Sales_Username: ["bob.c", "pam.s", "mike.t"][i % 3],
    Purchase_Date: purch.toISOString(),
    Start_Date: start.toISOString(),
    End_Date: end.toISOString(),
    Price_Paid: 1990 + (i % 7) * 100,
    Discount_Amount: (i % 4) * 50,
    Status: (["ACTIVE", "EXPIRED", "SUSPENDED", "REFUNDED"] as Status[])[i % 4],
    Created_At: new Date(2025, 9, 1, 9, 0, 0 - i).toISOString(),
  };
});

// ---------- Utils ----------
const PAGE_SIZE = 10; // fixed ตาม requirement
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
const money = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

// ---------- Page ----------
export default function CustomerDurationPackagesPage(): React.JSX.Element {
  const router = useRouter();
  const sp = useSearchParams();
  const { setSnack } = useSnack();

  React.useEffect(() => {
    const toast = sp.get("toast");
    if (toast) setSnack({ open: true, msg: toast, severity: "success" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  // ORDER BY Created_At DESC, Duration_Id DESC (Q3A.1)
  const ordered = React.useMemo(
    () =>
      [...MOCK].sort((a, b) => {
        const t = b.Created_At.localeCompare(a.Created_At);
        return t !== 0 ? t : b.Duration_Id - a.Duration_Id;
      }),
    []
  );

  // Q3A.2 — COUNT(*)
  const totalItems = ordered.length;

  // state สำหรับ TablePagination
  const [page, setPage] = React.useState(0); // PageIndex เริ่ม 0
  const rowsPerPage = PAGE_SIZE; // fix 10

  const pageRows = React.useMemo(() => {
    const offset = page * rowsPerPage;
    return ordered.slice(offset, offset + rowsPerPage);
  }, [ordered, page, rowsPerPage]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = () => {
    // rowsPerPage fixed = 10 ตามสเปค ไม่ต้องทำอะไร
    setPage(0);
  };

  // Confirm ลบ
  const [confirm, setConfirm] = React.useState<{ open: boolean; target?: Row }>({ open: false });

  const goEdit = (r: Row) => {
    router.push(`/admin/packages-duration/edit?id=${r.Duration_Id}`);
  };
  const onDeleteClick = (r: Row) => setConfirm({ open: true, target: r });
  const doDelete = async () => {
    const id = confirm.target?.Duration_Id;
    setConfirm({ open: false });
    setSnack({ open: true, msg: `Duration_Id: ${id} deleted successfully`, severity: "success" });
    // หมายเหตุ: ในโปรดักชันควร refetch Q3A.1 / Q3A.2 แล้วอัปเดตตาราง
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} gap={2} flexWrap="wrap">
        <Typography variant="h5" fontWeight={400}>Customer Duration Packages</Typography>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: 3, overflowX: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Duration_Id</TableCell>
              <TableCell>Customer Username</TableCell>
              <TableCell>Customer Name</TableCell>
              <TableCell>Product_Id</TableCell>
              <TableCell>Product_Name</TableCell>
              <TableCell>Product_Type</TableCell>
              <TableCell>Product_Category</TableCell>
              <TableCell align="right">Duration_Days</TableCell>
              <TableCell>Sales_Username</TableCell>
              <TableCell>Purchase_Date</TableCell>
              <TableCell>Start_Date</TableCell>
              <TableCell>End_Date</TableCell>
              <TableCell align="right">Price_Paid</TableCell>
              <TableCell align="right">Discount_Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell sx={{ width: 120 }}>การจัดการ</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {pageRows.map((r) => (
              <TableRow key={r.Duration_Id} hover>
                <TableCell>{r.Duration_Id}</TableCell>
                <TableCell>{r.Customer_Username}</TableCell>
                <TableCell>{r.Customer_First_Name} {r.Customer_Last_Name}</TableCell>
                <TableCell>{r.Product_Id}</TableCell>
                <TableCell>{r.Product_Name}</TableCell>
                <TableCell>{r.Product_Type}</TableCell>
                <TableCell>{r.Product_Category}</TableCell>
                <TableCell align="right">{r.Duration_Days}</TableCell>
                <TableCell>{r.Sales_Username}</TableCell>
                <TableCell>{fmtTH(r.Purchase_Date)}</TableCell>
                <TableCell>{fmtTH(r.Start_Date)}</TableCell>
                <TableCell>{fmtTH(r.End_Date)}</TableCell>
                <TableCell align="right">{money(r.Price_Paid)}</TableCell>
                <TableCell align="right">{money(r.Discount_Amount)}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={r.Status}
                    color={
                      r.Status === "ACTIVE"
                        ? "success"
                        : r.Status === "EXPIRED"
                        ? "default"
                        : r.Status === "SUSPENDED"
                        ? "warning"
                        : "error"
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

            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={16} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* ✅ TablePagination แบบเดียวกับหน้าอื่น */}
        <TablePagination
          component="div"
          count={totalItems}             // Q3A.2 COUNT(*)
          page={page}                    // PageIndex เริ่ม 0
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}      // fixed 10
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10]}      // fixed ตาม requirement
        />
      </TableContainer>

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false })}
        title="ยืนยันการลบแพ็กเกจ Duration"
        message={
          confirm.target
            ? `ลบ Duration_Id: ${confirm.target.Duration_Id} ของลูกค้า ${confirm.target.Customer_Username} ?`
            : ""
        }
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={doDelete}
      />
    </Box>
  );
}