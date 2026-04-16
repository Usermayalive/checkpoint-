import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button
} from '@mui/material';
import {
  Schedule,
  LocationOn,
  Groups,
  CheckCircle,
  History
} from '@mui/icons-material';

const SessionCard = ({ sessions }) => {
  return (
    <Paper elevation={1} sx={{ p: 3, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="600">
          Recent Sessions
        </Typography>
        <Chip 
          icon={<History />}
          label="History"
          size="small"
          variant="outlined"
        />
      </Box>

      <List sx={{ width: '100%' }}>
        {sessions.slice(0, 3).map((session, index) => (
          <React.Fragment key={session.id}>
            <ListItem 
              alignItems="flex-start"
              sx={{ 
                px: 0,
                '&:hover': { bgcolor: 'action.hover' },
                borderRadius: 1
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Box sx={{
                  bgcolor: session.status === 'completed' ? '#e8f5e9' : '#fff3e0',
                  borderRadius: '8px',
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {session.status === 'completed' ? (
                    <CheckCircle color="success" fontSize="small" />
                  ) : (
                    <Schedule color="warning" fontSize="small" />
                  )}
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" fontWeight="600">
                    {session.subject}
                  </Typography>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOn fontSize="small" /> {session.classroom}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Schedule fontSize="small" /> {session.duration}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {session.date} • 
                      <Box component="span" sx={{ ml: 1, color: 'primary.main', fontWeight: 500 }}>
                        <Groups fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: 16 }} />
                        {session.present}/{session.total} present
                      </Box>
                    </Typography>
                  </Box>
                }
              />
              <Chip
                label={session.status === 'completed' ? 'Completed' : 'Active'}
                color={session.status === 'completed' ? 'success' : 'warning'}
                size="small"
                variant="outlined"
                sx={{ ml: 1 }}
              />
            </ListItem>
            {index < sessions.length - 1 && index < 2 && (
              <Divider variant="inset" component="li" sx={{ ml: 7 }} />
            )}
          </React.Fragment>
        ))}
      </List>

      {sessions.length > 3 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button size="small" color="primary">
            View All Sessions
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default SessionCard;
