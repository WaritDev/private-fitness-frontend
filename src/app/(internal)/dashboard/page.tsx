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
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import { LineChart } from "@mui/x-charts";

const primary = {
  main: "#38E07A",
  dark: "#2fbb65",
};
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
}

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
    <Card sx={{ height: "100%", borderRadius: 3 }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
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

export default function ManagerDashboardContent() {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<DashboardSummary | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/manager/dashboard", { cache: "no-store" });
        if (!res.ok) throw new Error("non-200");
        const j = (await res.json()) as DashboardSummary;
        if (mounted) setData(j);
      } catch {
        const demo: DashboardSummary = {
          totalRevenueTHB: 450000,
          newMembers30d: 120,
          activeMembers: 850,
          checkinsToday: 95,
          completedPT30d: 210,
          revenueSpark: [30, 44, 32, 60, 55, 72, 65, 90, 70, 95],
          newMembersSpark: [3, 6, 4, 8, 7, 9, 6, 10, 7, 12],
          checkinsSpark: [20, 24, 26, 34, 40, 42, 48, 52, 60, 62],
          ptSpark: [2, 5, 6, 8, 10, 7, 12, 14, 16, 18],
        };
        if (mounted) setData(demo);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
        <Typography variant="h4" fontWeight={900}>
          Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<DescriptionIcon />}
          sx={{
            backgroundColor: primary.main,
            "&:hover": { backgroundColor: primary.dark },
            textTransform: "none",
            borderRadius: 2,
          }}
        >
          New Report
        </Button>
      </Box>

      {loading || !data ? (
        <Typography color="text.secondary">Loading dashboard…</Typography>
      ) : (
        <>
          <Stack direction="row" flexWrap="wrap" gap={3} sx={{ mb: 3 }}>
            {[
              <MetricCard
                key="rev"
                title="Total Revenue"
                value={formatTHB(data.totalRevenueTHB)}
                subtitle="Last 30 Days"
                series={data.revenueSpark}
              />,
              <MetricCard
                key="new"
                title="New Members"
                value={String(data.newMembers30d)}
                subtitle="Last 30 Days"
                series={data.newMembersSpark}
              />,
              <MetricCard
                key="act"
                title="Total Active Members"
                value={String(data.activeMembers)}
              />,
            ].map((card, i) => (
              <Box
                key={i}
                sx={{
                  flex: "1 1 280px",
                  width: { xs: "100%", md: "calc(50% - 12px)", lg: "calc(33.333% - 16px)" },
                }}
              >
                {card}
              </Box>
            ))}
          </Stack>

          <Stack direction="row" flexWrap="wrap" gap={3}>
            {[
              <MetricCard
                key="chk"
                title="Check-ins Today"
                value={String(data.checkinsToday)}
                subtitle="As of now"
                series={data.checkinsSpark}
              />,
              <MetricCard
                key="pt"
                title="Completed PT Classes"
                value={String(data.completedPT30d)}
                subtitle="Last 30 Days"
                series={data.ptSpark}
              />,
            ].map((card, i) => (
              <Box
                key={i}
                sx={{
                  flex: "1 1 360px",
                  width: { xs: "100%", md: "calc(50% - 12px)", lg: "calc(50% - 12px)" },
                }}
              >
                {card}
              </Box>
            ))}
          </Stack>
        </>
      )}
    </Container>
  );
}