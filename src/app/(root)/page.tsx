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
            sub: "Personal trainers, tailored programs. Access anywhere, anytime.",
            ctaSecondary: { href: "/plans", label: "View Plans" },
          },
          {
            img: "/hero-2.jpg",
            heading: "TRULY PERSONAL COACHING",
            sub: "Weekly check-ins and program adjustments to match your goals.",
          },
          {
            img: "/hero-3.jpg",
            heading: "CLASSES & PROGRAMS",
            sub: "Cardio, strength, and nutrition — everything in one place.",
            ctaPrimary: { href: "/courses", label: "Browse Courses" },
            ctaSecondary: { href: "/login", label: "Sign In" },
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
          Member Benefits at Private Fitness
        </Typography>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          justifyContent="center"
        >
          {[
            {
              title: "Fits Every Lifestyle",
              desc: "Flexible plans that adapt to your schedule and objectives.",
            },
            {
              title: "One Membership, Many Locations",
              desc: "Access multiple branches and devices with a single pass.",
            },
            {
              title: "Flexible & Commitment-Free",
              desc: "Renew by period and switch packages anytime.",
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
              { value: "1,200+", label: "Members trust us" },
              { value: "50+", label: "Weekly classes" },
              { value: "20+", label: "Certified coaches & trainers" },
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
          Ready to start your health & fitness journey?
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
            Join Now
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
            Talk to Us
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}