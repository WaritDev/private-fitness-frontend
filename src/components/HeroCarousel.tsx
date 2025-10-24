"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
    Box,
    Typography,
    Button,
    Stack,
    IconButton,
    Container,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

type Slide = {
    img: string;
    heading?: string;
    sub?: string;
    ctaPrimary?: { href: string; label: string };
    ctaSecondary?: { href: string; label: string };
};

export default function HeroCarousel({
slides,
interval = 10000,
}: {
slides: Slide[];
interval?: number;
}) {
const [index, setIndex] = useState(0);
const [direction, setDirection] = useState<1 | -1>(1);
const timer = useRef<NodeJS.Timeout | null>(null);
const count = slides.length;

const startAutoplay = () => {
stop();
timer.current = setInterval(() => go(1), interval);
};
const stop = () => {
if (timer.current) clearInterval(timer.current);
timer.current = null;
};

const go = (delta: number) => {
setDirection(delta >= 0 ? 1 : -1);
setIndex((p) => (p + delta + count) % count);
};

const goTo = (i: number) => {
if (i === index) return;
const forwardSteps = (i - index + count) % count;
const backwardSteps = (index - i + count) % count;
setDirection(forwardSteps <= backwardSteps ? 1 : -1);
setIndex(i);
};

useEffect(() => {
startAutoplay();
return stop;
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [index, interval]);

const s = slides[index];

return (
<Box
    sx={{
    position: "relative",
    width: "100%",
    height: { xs: 480, md: 560 },
    overflow: "hidden",
    boxShadow: 4,
    mb: 6,
    borderTop: "10px solid #38E07A",
    borderBottom: "10px solid #38E07A",
    borderLeft: 0,
    borderRight: 0,
    borderRadius: 0,
    }}
    onMouseEnter={stop}
    onMouseLeave={startAutoplay}
>
    <AnimatePresence mode="wait" custom={direction}>
        <motion.div
            key={index}
            custom={direction}
            initial={{ opacity: 0.8, x: 0 * direction }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0.8, x: -0 * direction }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
        <Image
        src={s.img}
        alt={s.heading ?? "slide"}
        fill
        priority
        sizes="100vw"
        style={{ objectFit: "cover" }}
        />
        <Box
        sx={{
            position: "absolute",
            inset: 0,
            background:
            "linear-gradient(to right, rgba(0,0,0,.55) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0) 100%)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
        }}
        >
        <Container maxWidth="lg">
            <Stack spacing={2} maxWidth="sm">
            {s.heading && (
                <Typography variant="h3" fontWeight={600} sx={{ whiteSpace: "pre-line" }}>
                {s.heading}
                </Typography>
            )}
            {s.sub && (
                <Typography variant="h6" fontWeight={300} sx={{ opacity: 0.9 }}>
                {s.sub}
                </Typography>
            )}
            <Stack direction="row" spacing={2} mt={2} flexWrap="wrap">
                {s.ctaPrimary && (
                <Button
                    component={Link}
                    href={s.ctaPrimary.href}
                    variant="contained"
                    size="large"
                    sx={{
                    backgroundColor: "#38E07A",
                    "&:hover": { backgroundColor: "#2fbb65" },
                    borderRadius: 2,
                    px: 3,
                    }}
                >
                    {s.ctaPrimary.label}
                </Button>
                )}
                {s.ctaSecondary && (
                <Button
                    component={Link}
                    href={s.ctaSecondary.href}
                    variant="outlined"
                    size="large"
                    sx={{
                    borderColor: "#fff",
                    color: "#fff",
                    borderRadius: 2,
                    px: 3,
                    "&:hover": { backgroundColor: "#fff", color: "#38E07A" },
                    }}
                >
                    {s.ctaSecondary.label}
                </Button>
                )}
            </Stack>
            </Stack>
        </Container>
        </Box>
    </motion.div>
    </AnimatePresence>

    <IconButton
    onClick={() => go(-1)}
    sx={{
        position: "absolute",
        top: "50%",
        left: 20,
        transform: "translateY(-50%)",
        bgcolor: "rgba(255,255,255,0.85)",
        "&:hover": { bgcolor: "#fff" },
    }}
    >
    <ArrowBackIosNewIcon />
    </IconButton>
    <IconButton
    onClick={() => go(1)}
    sx={{
        position: "absolute",
        top: "50%",
        right: 20,
        transform: "translateY(-50%)",
        bgcolor: "rgba(255,255,255,0.85)",
        "&:hover": { bgcolor: "#fff" },
    }}
    >
    <ArrowForwardIosIcon />
    </IconButton>

    <Stack
    direction="row"
    spacing={1}
    sx={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)" }}
    >
    {slides.map((_, i) => (
        <Box
        key={i}
        onClick={() => goTo(i)}
        sx={{
            width: i === index ? 20 : 10,
            height: 10,
            borderRadius: 5,
            bgcolor: i === index ? "#38E07A" : "rgba(255,255,255,0.6)",
            transition: "all .3s ease",
            cursor: "pointer",
        }}
        />
    ))}
    </Stack>
</Box>
);
}