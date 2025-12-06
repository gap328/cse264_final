import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CreditCardIcon from '@mui/icons-material/CreditCard';

function Upgrade() {
  const navigate = useNavigate();
  const [currentTier, setCurrentTier] = useState('free');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openPayment, setOpenPayment] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const response = await fetch('/api/users/subscription', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentTier(data.subscriptionTier || 'free');
      }
    } catch (err) {
      console.error('Failed to load subscription:', err);
      setCurrentTier('free');
    }
  };

  const handleOpenPayment = (tier) => {
    setSelectedTier(tier);
    setOpenPayment(true);
  };

  const handleClosePayment = () => {
    setOpenPayment(false);
    setSelectedTier(null);
  };

  const handleConfirmUpgrade = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/users/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tier: selectedTier.tier })
      });

      const data = await response.json();

      if (response.ok) {
        setOpenPayment(false);
        alert(`Successfully ${selectedTier.tier === 'free' ? 'downgraded to' : 'upgraded to'} ${selectedTier.name}!`);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Operation failed');
      }
    } catch (err) {
      console.error('Upgrade/downgrade failed:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // what each tier includes
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        '3 meal plans total',
        'Up to 2 meals per day',
        'Basic diet filters',
        'Shopping list view'
      ],
      tier: 'free',
      color: '#757575'
    },
    {
      name: 'Premium',
      price: '$9.99',
      period: 'month',
      popular: true,
      features: [
        '10 meal plans',
        'Up to 3 meals per day',
        'All diet filters',
        'Export shopping lists',
        'Priority support'
      ],
      tier: 'premium',
      color: '#2e7d32'
    },
    {
      name: 'Pro',
      price: '$19.99',
      period: 'month',
      features: [
        'Unlimited meal plans',
        'Up to 4 meals per day',
        'All premium features',
        'Share meal plans',
        'Custom recipes',
        'API access'
      ],
      tier: 'pro',
      color: '#ff6f00'
    }
  ];

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: '#2e7d32' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/dashboard')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Choose Your Plan
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Box sx={{ mt: 6, mb: 6, textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
            Upgrade Your Meal Planning
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Get more meal plans and unlock premium features
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4} sx={{ mb: 6 }}>
          {tiers.map((tier) => {
            const isCurrent = tier.tier === currentTier;
            // can upgrade if its a paid tier and not current
            // can downgrade to free if currently on paid tier
            const canChange = tier.tier === 'free' 
              ? (currentTier === 'premium' || currentTier === 'pro')
              : !isCurrent && tier.tier !== 'free';

            return (
              <Grid item xs={12} md={4} key={tier.name}>
                <Card 
                  elevation={tier.popular ? 12 : 3}
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    border: tier.popular ? '3px solid #2e7d32' : isCurrent ? '2px solid #1976d2' : 'none',
                    transform: tier.popular ? 'scale(1.05)' : 'scale(1)',
                    transition: 'transform 0.2s'
                  }}
                >
                  {tier.popular && (
                    <Chip 
                      label="Most Popular" 
                      color="primary" 
                      sx={{ 
                        position: 'absolute', 
                        top: 16, 
                        right: 16,
                        fontWeight: 'bold'
                      }}
                    />
                  )}
                  {isCurrent && (
                    <Chip 
                      label="Current Plan" 
                      color="info" 
                      sx={{ 
                        position: 'absolute', 
                        top: 16, 
                        left: 16,
                        fontWeight: 'bold'
                      }}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1, pt: tier.popular || isCurrent ? 6 : 3 }}>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: tier.color }}>
                      {tier.name}
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h2" component="span" sx={{ fontWeight: 'bold' }}>
                        {tier.price}
                      </Typography>
                      <Typography variant="h6" component="span" color="text.secondary">
                        /{tier.period}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <List>
                      {tier.features.map((feature) => (
                        <ListItem key={feature} dense disableGutters>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <CheckCircleIcon sx={{ color: tier.color }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={feature}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                  <Box sx={{ p: 2 }}>
                    {isCurrent ? (
                      <Button
                        fullWidth
                        variant="outlined"
                        size="large"
                        disabled
                      >
                        Current Plan
                      </Button>
                    ) : canChange ? (
                      <Button
                        fullWidth
                        variant={tier.popular ? "contained" : tier.tier === 'free' ? "outlined" : "outlined"}
                        color={tier.tier === 'free' ? "warning" : "primary"}
                        size="large"
                        onClick={() => handleOpenPayment(tier)}
                        sx={{
                          bgcolor: tier.popular ? tier.color : 'transparent',
                          '&:hover': {
                            bgcolor: tier.popular ? '#1b5e20' : 'transparent',
                          }
                        }}
                      >
                        {tier.tier === 'free' ? 'Downgrade to Free' : `Upgrade to ${tier.name}`}
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant="outlined"
                        size="large"
                        disabled
                      >
                        Not Available
                      </Button>
                    )}
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Box sx={{ textAlign: 'center', mb: 6, p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
          <Typography variant="body1" gutterBottom sx={{ fontWeight: 'bold' }}>
            All plans include:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            30-day money-back guarantee • Cancel anytime • No hidden fees • Secure payment
          </Typography>
        </Box>
      </Container>

      {/* Payment Confirmation Dialog */}
      <Dialog open={openPayment} onClose={handleClosePayment} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CreditCardIcon color="primary" />
            <Typography variant="h6">
              {selectedTier?.tier === 'free' ? 'Confirm Downgrade' : 'Confirm Upgrade'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedTier && (
            <Box>
              {selectedTier.tier === 'free' ? (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  You're about to downgrade to Free. You'll lose access to premium features.
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mb: 3 }}>
                  This is a demo - no actual payment will be processed
                </Alert>
              )}
              
              <Typography variant="body1" gutterBottom>
                You're {selectedTier.tier === 'free' ? 'downgrading to' : 'upgrading to'} <strong>{selectedTier.name}</strong>
              </Typography>
              <Typography variant="h4" gutterBottom sx={{ my: 2 }}>
                {selectedTier.price}<Typography variant="body2" component="span">/{selectedTier.period}</Typography>
              </Typography>

              <Divider sx={{ my: 2 }} />

              {selectedTier.tier !== 'free' && (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Demo Payment Information (not processed)
                  </Typography>
                  <TextField
                    fullWidth
                    label="Card Number"
                    defaultValue="4242 4242 4242 4242"
                    margin="normal"
                    disabled
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Expiry"
                        defaultValue="12/25"
                        margin="normal"
                        disabled
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="CVC"
                        defaultValue="123"
                        margin="normal"
                        disabled
                      />
                    </Grid>
                  </Grid>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClosePayment} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmUpgrade} 
            variant="contained" 
            color={selectedTier?.tier === 'free' ? 'warning' : 'primary'}
            disabled={loading}
            startIcon={loading ? null : <CreditCardIcon />}
          >
            {loading ? 'Processing...' : selectedTier?.tier === 'free' ? 'Confirm Downgrade' : 'Confirm Upgrade'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Upgrade;