"use client";

import Link from "next/link";
import HeroCarousel from "@/components/HeroCarousel";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
} from "@mui/material";

const primary = {
  main: "#38E07A",
  dark: "#2fbb65",
};

export default function HomePage() {
  return (
    <Box>
      {/* Hero */}
      <HeroCarousel
        slides={[
          {
            img: "/hero-1.jpg",
            heading: "PRIVATE FITNESS\nMEMBERSHIPS",
            sub: "เทรนเนอร์ส่วนตัว โปรแกรมเฉพาะคุณ เข้าถึงได้ทุกที่ ทุกเวลา",
            ctaSecondary: { href: "/plans", label: "ดูแพ็กเกจ" },
          },
          {
            img: "/hero-2.jpg",
            heading: "COACHING แบบ PERSONAL",
            sub: "ติดตามผลและปรับโปรแกรมรายสัปดาห์",
          },
          {
            img: "/hero-3.jpg",
            heading: "CLASS & PROGRAMS",
            sub: "คาร์ดิโอ เวท โภชนาการ — ครบในที่เดียว",
            ctaPrimary: { href: "/courses", label: "ดูคอร์ส" },
            ctaSecondary: { href: "/login", label: "เข้าสู่ระบบ" },
          },
        ]}
        interval={5500}
      />

      {/* Benefits */}
      <Box className="container" sx={{ py: 8 }}>
        <Typography
          variant="h4"
          align="center"
          fontWeight={500}
          gutterBottom
          sx={{ mb: 4 }}
        >
          สิทธิประโยชน์สมาชิก Private Fitness
        </Typography>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          justifyContent="center"
        >
          {[
            {
              title: "เหมาะกับทุกไลฟ์สไตล์",
              desc: "ปรับแผนให้เข้ากับตารางชีวิตและเป้าหมายของคุณ",
            },
            {
              title: "สมาชิกใบเดียว",
              desc: "เข้าได้หลายสาขา/หลายอุปกรณ์อย่างยืดหยุ่น",
            },
            {
              title: "ยืดหยุ่น ไม่ผูกมัด",
              desc: "เลือกต่ออายุเป็นรอบ ๆ ปรับเปลี่ยนแพ็กเกจได้ตลอด",
            },
          ].map((item, i) => (
            <Card
              key={i}
              sx={{
                flex: 1,
                borderRadius: 3,
                boxShadow: 2,
                minHeight: 160,
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {item.title}
                </Typography>
                <Typography color="text.secondary">{item.desc}</Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>

      {/* Stats */}
      <Box sx={{ py: 8, backgroundColor: "#f5f5f5" }}>
        <Box className="container">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={6}
            justifyContent="center"
            alignItems="center"
          >
            {[
              { value: "1,200+", label: "สมาชิกที่ไว้ใจเรา" },
              { value: "50+", label: "คลาสรายสัปดาห์" },
              { value: "20+", label: "โค้ชและเทรนเนอร์มืออาชีพ" },
            ].map((s, i) => (
              <Stack key={i} alignItems="center" spacing={1}>
                <Typography variant="h4" fontWeight={600} color="primary">
                  {s.value}
                </Typography>
                <Typography color="text.secondary">{s.label}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>

      {/* CTA */}
      <Box className="container" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom fontWeight={500}>
          พร้อมเริ่มเส้นทางสุขภาพของคุณแล้วหรือยัง?
        </Typography>
        <Stack
          direction="row"
          justifyContent="center"
          spacing={2}
          flexWrap="wrap"
          mt={2}
        >
          <Button
            component={Link}
            href="/signup"
            variant="contained"
            size="large"
            sx={{
              backgroundColor: primary.main,
              "&:hover": { backgroundColor: primary.dark },
              borderRadius: 2,
              px: 4,
            }}
          >
            สมัครสมาชิกวันนี้
          </Button>
          <Button
            component={Link}
            href="/contact"
            variant="outlined"
            size="large"
            sx={{
              borderColor: primary.main,
              color: primary.main,
              borderRadius: 2,
              px: 4,
              "&:hover": {
                backgroundColor: primary.main,
                color: "#fff",
              },
            }}
          >
            คุยกับเรา
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}