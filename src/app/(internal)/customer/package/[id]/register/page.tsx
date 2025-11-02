'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Paper, Stepper, Step, StepLabel, Button, TextField,
  Typography, MenuItem, Alert, Grid, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, FormControl, InputLabel, CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '@/contexts/AuthProvider';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Regex Validation
const PHONE_RE = /^[0-9]{10}$/;
const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

// Helper: Format money (Thai Baht)
function money(n: number) {
  try {
    return n.toLocaleString('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 });
  } catch {
    return `${n} THB`;
  }
}

// ==================== TYPE DEFINITIONS ====================

// Schedule item for Step 2
type ScheduleItem = {
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY' | '';
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format (auto-calculated: startTime + 2 hours)
};

// Step 1: Select Date & Time
type Step1 = {
  schedules: ScheduleItem[];
  matchedTrainerUsername: string;
  matchedTrainerName: string;
};

// ==================== MAIN COMPONENT ====================

export default function SessionRegisterPage() {
  const params = useParams<{ id: string }>();
  const productId = Number(params?.id ?? NaN);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Stepper state (2 Steps for Customer Flow: no discount, no customer info)
  const [activeStep, setActiveStep] = React.useState(0);
  const [matching, setMatching] = React.useState(false);

  // Product info
  const [productName, setProductName] = React.useState<string>('');
  const [basePrice, setBasePrice] = React.useState<number>(0);
  const [sessionAmount, setSessionAmount] = React.useState<number | null>(null);

  // Step 1 state
  const [s1, setS1] = React.useState<Step1>({
    schedules: [],
    matchedTrainerUsername: '',
    matchedTrainerName: '',
  });

  // Current schedule being added
  const [currentSchedule, setCurrentSchedule] = React.useState<ScheduleItem>({
    dayOfWeek: '',
    startTime: '',
    endTime: '',
  });

  // Error states
  const [errors, setErrors] = React.useState<{ schedule?: string; match?: string }>({});

  // Snackbar
  const [snack, setSnack] = React.useState<{ open: boolean; message: string; color: 'success' | 'error' }>({
    open: false,
    message: '',
    color: 'success',
  });

  // ==================== LOAD PRODUCT DATA ====================
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch product');
        const data = await res.json();
        if (cancelled) return;

        if (res.statusText === 'OK' && data) {
          setProductName(data.name || '');
          const price = data.listPrice || 0;
          setBasePrice(price);
          setSessionAmount(data.sessionAmount || null);
        }
      } catch (err) {
        console.error('Error loading product:', err);
        if (!cancelled) {
          setSnack({ open: true, message: 'Failed to load product data', color: 'error' });
        }
      }
    }
    if (Number.isFinite(productId)) load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  // ==================== STEP 1: TRAINER MATCHING ====================

  // Auto-calculate end time (start time + 2 hours)
  function calculateEndTime(startTime: string): string {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = (hours + 2) % 24;
    return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  // Add schedule to list
  function handleAddSchedule() {
    setErrors({});
    
    // Validate current schedule
    if (!currentSchedule.dayOfWeek) {
      setErrors({ schedule: 'Please select day of week' });
      return;
    }
    if (!currentSchedule.startTime) {
      setErrors({ schedule: 'Please select start time' });
      return;
    }

    // Check duplicate
    const isDuplicate = s1.schedules.some(
      (s) => s.dayOfWeek === currentSchedule.dayOfWeek && s.startTime === currentSchedule.startTime
    );

    if (isDuplicate) {
      setErrors({ schedule: 'This schedule already exists' });
      return;
    }

    // Add to list
    const newSchedule: ScheduleItem = {
      ...currentSchedule,
      endTime: calculateEndTime(currentSchedule.startTime),
    };

    setS1((prev) => ({
      ...prev,
      schedules: [...prev.schedules, newSchedule],
    }));

    // Reset form
    setCurrentSchedule({
      dayOfWeek: '',
      startTime: '',
      endTime: '',
    });
  }

  // Remove schedule from list
  function handleRemoveSchedule(index: number) {
    setS1((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index),
    }));
  }

  // Match Trainer
  async function handleMatchTrainer() {
    setErrors({});
    
    // Validate schedules
    if (s1.schedules.length === 0) {
      setErrors({ match: 'Please add at least 1 schedule' });
      return;
    }

    setMatching(true);

    try {
      // Call Backend API for Match Trainer
      const firstSchedule = s1.schedules[0];
      
      // Convert time format from "HH:mm" to ISO 8601
      const today = new Date();
      const startDateTime = new Date(today);
      const [startHour, startMin] = firstSchedule.startTime.split(':').map(Number);
      startDateTime.setHours(startHour, startMin, 0, 0);
      
      const endDateTime = new Date(today);
      const [endHour, endMin] = firstSchedule.endTime.split(':').map(Number);
      endDateTime.setHours(endHour, endMin, 0, 0);

      const response = await fetch(`${API_BASE_URL}/api/trainers/match`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dayOfWeek: firstSchedule.dayOfWeek,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }),
      });

      const data = await response.json();
      console.log('🔍 Match trainer response:', data);

      if (data.status === 'OK' && data.result) {
        const trainer = data.result;
        setS1((prev) => ({
          ...prev,
          matchedTrainerUsername: trainer.trainerUsername,
          matchedTrainerName: trainer.trainerName,
        }));

        setSnack({
          open: true,
          message: `✅ Trainer matched successfully! ${trainer.trainerName}`,
          color: 'success',
        });
      } else if (data.status_code === 404) {
        throw new Error('No available trainer found for the selected day and time');
      } else {
        throw new Error(data.message || 'No trainer found');
      }
    } catch (err) {
      console.error('❌ Error matching trainer:', err);
      const errorMsg = err instanceof Error ? err.message : 'No trainer available';
      setErrors({ match: errorMsg });
      setSnack({
        open: true,
        message: `❌ ${errorMsg}`,
        color: 'error',
      });
    } finally {
      setMatching(false);
    }
  }

  function validateStep1(): boolean {
    setErrors({});
    
    if (s1.schedules.length === 0) {
      setErrors({ match: 'Please add at least 1 schedule' });
      return false;
    }

    if (!s1.matchedTrainerUsername) {
      setErrors({ match: 'Please click "Match Trainer" button to match a trainer' });
      return false;
    }

    return true;
  }

  // ==================== NAVIGATION ====================

  function onNext() {
    if (!validateStep1()) return;
    redirectToPayment();
  }

  // ==================== REDIRECT TO PAYMENT ====================

  function redirectToPayment() {
    // Store data in sessionStorage for Customer Flow
    const orderData = {
      // Product info
      productId: productId,
      productName: productName,
      productType: 'SESSION',
      sessionAmount: sessionAmount || 0,
      basePrice: basePrice,
      discountAmount: 0, // Customer purchase has no discount
      discountPercent: 0,
      pricePaid: basePrice,
      
      // Session-specific info
      schedules: s1.schedules,
      trainerUsername: s1.matchedTrainerUsername,
      trainerName: s1.matchedTrainerName,
      
      // Meta info
      source: 'customer-purchase', // Customer Flow
      timestamp: new Date().toISOString(),
    };

    // Store in sessionStorage
    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));

    // Redirect to payment page
    router.push(`/customer/package/${productId}/payment`);
  }

  // ==================== RENDER ====================
  const steps = ['Select Day/Time & Match Trainer'];

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        Purchase Session Package: {productName}
      </Typography>

      <Paper sx={{ p: { xs: 2, md: 3 } }} elevation={2}>
        {/* Stepper - 1 Step for Customer Flow */}
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Snackbar */}
        {snack.open && (
          <Alert severity={snack.color} onClose={() => setSnack({ ...snack, open: false })} sx={{ mb: 2 }}>
            {snack.message}
          </Alert>
        )}

        {/* Product Info Display */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="body1" fontWeight={600}>
            Price: {money(basePrice)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sessions: {sessionAmount || 0}
          </Typography>
        </Box>

        {/* STEP 1: TRAINER MATCHING */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Select Convenient Day/Time and Match Trainer
          </Typography>

          {/* Add Schedule Form */}
          <Paper sx={{ p: 2, mt: 2, bgcolor: '#f9f9f9' }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Add Schedule (1 Session = 2 hours)
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Day of Week</InputLabel>
                  <Select
                    value={currentSchedule.dayOfWeek}
                    label="Day of Week"
                    onChange={(e) =>
                      setCurrentSchedule({
                        ...currentSchedule,
                        dayOfWeek: e.target.value as any,
                      })
                    }
                  >
                    <MenuItem value="MONDAY">Monday</MenuItem>
                    <MenuItem value="TUESDAY">Tuesday</MenuItem>
                    <MenuItem value="WEDNESDAY">Wednesday</MenuItem>
                    <MenuItem value="THURSDAY">Thursday</MenuItem>
                    <MenuItem value="FRIDAY">Friday</MenuItem>
                    <MenuItem value="SATURDAY">Saturday</MenuItem>
                    <MenuItem value="SUNDAY">Sunday</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="time"
                  label="Start Time"
                  value={currentSchedule.startTime}
                  onChange={(e) =>
                    setCurrentSchedule({
                      ...currentSchedule,
                      startTime: e.target.value,
                      endTime: calculateEndTime(e.target.value),
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="End Time (Auto)"
                  value={currentSchedule.endTime}
                  disabled
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddSchedule}
                  fullWidth
                >
                  Add Schedule
                </Button>
              </Grid>
            </Grid>
            {errors.schedule && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errors.schedule}
              </Alert>
            )}
          </Paper>

          {/* Schedule List */}
          {s1.schedules.length > 0 && (
            <TableContainer component={Paper} sx={{ mt: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Day</TableCell>
                    <TableCell>Start Time</TableCell>
                    <TableCell>End Time</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {s1.schedules.map((schedule, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        {schedule.dayOfWeek === 'MONDAY' && 'Monday'}
                        {schedule.dayOfWeek === 'TUESDAY' && 'Tuesday'}
                        {schedule.dayOfWeek === 'WEDNESDAY' && 'Wednesday'}
                        {schedule.dayOfWeek === 'THURSDAY' && 'Thursday'}
                        {schedule.dayOfWeek === 'FRIDAY' && 'Friday'}
                        {schedule.dayOfWeek === 'SATURDAY' && 'Saturday'}
                        {schedule.dayOfWeek === 'SUNDAY' && 'Sunday'}
                      </TableCell>
                      <TableCell>{schedule.startTime}</TableCell>
                      <TableCell>{schedule.endTime}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleRemoveSchedule(idx)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Match Trainer Button */}
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleMatchTrainer}
              disabled={matching || s1.schedules.length === 0}
              fullWidth
              size="large"
            >
              {matching ? <CircularProgress size={24} /> : 'Match Trainer'}
            </Button>
          </Box>

          {/* Matched Trainer Display */}
          {s1.matchedTrainerUsername && (
            <Paper sx={{ p: 2, mt: 3, bgcolor: '#e8f5e9' }}>
              <Typography variant="h6" color="success.main">
                ✅ Match Successful!
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Trainer:</strong> {s1.matchedTrainerName} ({s1.matchedTrainerUsername})
              </Typography>
            </Paper>
          )}

          {/* Error Message */}
          {errors.match && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errors.match}
            </Alert>
          )}
        </Box>

        {/* Navigation */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => router.back()}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={onNext} 
            disabled={matching}
            sx={{ ml: 2 }}
          >
            Go to Payment
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

