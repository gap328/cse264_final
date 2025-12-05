import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Box,
  CircularProgress,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GetAppIcon from '@mui/icons-material/GetApp';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ListAltIcon from '@mui/icons-material/ListAlt';

function ShoppingList({ planId }) {
  const [shoppingList, setShoppingList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [viewMode, setViewMode] = useState('aisle'); // 'aisle' or 'recipe'

  useEffect(() => {
    loadShoppingList();
  }, [planId]);

  const loadShoppingList = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/shoppinglist/${planId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Shopping list data:', data);
        setShoppingList(data);
      }
    } catch (err) {
      console.error('Failed to load shopping list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (itemName) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemName)) {
      newChecked.delete(itemName);
    } else {
      newChecked.add(itemName);
    }
    setCheckedItems(newChecked);
  };

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setViewMode(newView);
    }
  };

  const downloadList = () => {
    if (!shoppingList) return;

    let text = 'Shopping List\n\n';
    
    if (viewMode === 'aisle') {
      Object.entries(shoppingList.shoppingList).forEach(([aisle, items]) => {
        text += `${aisle}:\n`;
        items.forEach(item => {
          const amount = item.amount ? item.amount.toFixed(1) : '';
          const unit = item.unit || '';
          text += `  - ${item.name} ${amount} ${unit}\n`;
        });
        text += '\n';
      });
    } else {
      // Group by recipe
      shoppingList.byRecipe.forEach(recipe => {
        text += `${recipe.recipeName}:\n`;
        recipe.ingredients.forEach(item => {
          const amount = item.amount ? item.amount.toFixed(1) : '';
          const unit = item.unit || '';
          text += `  - ${item.name} ${amount} ${unit}\n`;
        });
        text += '\n';
      });
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shopping-list.txt';
    a.click();
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (!shoppingList || !shoppingList.shoppingList || shoppingList.totalItems === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>No shopping list available. Make sure your recipes have ingredients.</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          Shopping List ({shoppingList.totalItems} items)
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewChange}
            size="small"
          >
            <ToggleButton value="aisle">
              <ListAltIcon sx={{ mr: 1 }} />
              By Aisle
            </ToggleButton>
            <ToggleButton value="recipe">
              <RestaurantIcon sx={{ mr: 1 }} />
              By Recipe
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="outlined"
            size="small"
            startIcon={<GetAppIcon />}
            onClick={downloadList}
          >
            Download
          </Button>
        </Box>
      </Box>

      {viewMode === 'aisle' ? (
        // Grouped by Aisle (Combined ingredients)
        Object.entries(shoppingList.shoppingList).map(([aisle, items]) => (
          <Accordion key={aisle} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                {aisle} ({items.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {items.map((item, index) => {
                  const itemKey = `${aisle}-${item.name}-${index}`;
                  const isChecked = checkedItems.has(itemKey);
                  const amount = item.amount ? item.amount.toFixed(1) : '';
                  const unit = item.unit || '';

                  return (
                    <ListItem
                      key={itemKey}
                      dense
                      sx={{
                        textDecoration: isChecked ? 'line-through' : 'none',
                        opacity: isChecked ? 0.6 : 1
                      }}
                    >
                      <Checkbox
                        edge="start"
                        checked={isChecked}
                        onChange={() => handleToggle(itemKey)}
                      />
                      <ListItemText
                        primary={item.name}
                        secondary={item.notes || `${amount} ${unit}`.trim()}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </AccordionDetails>
          </Accordion>
        ))
      ) : (
        // Grouped by Recipe
        shoppingList.byRecipe && shoppingList.byRecipe.map((recipe) => (
          <Accordion key={recipe.recipeId} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                {recipe.recipeName} ({recipe.ingredients.length} ingredients)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {recipe.ingredients.map((item, index) => {
                  const itemKey = `${recipe.recipeId}-${item.name}-${index}`;
                  const isChecked = checkedItems.has(itemKey);
                  const amount = item.amount ? item.amount.toFixed(1) : '';
                  const unit = item.unit || '';

                  return (
                    <ListItem
                      key={itemKey}
                      dense
                      sx={{
                        textDecoration: isChecked ? 'line-through' : 'none',
                        opacity: isChecked ? 0.6 : 1
                      }}
                    >
                      <Checkbox
                        edge="start"
                        checked={isChecked}
                        onChange={() => handleToggle(itemKey)}
                      />
                      <ListItemText
                        primary={item.name}
                        secondary={`${amount} ${unit}`.trim()}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </AccordionDetails>
          </Accordion>
        ))
      )}
    </Paper>
  );
}

export default ShoppingList;