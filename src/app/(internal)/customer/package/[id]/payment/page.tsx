'use client';

import * as React from 'react';
import { Container, Stack, Typography, Paper, Button, Box, Alert, CircularProgress, Divider, IconButton, Snackbar } from '@mui/material';
import Grid from '@mui/material/Grid';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useAlertPopUp } from '@/components/pop-up/AlertPopUpUI';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

function money(n: number) {
  return n.toLocaleString('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 });
}

// Type definition for flow detection from sessionStorage
type FlowSource = {
  source: string;
  timestamp: string;
  discountAmount?: number;
  trainerUsername?: string; // For Session package
};

// Type definition for payment info API response
type PaymentInfoResponse = {
  productId: number;
  productName: string;
  productType: string;
  productCategory: string;
  listPrice: number;
  discountAmount: number;
  payableAmount: number;
  sessionAmount: number | null;
  durationDays: number | null;
  accountName: string;
  accountNumber: string;
  bankCode: string;
  qrCodeUrl: string;
  accountActive: boolean;
};

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { setAlert } = useAlertPopUp();

  // State management
  const [flowSource, setFlowSource] = React.useState<FlowSource | null>(null);
  const [paymentInfo, setPaymentInfo] = React.useState<PaymentInfoResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // Slip upload states
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  
  // Copy notification
  const [copySuccess, setCopySuccess] = React.useState(false);
  const [copiedText, setCopiedText] = React.useState('');
  
  // Detect if this is Sales Flow or Customer Flow
  const isSalesFlow = flowSource?.source === 'sales-registration';

  // Load data on mount
  React.useEffect(() => {
    console.log('🚀 Payment page mounted with params:', params);
    
    // Extract product ID from URL
    const productId = Number(params.id);
    if (isNaN(productId) || productId <= 0) {
      setError('Invalid Product ID');
      setLoading(false);
      return;
    }

    // Load flow source from sessionStorage (for flow detection only)
    // ใช้ key เดียวสำหรับทั้ง Duration และ Session
    const stored = sessionStorage.getItem('pendingOrder');
    
    console.log('📦 SessionStorage data:', stored ? 'Found' : 'Not found');
    
    let discount = 0;
    if (stored) {
      try {
        const data = JSON.parse(stored) as FlowSource;
        console.log('✅ Flow source parsed:', {
          source: data.source || 'undefined',
          discountAmount: data.discountAmount
        });
        
        const isSales = data.source === 'sales-registration';
        console.log(`🎯 Flow detected: ${isSales ? '🔵 SALES FLOW' : '🟢 CUSTOMER FLOW'}`);
        
        setFlowSource(data);
        discount = data.discountAmount || 0;
      } catch (err) {
        console.error('❌ Parse error:', err);
      }
    } else {
      console.log('🟢 No sessionStorage - treating as CUSTOMER FLOW with no discount');
      setFlowSource({ source: 'customer-purchase', timestamp: new Date().toISOString() });
    }
    
    // Fetch payment info from API
    fetchPaymentInfo(productId, discount);
  }, [params]);

  // Fetch payment info from API
  async function fetchPaymentInfo(productId: number, discount: number) {
    try {
      const url = `${API_BASE_URL}/api/payments/info/${productId}?discount=${discount}`;
      console.log('🔍 Fetching payment info:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment information');
      }

      const data = await response.json();
      console.log('📦 Payment API Response:', data);
      
      if (data.status === 'OK' && data.result) {
        setPaymentInfo(data.result);
      } else {
        throw new Error(data.message || 'An error occurred while fetching data');
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  // Handle file selection
  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      setUploadError('Please select an image file (.jpg or .png only)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  // Copy to clipboard helper
  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setCopySuccess(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  // Sales Flow: Confirm Payment
  function handleConfirmPayment() {
    sessionStorage.setItem('paymentVerified', 'true');
    // Sales Flow: Payment → Create Account
    router.push('/customer/create-account');
  }

  // Customer Flow: Upload slip and verify
  async function handleUploadSlip() {
    if (!selectedFile || !paymentInfo) return;

    setUploading(true);
    setUploadError(null);

    try {
      // Step 1: Verify slip
      const formData = new FormData();
      formData.append('file', selectedFile);

      const payload = {
        amount: paymentInfo.payableAmount,
        accountName: paymentInfo.accountName,
        accountNumber: paymentInfo.accountNumber,
        accountType: paymentInfo.bankCode,
      };

      formData.append('payload', JSON.stringify(payload));

      const response = await fetch(`${API_BASE_URL}/api/payments/verify-slip`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('📦 Slip Upload Response:', result);

      if (result.status === 'success' && result.data?.verified) {
        console.log('✅ Payment verified - proceeding to create package...');
        
        // Step 2: Create Duration or Session package
        let packageCreated = false;
        
        if (paymentInfo.productType === 'DURATION') {
          packageCreated = await createDurationPackage(paymentInfo.productId);
        } else if (paymentInfo.productType === 'SESSION') {
          // Get trainerUsername from sessionStorage
          const trainerUsername = flowSource?.trainerUsername;
          if (!trainerUsername) {
            throw new Error('Trainer information not found. Please select a Trainer again');
          }
          packageCreated = await createSessionPackage(paymentInfo.productId, trainerUsername);
        }

        if (packageCreated) {
          // Success notification
          setAlert({
            open: true,
            msg: '✅ Payment verification successful. Your membership has been activated',
            severity: 'success',
          });
          sessionStorage.setItem('paymentVerified', 'true');
          
          // Clear pending order from sessionStorage
          sessionStorage.removeItem('pendingOrder');
          
          // Redirect after short delay to show notification
          setTimeout(() => {
            router.push('/customer/member');
          }, 1500);
        } else {
          throw new Error('Unable to create package. Please contact staff');
        }
      } else {
        // Failed notification
        setAlert({
          open: true,
          msg: '❌ Verification failed. Please upload a valid payment slip',
          severity: 'error',
        });
        throw new Error('Slip verification failed. Please check the information and try again');
      }
    } catch (err) {
      console.error('❌ Upload error:', err);
      setUploadError(err instanceof Error ? err.message : 'An error occurred while uploading slip');
    } finally {
      setUploading(false);
    }
  }

  // Create Duration Package via API
  async function createDurationPackage(productId: number): Promise<boolean> {
    try {
      console.log('🔵 Creating Duration Package:', { productId });
      
      const response = await fetch(`${API_BASE_URL}/api/customer-durations/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send JWT token
        body: JSON.stringify({ productId }),
      });

      const data = await response.json();
      console.log('📦 Duration API Response:', data);

      if (data.status === 'success' && data.result) {
        console.log('✅ Duration package created successfully:', data.result);
        return true;
      } else {
        console.log('❌ Duration API failed:', data);
        console.error('❌ Duration API failed:', data.message);
        throw new Error(data.message || 'Unable to create Duration package');
      }
    } catch (err) {
      console.error('❌ Create Duration error:', err);
      throw err;
    }
  }

  // Create Session Package via API
  async function createSessionPackage(productId: number, trainerUsername: string): Promise<boolean> {
    try {
      console.log('🟢 Creating Session Package:', { productId, trainerUsername });
      
      const response = await fetch(`${API_BASE_URL}/api/customer-sessions/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send JWT token
        body: JSON.stringify({ productId, trainerUsername }),
      });

      const data = await response.json();
      console.log('📦 Session API Response:', data);

      if (data.status === 'success' && data.result) {
        console.log('✅ Session package created successfully:', data.result);
        return true;
      } else {
        console.error('❌ Session API failed:', data.message);
        throw new Error(data.message || 'Unable to create Session package');
      }
    } catch (err) {
      console.error('❌ Create Session error:', err);
      throw err;
    }
  }

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ px: 0 }}>
        <Stack spacing={2} sx={{ px: 2, py: 4 }} alignItems="center">
          <CircularProgress />
          <Typography>Loading payment information...</Typography>
        </Stack>
      </Container>
    );
  }

  // Error state
  if (error || !paymentInfo) {
    return (
      <Container maxWidth="sm" sx={{ px: 0 }}>
        <Stack spacing={2} sx={{ px: 2, py: 4 }}>
          <Alert severity="error">{error || 'No data found'}</Alert>
          <Button variant="outlined" onClick={() => router.back()}>
            Go Back
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ px: 0 }}>
      <Stack spacing={2} sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" fontWeight={800}>
          Payment
        </Typography>

        {/* Package Summary */}
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Stack spacing={1}>
            <Typography variant="subtitle1" fontWeight={700} color="primary">
              {paymentInfo.productName}
            </Typography>

            <Grid container spacing={1} sx={{ fontSize: '0.875rem' }}>
              <Grid size={{ xs: 5 }}>
                <Typography variant="caption" color="text.secondary">Type:</Typography>
              </Grid>
              <Grid size={{ xs: 7 }}>
                <Typography variant="caption" fontWeight={600}>{paymentInfo.productCategory}</Typography>
              </Grid>

              {paymentInfo.durationDays && (
                <>
                  <Grid size={{ xs: 5 }}>
                    <Typography variant="caption" color="text.secondary">Duration:</Typography>
                  </Grid>
                  <Grid size={{ xs: 7 }}>
                    <Typography variant="caption" fontWeight={600}>{paymentInfo.durationDays} Days</Typography>
                  </Grid>
                </>
              )}

              {paymentInfo.sessionAmount && (
                <>
                  <Grid size={{ xs: 5 }}>
                    <Typography variant="caption" color="text.secondary">Number of Sessions:</Typography>
                  </Grid>
                  <Grid size={{ xs: 7 }}>
                    <Typography variant="caption" fontWeight={600}>{paymentInfo.sessionAmount} Sessions</Typography>
                  </Grid>
                </>
              )}

              <Grid size={{ xs: 5 }}>
                <Typography variant="caption" color="text.secondary">Regular Price:</Typography>
              </Grid>
              <Grid size={{ xs: 7 }}>
                <Typography variant="caption">{money(paymentInfo.listPrice)}</Typography>
              </Grid>

              {paymentInfo.discountAmount > 0 && (
                <>
                  <Grid size={{ xs: 5 }}>
                    <Typography variant="caption" color="text.secondary">Discount:</Typography>
                  </Grid>
                  <Grid size={{ xs: 7 }}>
                    <Typography variant="caption" color="error">-{money(paymentInfo.discountAmount)}</Typography>
                  </Grid>
                </>
              )}
            </Grid>

            <Divider sx={{ my: 0.5 }} />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" fontWeight={700}>Amount to Pay:</Typography>
              <Typography variant="h6" fontWeight={800} color="primary">
                {money(paymentInfo.payableAmount)}
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        {/* QR Code Section */}
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
          <Stack spacing={2} alignItems="center">
            <Typography variant="subtitle1" fontWeight={700}>
              Scan QR Code
            </Typography>

            <Box
              sx={{
                width: 200,
                height: 200,
                bgcolor: '#fff',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {paymentInfo.qrCodeUrl ? (
                <Image
                  src={paymentInfo.qrCodeUrl}
                  alt="QR Code for Payment"
                  width={200}
                  height={200}
                  style={{ objectFit: 'contain' }}
                  priority
                />
              ) : (
                <Typography variant="caption" color="text.secondary">ไม่มี QR Code</Typography>
              )}
            </Box>

            {/* Bank Account Info */}
            <Paper sx={{ p: 1.5, width: '100%', bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
              <Stack spacing={1}>
                <Typography variant="caption" fontWeight={700} color="primary" textAlign="center">
                  Account Information
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                  <Stack spacing={0} sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Bank
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                      {paymentInfo.bankCode}
                    </Typography>
                  </Stack>
                  <IconButton 
                    size="small" 
                    onClick={() => copyToClipboard(paymentInfo.bankCode, 'Bank')}
                    sx={{ color: 'primary.main', p: 0.5 }}
                  >
                    <ContentCopyIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>

                <Divider sx={{ my: 0.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                  <Stack spacing={0} sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Account Name
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                      {paymentInfo.accountName}
                    </Typography>
                  </Stack>
                  <IconButton 
                    size="small" 
                    onClick={() => copyToClipboard(paymentInfo.accountName, 'Account Name')}
                    sx={{ color: 'primary.main', p: 0.5 }}
                  >
                    <ContentCopyIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>

                <Divider sx={{ my: 0.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                  <Stack spacing={0} sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Account Number
                    </Typography>
                    <Typography 
                      variant="body1" 
                      fontWeight={700} 
                      sx={{ fontFamily: 'monospace', letterSpacing: 0.5, fontSize: '0.9rem' }}
                    >
                      {paymentInfo.accountNumber}
                    </Typography>
                  </Stack>
                  <IconButton 
                    size="small" 
                    onClick={() => copyToClipboard(paymentInfo.accountNumber, 'Account Number')}
                    sx={{ color: 'primary.main', p: 0.5 }}
                  >
                    <ContentCopyIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Paper>

        {/* Action Section */}
        {isSalesFlow ? (
          <Paper elevation={1} sx={{ p: 2, borderRadius: 2, bgcolor: '#E7F2FF', border: '1px solid #2196F3' }}>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                  Confirm Payment
                </Typography>
              </Box>

              <Typography variant="caption" color="text.secondary">
                Staff: Verify customer payment transfer and click confirm
              </Typography>

              <Button
                variant="contained"
                onClick={handleConfirmPayment}
                fullWidth
                sx={{
                  py: 1.5,
                  bgcolor: '#00C853',
                  color: '#000',
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#00B84D' },
                }}
              >
                ✅ Confirm Payment
              </Button>
            </Stack>
          </Paper>
        ) : (
          <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={700}>
                Upload Slip
              </Typography>

              {uploadError && (
                <Alert severity="error" onClose={() => setUploadError(null)} sx={{ py: 0.5 }}>
                  <Typography variant="caption">{uploadError}</Typography>
                </Alert>
              )}

              <Box>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="slip-file-input"
                  disabled={uploading}
                />
                <label htmlFor="slip-file-input">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    disabled={uploading}
                    sx={{ py: 1 }}
                    size="small"
                  >
                    {selectedFile ? 'Change File' : 'Select Slip File'}
                  </Button>
                </label>
                {selectedFile && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                    {selectedFile.name}
                  </Typography>
                )}
              </Box>

              {previewUrl && (
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 250,
                    mx: 'auto',
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Image
                    src={previewUrl}
                    alt="Slip Preview"
                    width={250}
                    height={250}
                    style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                  />
                </Box>
              )}

              <Button
                variant="contained"
                onClick={handleUploadSlip}
                disabled={!selectedFile || uploading}
                fullWidth
                sx={{
                  py: 1.5,
                  bgcolor: '#00C853',
                  color: '#000',
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#00B84D' },
                  '&:disabled': { bgcolor: 'grey.300', color: 'grey.500' },
                }}
              >
                {uploading ? (
                  <>
                    <CircularProgress size={16} sx={{ mr: 1, color: 'grey.600' }} />
                    <Typography variant="body2">Verifying...</Typography>
                  </>
                ) : (
                  '📤 Upload Slip'
                )}
              </Button>

              <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ fontSize: '0.7rem' }}>
                .jpg, .png ไม่เกิน 5MB
              </Typography>
            </Stack>
          </Paper>
        )}

        <Button variant="outlined" onClick={() => router.back()} size="small">
          Go Back
        </Button>

        {/* Copy Success Snackbar */}
        <Snackbar
          open={copySuccess}
          autoHideDuration={2000}
          onClose={() => setCopySuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" sx={{ width: '100%' }}>
            Copied {copiedText} ✓
          </Alert>
        </Snackbar>
      </Stack>
    </Container>
  );
}