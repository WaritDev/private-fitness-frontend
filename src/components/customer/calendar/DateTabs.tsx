'use client';

import * as React from 'react';
import { Tabs, Tab, Box } from '@mui/material';

function fmt(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit' }); // Mon 18
}

type Props = {
  days: Date[];
  selected: Date;
  onChange: (d: Date) => void;
};

export default function DateTabs({ days, selected, onChange }: Props) {
  const value = days.findIndex((d) => d.toDateString() === selected.toDateString());

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs
        value={value === -1 ? 0 : value}
        onChange={(_, idx) => days[idx] && onChange(days[idx])}
        variant="scrollable"
        scrollButtons
        allowScrollButtonsMobile
        aria-label="week days"
        sx={{
          '& .MuiTab-root': { minWidth: 88 },
          '& .MuiTabs-indicator': { backgroundColor: '#00C853' },
        }}
      >
        {days.map((d) => (
          <Tab
            key={d.toISOString()}
            label={fmt(d)}
            sx={{
              textTransform: 'none',
              '&.Mui-selected': { color: '#00C853', fontWeight: 700 },
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
}