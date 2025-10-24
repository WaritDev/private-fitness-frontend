"use client";

import * as React from "react";
import dayjs, { Dayjs } from "dayjs";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  LocalizationProvider,
  DateCalendar,
  PickersDay,
  TimePicker,
} from "@mui/x-date-pickers";
import type { PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";

const PRIMARY = { main: "#38E07A", dark: "#2fbb65" } as const;

type Appointment = {
  id: string;
  customer: string;
  note?: string;
  date: string;  // "YYYY-MM-DD"
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
};

type WorkingDays = { [dow: number]: boolean };
type OffDay = string; // "YYYY-MM-DD"

const MOCK_APPTS: Appointment[] = [
  {
    id: "a1",
    customer: "Somchai",
    note: "PT Upper body",
    date: dayjs().format("YYYY-MM-DD"),
    start: "10:00",
    end: "11:00",
  },
  {
    id: "a2",
    customer: "Warunee",
    date: dayjs().add(1, "day").format("YYYY-MM-DD"),
    start: "14:00",
    end: "15:00",
  },
];

export default function TrainerCalendarPage(): React.JSX.Element {
  const [selected, setSelected] = React.useState<Dayjs>(dayjs());
  const [appts, setAppts] = React.useState<Appointment[]>(MOCK_APPTS);
  const [working, setWorking] = React.useState<WorkingDays>({
    0: false, 1: true, 2: true, 3: true, 4: true, 5: true, 6: false,
  });
  const [offDays, setOffDays] = React.useState<OffDay[]>([]);

  const [openForm, setOpenForm] = React.useState<boolean>(false);
  const [editing, setEditing] = React.useState<Appointment | null>(null);

  const [formDate, setFormDate] = React.useState<Dayjs>(selected);
  const [formStart, setFormStart] = React.useState<Dayjs>(dayjs().hour(10).minute(0));
  const [formEnd, setFormEnd] = React.useState<Dayjs>(dayjs().hour(11).minute(0));
  const [formCustomer, setFormCustomer] = React.useState<string>("");
  const [formNote, setFormNote] = React.useState<string>("");

  const keyOf = (d: Dayjs): string => d.format("YYYY-MM-DD");
  const isOffDay = (d: Dayjs): boolean => offDays.includes(keyOf(d));
  const isWorkingDow = (d: Dayjs): boolean => !!working[d.day()];

  const apptsOfSelected = React.useMemo(
    () =>
      appts
        .filter((a) => a.date === keyOf(selected))
        .sort((a, b) => a.start.localeCompare(b.start)),
    [appts, selected]
  );

  const toggleOffDay = (d: Dayjs): void => {
    const k = keyOf(d);
    setOffDays((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  const upsertAppt = (val: Appointment): void => {
    setAppts((prev) =>
      prev.some((a) => a.id === val.id)
        ? prev.map((a) => (a.id === val.id ? val : a))
        : [val, ...prev]
    );
  };

  const removeAppt = (id: string): void =>
    setAppts((prev) => prev.filter((a) => a.id !== id));

  const openCreate = (day?: Dayjs): void => {
    const base = day ?? selected;
    setEditing(null);
    setFormDate(base);
    setFormStart(base.hour(10).minute(0));
    setFormEnd(base.hour(11).minute(0));
    setFormCustomer("");
    setFormNote("");
    setOpenForm(true);
  };

  const openEdit = (a: Appointment): void => {
    setEditing(a);
    setFormDate(dayjs(a.date));
    setFormStart(dayjs(`${a.date} ${a.start}`));
    setFormEnd(dayjs(`${a.date} ${a.end}`));
    setFormCustomer(a.customer);
    setFormNote(a.note ?? "");
    setOpenForm(true);
  };

  const submitForm = (): void => {
    const newA: Appointment = {
      id: editing?.id ?? crypto.randomUUID(),
      customer: formCustomer.trim() || "Customer",
      note: formNote.trim() || undefined,
      date: formDate.format("YYYY-MM-DD"),
      start: formStart.format("HH:mm"),
      end: formEnd.format("HH:mm"),
    };
    upsertAppt(newA);
    setOpenForm(false);
  };

  function DayWithMarkers(props: PickersDayProps): React.JSX.Element {
    const { day, outsideCurrentMonth, ...other } = props;
    const d: Dayjs = day as unknown as Dayjs;
    const k = keyOf(d);
    const hasAppt = appts.some((a) => a.date === k);
    const off = isOffDay(d);
    const work = isWorkingDow(d);

    return (
      <Box sx={{ position: "relative" }}>
        <PickersDay {...other} day={d as unknown as never} outsideCurrentMonth={outsideCurrentMonth} />
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 4,
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {hasAppt && (
            <Box sx={{ width: 6, height: 6, borderRadius: 99, bgcolor: PRIMARY.main }} />
          )}
          {off && (
            <Box sx={{ width: 6, height: 6, borderRadius: 99, bgcolor: "error.main" }} />
          )}
          {work && !off && (
            <Box sx={{ width: 6, height: 6, borderRadius: 99, bgcolor: "success.main", opacity: 0.6 }} />
          )}
        </Stack>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={500}>
            ปฏิทินงานเทรนเนอร์
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => toggleOffDay(selected)}>
              {isOffDay(selected) ? "ยกเลิกวันหยุด" : "ตั้งวันหยุด (วันนี้)"}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ bgcolor: PRIMARY.main, "&:hover": { bgcolor: PRIMARY.dark } }}
              onClick={() => openCreate()}
            >
              เพิ่มนัดหมาย
            </Button>
          </Stack>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          <Card sx={{ flex: "0 0 360px" }}>
            <CardContent>
              <DateCalendar
                value={selected}
                onChange={(d: Dayjs | null) => d && setSelected(d)}
                views={["day"]}
                slots={{ day: DayWithMarkers }}
              />

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                วันทำงานประจำสัปดาห์
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((lbl, i) => (
                  <FormControlLabel
                    key={i}
                    control={
                      <Checkbox
                        size="small"
                        checked={!!working[i]}
                        onChange={(_e: React.ChangeEvent<HTMLInputElement>, checked: boolean) =>
                          setWorking((prev) => ({ ...prev, [i]: checked }))
                        }
                      />
                    }
                    label={lbl}
                  />
                ))}
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip label="มีนัด" size="small" sx={{ bgcolor: PRIMARY.main, color: "#0e2016" }} />
                <Chip label="วันหยุด" size="small" color="error" variant="outlined" />
                <Chip label="วันทำงาน" size="small" color="success" variant="outlined" />
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="h6">
                  นัดหมายวันที่ {selected.format("DD/MM/YYYY")}
                </Typography>
                <Tooltip title="เพิ่มนัดหมาย">
                  <IconButton color="primary" onClick={() => openCreate(selected)}>
                    <EventAvailableIcon />
                  </IconButton>
                </Tooltip>
              </Stack>

              {apptsOfSelected.length === 0 ? (
                <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
                  ยังไม่มีนัดหมายในวันนี้
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {apptsOfSelected.map((a) => (
                    <Card key={a.id} variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ py: 1.5 }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          flexWrap="wrap"
                          gap={1}
                        >
                          <Stack spacing={0.3}>
                            <Typography fontWeight={600}>{a.customer}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {a.start}–{a.end} • {a.note ?? "PT Session"}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1}>
                            <IconButton size="small" color="primary" onClick={() => openEdit(a)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => removeAppt(a.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>

        <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editing ? "แก้ไขนัดหมาย" : "เพิ่มนัดหมาย"}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <DateCalendar value={formDate} onChange={(d: Dayjs | null) => d && setFormDate(d)} />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TimePicker
                  label="เริ่มต้น"
                  value={formStart}
                  onChange={(v: Dayjs | null) => v && setFormStart(v)}
                />
                <TimePicker
                  label="สิ้นสุด"
                  value={formEnd}
                  onChange={(v: Dayjs | null) => v && setFormEnd(v)}
                />
              </Stack>
              <TextField
                label="ชื่อลูกค้า"
                value={formCustomer}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormCustomer(e.target.value)}
                fullWidth
              />
              <TextField
                label="บันทึกย่อ"
                value={formNote}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormNote(e.target.value)}
                fullWidth
                multiline
                minRows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenForm(false)}>ยกเลิก</Button>
            <Button
              variant="contained"
              onClick={submitForm}
              sx={{ bgcolor: PRIMARY.main, "&:hover": { bgcolor: PRIMARY.dark } }}
            >
              บันทึก
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}