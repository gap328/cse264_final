import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  MenuItem,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Chip
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

function Preferences({ user, onLogout }) {
  const [dietType, setDietType] = useState('');
  const [calorieTarget, setCalorieTarget] = useState('');
  const [allergies, setAllergies] = useState('');
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPreferences();
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const response = await fetch('/api/users/subscription', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (err) {
      console.error('Failed to load subscription:', err);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/users/preferences', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setDietType(data.preferences.diet_type || '');
          setCalorieTarget(data.preferences.calorie_target || '');
          setAllergies(data.preferences.allergies || '');
          setMealsPerDay(data.preferences.meals_per_day || 3);
        }
      }
    } catch (err) {
      console.error('Failed to load preferences:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/users/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          diet_type: dietType,
          calorie_target: parseInt(calorieTarget) || null,
          allergies: allergies,
          meals_per_day: parseInt(mealsPerDay)
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Preferences saved successfully!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setError(data.error || 'Failed to save preferences');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  const dietOptions = [
    { value: '', label: 'None' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'gluten free', label: 'Gluten Free' },
    { value: 'ketogenic', label: 'Ketogenic' },
    { value: 'paleo', label: 'Paleo' },
    { value: 'pescetarian', label: 'Pescetarian' },
    { value: 'lacto-vegetarian', label: 'Lacto-Vegetarian' },
    { value: 'ovo-vegetarian', label: 'Ovo-Vegetarian' },
    { value: 'whole30', label: 'Whole30' },
  ];

  // Get tier limits
  const tierLimits = {
    free: { maxMeals: 2, label: 'Free Tier: Max 2 meals/day' },
    premium: { maxMeals: 3, label: 'Premium Tier: Max 3 meals/day' },
    pro: { maxMeals: 4, label: 'Pro Tier: Max 4 meals/day' }
  };

  const currentTier = subscription?.subscriptionTier || 'free';
  const maxMealsAllowed = tierLimits[currentTier]?.maxMeals || 2;

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Meal Preferences
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {subscription && (
              <Chip 
                label={subscription.subscriptionTier.toUpperCase()} 
                color={subscription.isPaid ? "success" : "default"}
                size="small"
                onClick={() => navigate('/upgrade')}
                sx={{ cursor: 'pointer' }}
              />
            )}
            <Typography variant="body1" sx={{ mr: 2 }}>
              {user.email}
            </Typography>
            <IconButton color="inherit" onClick={onLogout}>
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <Paper elevation={3} sx={{ padding: 4 }}>
            <Typography variant="h5" gutterBottom>
              Set Your Meal Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Tell us about your dietary needs and goals
            </Typography>

            {subscription && (
              <Box sx={{ mb: 3, p: 2, bgcolor: subscription.isPaid ? '#e8f5e9' : '#fff3e0', borderRadius: 1, border: '1px solid', borderColor: subscription.isPaid ? '#4caf50' : '#ff9800' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Current Plan: {subscription.subscriptionTier.toUpperCase()}
                </Typography>
                <Typography variant="caption" display="block">
                  {subscription.subscriptionTier === 'free' && 'Limited to 3 meal plans, 2 meals/day'}
                  {subscription.subscriptionTier === 'premium' && 'Up to 10 meal plans, 3 meals/day'}
                  {subscription.subscriptionTier === 'pro' && 'Unlimited meal plans, 4 meals/day'}
                </Typography>
                {!subscription.isPaid && (
                  <Button 
                    size="small" 
                    variant="outlined" 
                    color="secondary"
                    onClick={() => navigate('/upgrade')}
                    sx={{ mt: 1 }}
                  >
                    View Upgrade Options
                  </Button>
                )}
              </Box>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                select
                fullWidth
                margin="normal"
                label="Diet Type"
                value={dietType}
                onChange={(e) => setDietType(e.target.value)}
              >
                {dietOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                margin="normal"
                label="Daily Calorie Target"
                type="number"
                value={calorieTarget}
                onChange={(e) => setCalorieTarget(e.target.value)}
                helperText="Optional - leave blank if not tracking"
              />

              <TextField
                fullWidth
                margin="normal"
                label="Allergies/Intolerances"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                helperText="Comma-separated (e.g., dairy, gluten, nuts)"
              />

              <TextField
                select
                fullWidth
                margin="normal"
                label="Meals Per Day"
                value={mealsPerDay}
                onChange={(e) => setMealsPerDay(e.target.value)}
                helperText={tierLimits[currentTier]?.label}
              >
                <MenuItem value={2}>2 Meals</MenuItem>
                <MenuItem value={3} disabled={maxMealsAllowed < 3}>
                  3 Meals {maxMealsAllowed < 3 && '(Requires Premium - Click Upgrade)'}
                </MenuItem>
                <MenuItem value={4} disabled={maxMealsAllowed < 4}>
                  4 Meals {maxMealsAllowed < 4 && '(Requires Pro - Click Upgrade)'}
                </MenuItem>
              </TextField>

              {subscription && subscription.subscriptionTier === 'free' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <strong>Free Tier Limitations:</strong>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                    <li>Maximum 3 meal plans total</li>
                    <li>Up to 2 meals per day only</li>
                    <li>Basic diet filters</li>
                  </ul>
                  Want more? 
                  <Button 
                    size="small" 
                    variant="contained"
                    color="secondary"
                    onClick={() => navigate('/upgrade')}
                    sx={{ ml: 1 }}
                  >
                    Upgrade to Premium
                  </Button>
                </Alert>
              )}

              {mealsPerDay > maxMealsAllowed && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Your current selection exceeds your {currentTier} tier limit. 
                  <Button 
                    size="small" 
                    onClick={() => navigate('/upgrade')}
                    sx={{ ml: 1 }}
                  >
                    Upgrade Now
                  </Button>
                </Alert>
              )}

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={mealsPerDay > maxMealsAllowed}
                >
                  Save Preferences
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/dashboard')}
                >
                  Skip for Now
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </>
  );
}

export default Preferences;