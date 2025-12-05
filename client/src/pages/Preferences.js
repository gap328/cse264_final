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
  IconButton
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

function Preferences({ user, onLogout }) {
  const [dietType, setDietType] = useState('');
  const [calorieTarget, setCalorieTarget] = useState('');
  const [allergies, setAllergies] = useState('');
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadPreferences();
  }, []);

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

  // FIXED: Updated diet options to match Spoonacular API exactly
  const dietOptions = [
    { value: '', label: 'None' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'gluten free', label: 'Gluten Free' },  // Changed from glutenFree
    { value: 'ketogenic', label: 'Ketogenic' },
    { value: 'paleo', label: 'Paleo' },
    { value: 'pescetarian', label: 'Pescetarian' },  // Added
    { value: 'lacto-vegetarian', label: 'Lacto-Vegetarian' },  // Added
    { value: 'ovo-vegetarian', label: 'Ovo-Vegetarian' },  // Added
    { value: 'whole30', label: 'Whole30' },  // Added
  ];

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Meal Preferences
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            {user.email}
          </Typography>
          <IconButton color="inherit" onClick={onLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <Paper elevation={3} sx={{ padding: 4 }}>
            <Typography variant="h5" gutterBottom>
              Set Your Meal Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Tell us about your dietary needs and goals
            </Typography>

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
              >
                <MenuItem value={2}>2 Meals</MenuItem>
                <MenuItem value={3}>3 Meals</MenuItem>
                <MenuItem value={4}>4 Meals</MenuItem>
              </TextField>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
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