import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Button,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  Chip
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StarIcon from '@mui/icons-material/Star';

import MealPlanCard from '../components/MealPlanCard';
import ShoppingList from '../components/ShoppingList';

function Dashboard({ user, onLogout }) {
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadMealPlan();
    loadSubscription();
  }, [user.user_id]);

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

  const loadMealPlan = async () => {
    try {
      const response = await fetch(`/api/mealplan/${user.user_id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setMealPlan(data.mealPlan);
      }
    } catch (err) {
      console.error('Failed to load meal plan:', err);
    }
  };

  const generateMealPlan = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
  
    try {
      const response = await fetch('/api/mealplan/generate', {
        method: 'POST',
        credentials: 'include'
      });
  
      const data = await response.json();
  
      if (response.ok) {
        await loadMealPlan();
        setSuccess('Meal plan generated successfully!');
      } else {
        if (data.upgradeRequired) {
          setError(
            <Box>
              {data.error}{' '}
              <Button 
                variant="outlined" 
                size="small" 
                color="secondary"
                onClick={() => navigate('/upgrade')}
                sx={{ ml: 1 }}
              >
                Upgrade Now
              </Button>
            </Box>
          );
        } else {
          setError(data.error || 'Failed to generate meal plan');
        }
      }
    } catch (err) {
      console.error('Generate meal plan error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const replaceMeal = async (itemId) => {
    try {
      const response = await fetch(`/api/mealplan/item/${itemId}`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (response.ok) {
        await loadMealPlan();
        setSuccess('Meal replaced successfully!');
      } else {
        setError('Failed to replace meal');
      }
    } catch (err) {
      setError('Something went wrong');
    }
  };

  // Organize meals by day
  const mealsByDay = mealPlan?.items?.reduce((acc, item) => {
    if (!acc[item.day_of_week]) {
      acc[item.day_of_week] = [];
    }
    acc[item.day_of_week].push(item);
    return acc;
  }, {});

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayNames = {
    'Mon': 'Monday',
    'Tue': 'Tuesday',
    'Wed': 'Wednesday',
    'Thu': 'Thursday',
    'Fri': 'Friday',
    'Sat': 'Saturday',
    'Sun': 'Sunday'
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Smart Recipe Meal Planner
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
            <Typography variant="body1">{user.email}</Typography>
            <IconButton color="inherit" onClick={() => navigate('/preferences')}>
              <SettingsIcon />
            </IconButton>
            <IconButton color="inherit" onClick={onLogout}>
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={generateMealPlan}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            >
              {mealPlan ? 'Regenerate Meal Plan' : 'Generate Meal Plan'}
            </Button>

            {mealPlan && (
              <Button
                variant="outlined"
                onClick={() => setShowShoppingList(!showShoppingList)}
                startIcon={<ShoppingCartIcon />}
              >
                {showShoppingList ? 'Hide' : 'Show'} Shopping List
              </Button>
            )}
          </Box>

          <Button
            variant="outlined"
            color="secondary"
            onClick={() => navigate('/upgrade')}
            startIcon={<StarIcon />}
          >
            Upgrade Plan
          </Button>
        </Box>

        {showShoppingList && mealPlan && (
          <Box sx={{ mb: 3 }}>
            <ShoppingList planId={mealPlan.plan_id} />
          </Box>
        )}

        {!mealPlan && !loading && (
          <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No meal plan yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click "Generate Meal Plan" to get started with your weekly meals
            </Typography>
          </Paper>
        )}

        {mealPlan && mealsByDay && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Your Weekly Meal Plan
            </Typography>
            {days.map((day) => {
              const dayMeals = mealsByDay[day] || [];
              if (dayMeals.length === 0) return null;

              return (
                <Box key={day} sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {dayNames[day]}
                  </Typography>
                  <Grid container spacing={2}>
                    {dayMeals
                      .sort((a, b) => a.meal_number - b.meal_number)
                      .map((item) => (
                        <Grid item xs={12} sm={6} md={4} key={item.item_id}>
                          <MealPlanCard 
                            item={item} 
                            onReplace={() => replaceMeal(item.item_id)}
                          />
                        </Grid>
                      ))}
                  </Grid>
                </Box>
              );
            })}
          </Box>
        )}
      </Container>
    </>
  );
}

export default Dashboard;