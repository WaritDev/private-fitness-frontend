// ...existing code...
import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Divider, IconButton, Tooltip } from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Link from 'next/link';

type Event = {
  id: number;
  title: string;
  time: string;
  trainer: { username: string; name: string };
};

export default function EventList({
  date,
  events,
  onBook,
}: {
  date: string;
  events: Event[];
  onBook: (id: number) => void;
}) {
  const formattedDate = new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  return (
    <Box sx={{ p: 2, borderRadius: 2, boxShadow: 2, bgcolor: 'white', minHeight: 200 }}>
      <Typography variant="h6" fontWeight={600} mb={2}>
        {formattedDate}
      </Typography>
      {events.length === 0 ? (
        <Typography color="text.secondary" component="p">
          No sessions scheduled.
        </Typography>
      ) : (
        <List>
          {events.map((e, idx) => (
            <React.Fragment key={e.id}>
              <ListItem
                secondaryAction={
                  <Tooltip title="จองคิวนี้">
                    <IconButton edge="end" color="primary" onClick={() => onBook(e.id)}>
                      <EventAvailableIcon />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemText
                  primaryTypographyProps={{ component: 'span' }}
                  secondaryTypographyProps={{ component: 'div' }}
                  primary={e.time}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" component="span">
                        {e.title}
                      </Typography>
                      <Tooltip title="ดูโปรไฟล์เทรนเนอร์">
                        <Link href={`/trainer/${encodeURIComponent(e.trainer.username)}`} aria-label="trainer profile">
                          <InfoOutlinedIcon fontSize="small" />
                        </Link>
                      </Tooltip>
                    </Box>
                  }
                />
              </ListItem>
              {idx < events.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
}
// ...existing code...