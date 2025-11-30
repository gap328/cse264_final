import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  IconButton,
  Box
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

function MealPlanCard({ item, onReplace }) {
  const mealTypeLabels = {
    1: 'Breakfast',
    2: 'Lunch',
    3: 'Dinner',
    4: 'Snack'
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        height="140"
        image={item.image_url || 'https://via.placeholder.com/300x140?text=No+Image'}
        alt={item.title}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
          <Chip 
            label={mealTypeLabels[item.meal_number] || `Meal ${item.meal_number}`}
            size="small" 
            color="primary" 
          />
          <IconButton 
            size="small" 
            onClick={onReplace}
            title="Replace this meal"
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
        <Typography variant="h6" component="div" sx={{ fontSize: '1rem' }}>
          {item.title}
        </Typography>
        {item.calories > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {item.calories} calories
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default MealPlanCard;