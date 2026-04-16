import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box
} from '@mui/material';

const StatisticsCard = ({ title, value, icon, color, trend }) => {
  return (
    <Card 
      elevation={1} 
      sx={{ 
        borderRadius: 3,
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="700" color={color}>
              {value}
            </Typography>
          </Box>
          <Box sx={{
            bgcolor: `${color}15`,
            borderRadius: '12px',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {React.cloneElement(icon, { 
              sx: { fontSize: 28, color: color } 
            })}
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {trend}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default StatisticsCard;
