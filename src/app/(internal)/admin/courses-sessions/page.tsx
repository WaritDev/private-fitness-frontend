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
import { useSnack } from "@/components/snack/SnackProvider";

type Status = "ACTIVE" | "EXPIRED" | "FROZEN" | "CANCELLED";

type SessionCourseRow = {
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
  Session_Amount: number;            // จำนวน Session ในสินค้า
  Sales_Username: string;
  Purchase_Date: string;             // YYYY-MM-DD
  Total_Sessions: number;            // รวม Session สิทธิ์
  Used_Sessions: number;             // ใช้ไปแล้ว
  Price_Paid: number;                // หน่วยเป็นสกุลเงินย่อย/บาทก็ได้ตามที่เก็บ
  Discount_Amount: number;
  Status: Status;
};

const MOCK_ROWS: SessionCourseRow[] = [
  {
    Session_Id: 5012,
    Customer_Username: "c.noon",
    Customer_First_Name: "Noon",
    Customer_Last_Name: "Nita",
    Trainer_Username: "krit.t",
    Trainer_First_Name: "Krit",
    Trainer_Last_Name: "Tana",
    Product_Id: "PT12",
    Product_Name: "PT 12 Sessions",
    Product_Type: "SESSION",
    Product_Category: "PT",
    Session_Amount: 12,
    Sales_Username: "pam.s",
    Purchase_Date: "2025-10-20",
    Total_Sessions: 12,
    Used_Sessions: 3,
    Price_Paid: 8900,
    Discount_Amount: 500,
    Status: "ACTIVE",
  },
  {
    Session_Id: 5011,
    Customer_Username: "c.ploy",
    Customer_First_Name: "Ploy",
    Customer_Last_Name: "Kawin",
    Trainer_Username: "alice.b",
    Trainer_First_Name: "Alice",
    Trainer_Last_Name: "Brown",
    Product_Id: "YOGA8",
    Product_Name: "Yoga 8 Sessions",
    Product_Type: "SESSION",
    Product_Category: "YOGA",
    Session_Amount: 8,
    Sales_Username: "bob.c",
    Purchase_Date: "2025-10-15",
    Total_Sessions: 8,
    Used_Sessions: 8,
    Price_Paid: 4200,
    Discount_Amount: 0,
    Status: "EXPIRED",
  },
  {
    Session_Id: 5010,
    Customer_Username: "c.oak",
    Customer_First_Name: "Oak",
    Customer_Last_Name: "Rit",
    Trainer_Username: "mark.l",
    Trainer_First_Name: "Mark",
    Trainer_Last_Name: "Lee",
    Product_Id: "HIIT6",
    Product_Name: "HIIT 6 Sessions",
    Product_Type: "SESSION",
    Product_Category: "HIIT",
    Session_Amount: 6,
    Sales_Username: "fon.w",
    Purchase_Date: "2025-10-10",
    Total_Sessions: 6,
    Used_Sessions: 2,
    Price_Paid: 3000,
    Discount_Amount: 100,
    Status: "FROZEN",
  },
];

const COLUMNS = [
  { key: "Session_Id", label: "Session ID" },
  { key: "Customer_Username", label: "Customer" },
  { key: "Trainer_Username", label: "Trainer" },
  { key: "Product_Name", label: "Product" },
  { key: "Session_Amount", label: "Session/Pack" },
  { key: "Total_Sessions", label: "Total" },
  { key: "Used_Sessions", label: "Used" },
  { key: "Remaining_Sessions", label: "Remaining" },
  { key: "Price_Paid", label: "Paid" },
  { key: "Discount_Amount", label: "Discount" },
  { key: "Status", label: "Status" },
] as const;

export default function CustomerSessionCoursesPage(): React.JSX.Element {
  const router = useRouter();
  const { setSnack } = useSnack();

  const [rows, setRows] = React.useState<SessionCourseRow[]>(
    [...MOCK_ROWS].sort((a, b) => b.Session_Id - a.Session_Id) // แทน ORDER BY Created_At DESC, Session_Id DESC (mock)
  );
  const [page, setPage] = React.useState(0);             // PageIndex เริ่ม 0
  const [rowsPerPage, setRowsPerPage] = React.useState(10); // PageSize = 10

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [target, setTarget] = React.useState<SessionCourseRow | null>(null);

  const fmtBaht = (n: number) =>
    new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

  const paged = React.useMemo(
    () => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [rows, page, rowsPerPage]
  );

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const remaining = (r: SessionCourseRow) => r.Total_Sessions - r.Used_Sessions;

  const goEdit = (r: SessionCourseRow) => {
    router.push(`/admin/courses-sessions/edit?id=${encodeURIComponent(String(r.Session_Id))}`);
  };

  const askDelete = (r: SessionCourseRow) => {
    setTarget(r);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (target) {
      setRows(prev => prev.filter(x => x.Session_Id !== target.Session_Id));
      setSnack({
        open: true,
        msg: `Session: ${target.Session_Id} deleted successfully`,
        severity: "success",
      });
    }
    setConfirmOpen(false);
    setTarget(null);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} gap={2} flexWrap="wrap">
        <Typography variant="h5" fontWeight={400}>Customer Session Courses</Typography>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: 3, overflowX: "auto" }}>
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
              <TableRow key={r.Session_Id} hover>
                <TableCell>{r.Session_Id}</TableCell>
                <TableCell>
                  {r.Customer_First_Name} {r.Customer_Last_Name}
                  <Typography variant="caption" display="block" color="text.secondary">
                    {r.Customer_Username}
                  </Typography>
                </TableCell>
                <TableCell>
                  {r.Trainer_First_Name} {r.Trainer_Last_Name}
                  <Typography variant="caption" display="block" color="text.secondary">
                    {r.Trainer_Username}
                  </Typography>
                </TableCell>
                <TableCell>
                  {r.Product_Name}
                  <Typography variant="caption" display="block" color="text.secondary">
                    {r.Product_Category} • {r.Product_Type}
                  </Typography>
                </TableCell>
                <TableCell>{r.Session_Amount}</TableCell>
                <TableCell>{r.Total_Sessions}</TableCell>
                <TableCell>{r.Used_Sessions}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={remaining(r)}
                    color={remaining(r) > 0 ? "success" : "default"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{fmtBaht(r.Price_Paid)}</TableCell>
                <TableCell>{fmtBaht(r.Discount_Amount)}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={r.Status}
                    color={
                      r.Status === "ACTIVE" ? "success" :
                      r.Status === "FROZEN" ? "warning" :
                      r.Status === "CANCELLED" ? "error" : "default"
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

        {/* pagination แบบเดียวกับที่ระบุ */}
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

      {/* Confirm Delete */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="ยืนยันการลบ Session Course"
        message={
          target
            ? `Warning: Deleting this session course (ID: ${target.Session_Id}) for customer ${target.Customer_Username} is permanent. Continue?`
            : ""
        }
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}