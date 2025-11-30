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
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GetAppIcon from '@mui/icons-material/GetApp';

function ShoppingList({ planId }) {
  const [shoppingList, setShoppingList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState(new Set());

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

  const downloadList = () => {
    if (!shoppingList) return;

    let text = 'Shopping List\n\n';
    
    Object.entries(shoppingList.shoppingList).forEach(([aisle, items]) => {
      text += `${aisle}:\n`;
      items.forEach(item => {
        const amount = item.amount ? item.amount.toFixed(1) : '';
        const unit = item.unit || '';
        text += `  - ${item.name} ${amount} ${unit}\n`;
      });
      text += '\n';
    });

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

  if (!shoppingList || shoppingList.totalItems === 0) {
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
        <Button
          variant="outlined"
          size="small"
          startIcon={<GetAppIcon />}
          onClick={downloadList}
        >
          Download
        </Button>
      </Box>

      {Object.entries(shoppingList.shoppingList).map(([aisle, items]) => (
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
      ))}
    </Paper>
  );
}

export default ShoppingList;