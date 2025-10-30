"use client";

import * as React from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Container,
  TextField,
  LinearProgress,
  Skeleton,
  Alert,
  Chip,
  Divider,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { LineChart } from "@mui/x-charts";

const primary = { main: "#38E07A", dark: "#2fbb65" } as const;

interface DashboardSummary {
  totalRevenueTHB: number;
  newMembers30d: number;
  activeMembers: number;
  checkinsToday: number;
  completedPT30d: number;
  revenueSpark: number[];
  newMembersSpark: number[];
  checkinsSpark: number[];
  ptSpark: number[];
  topProducts: { name: string; units: number }[];
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") ||
  "http://localhost:8000";

const formatTHB = (v: number) =>
  v.toLocaleString("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  });

function MetricCard({
  title,
  value,
  subtitle,
  series,
}: {
  title: string;
  value: string;
  subtitle?: string;
  series?: number[];
}) {
  return (
    <Card sx={{ height: "100%", borderRadius: 3, minWidth: 260 }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="h4" fontWeight={400} sx={{ mb: 1 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        {!!series?.length && (
          <Box sx={{ mt: 2 }}>
            <LineChart
              xAxis={[{ scaleType: "point", data: series.map((_, i) => i + 1) }]}
              series={[{ data: series, showMark: false, color: primary.main }]}
              height={120}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

async function fetchDashboard(start: string, end: string, signal: AbortSignal) {
  // GET http://localhost:8000/api/manager/dashboard?start=YYYY-MM-DD&end=YYYY-MM-DD
  const url = `${API_BASE}/api/manager/dashboard?start=${encodeURIComponent(
    start
  )}&end=${encodeURIComponent(end)}`;
  const res = await fetch(url, {
    method: "GET",
    mode: "cors",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${msg || "failed to load"}`);
  }
  const j = (await res.json()) as DashboardSummary;
  return j;
}

export default function Page(): React.JSX.Element {
  const today = new Date();
  const defaultEnd = today.toISOString().slice(0, 10);
  const defaultStart = new Date(today.getTime() - 29 * 86400000)
    .toISOString()
    .slice(0, 10);

  const [start, setStart] = React.useState(defaultStart);
  const [end, setEnd] = React.useState(defaultEnd);

  const [loading, setLoading] = React.useState<boolean>(true);
  const [data, setData] = React.useState<DashboardSummary | null>(null);
  const [error, setError] = React.useState<string>("");

  const controllerRef = React.useRef<AbortController | null>(null);

  const load = React.useCallback(async () => {
    controllerRef.current?.abort();
    const ctrl = new AbortController();
    controllerRef.current = ctrl;

    setLoading(true);
    setError("");
    try {
      const j = await fetchDashboard(start, end, ctrl.signal);
      setData(j);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "failed";
      setError(msg || "โหลดข้อมูลไม่สำเร็จ");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  React.useEffect(() => {
    load();
    return () => controllerRef.current?.abort();
  }, [load]);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h4" fontWeight={400}>
          Dashboard
        </Typography>

        <Stack direction="row" gap={1.5} alignItems="center" flexWrap="wrap">
          <TextField
            label="Start"
            type="date"
            size="small"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End"
            type="date"
            size="small"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={load}
            sx={{
              backgroundColor: primary.main,
              "&:hover": { backgroundColor: primary.dark },
              textTransform: "none",
            }}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {loading && (
        <>
          <LinearProgress sx={{ mb: 2 }} />
          <Stack direction="row" gap={3} flexWrap="wrap" sx={{ mb: 3 }}>
            {[...Array(4)].map((_, i) => (
              <Card key={i} sx={{ flex: "1 1 280px", minWidth: 260 }}>
                <CardContent>
                  <Skeleton width="40%" />
                  <Skeleton height={40} />
                  <Skeleton width="60%" />
                </CardContent>
              </Card>
            ))}
          </Stack>
        </>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && data && (
        <>
          <Stack direction="row" flexWrap="wrap" gap={3} sx={{ mb: 3 }}>
            <Box
              sx={{
                flex: "1 1 280px",
                width: { xs: "100%", md: "calc(50% - 12px)", lg: "calc(33.333% - 16px)" },
              }}
            >
              <MetricCard
                title="Total Revenue"
                value={formatTHB(data.totalRevenueTHB)}
                subtitle={`ช่วง ${start} ถึง ${end}`}
                series={data.revenueSpark}
              />
            </Box>
            <Box
              sx={{
                flex: "1 1 280px",
                width: { xs: "100%", md: "calc(50% - 12px)", lg: "calc(33.333% - 16px)" },
              }}
            >
              <MetricCard
                title="New Members"
                value={String(data.newMembers30d)}
                subtitle="Last 30 Days"
                series={data.newMembersSpark}
              />
            </Box>
            <Box
              sx={{
                flex: "1 1 280px",
                width: { xs: "100%", md: "calc(50% - 12px)", lg: "calc(33.333% - 16px)" },
              }}
            >
              <MetricCard
                title="Total Active Members"
                value={String(data.activeMembers)}
              />
            </Box>
          </Stack>

          <Stack direction="row" flexWrap="wrap" gap={3} sx={{ mb: 4 }}>
            <Box
              sx={{
                flex: "1 1 360px",
                width: { xs: "100%", md: "calc(50% - 12px)" },
              }}
            >
              <MetricCard
                title="Check-ins Today"
                value={String(data.checkinsToday)}
                subtitle="As of now"
                series={data.checkinsSpark}
              />
            </Box>
            <Box
              sx={{
                flex: "1 1 360px",
                width: { xs: "100%", md: "calc(50% - 12px)" },
              }}
            >
              <MetricCard
                title="Completed PT Classes"
                value={String(data.completedPT30d)}
                subtitle="Last 30 Days"
                series={data.ptSpark}
              />
            </Box>
          </Stack>

          <Divider sx={{ mb: 2 }} />
          <Box sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6">Top Selling Products</Typography>
            <Chip
              label={`${data.topProducts.length} รายการ`}
              size="small"
              sx={{
                bgcolor: "rgba(56,224,122,0.12)",
                color: primary.dark,
                border: `1px solid ${primary.main}`,
              }}
            />
          </Box>

          <Stack direction="row" gap={2} flexWrap="wrap">
            {data.topProducts.map((p, idx) => (
              <Card
                key={`${p.name}-${idx}`}
                sx={{ flex: "1 1 200px", minWidth: 200, borderRadius: 2 }}
              >
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {p.name}
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>{p.units}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Units Sold
                  </Typography>
                </CardContent>
              </Card>
            ))}

            {data.topProducts.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No products found in this period
              </Typography>
            )}
          </Stack>
        </>
      )}
    </Container>
  );
}