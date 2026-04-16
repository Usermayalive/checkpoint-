import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Typography,
  Box,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  Face
} from '@mui/icons-material';

const StudentList = ({ students, activeSession, title }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle color="success" fontSize="small" />;
      case 'absent':
        return <Cancel color="error" fontSize="small" />;
      case 'late':
        return <Schedule color="warning" fontSize="small" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'late': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="600">
          {title}
        </Typography>
        <Chip 
          icon={<Face />}
          label={`${students.filter(s => s.status === 'present').length}/${students.length} Present`}
          color="primary"
          variant="outlined"
        />
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell align="center">MIS</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Time</TableCell>
              <TableCell align="center">Confidence</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow 
                key={student.id}
                hover
                sx={{ 
                  '&:last-child td, &:last-child th': { border: 0 },
                  bgcolor: student.status === 'present' ? 'rgba(76, 175, 80, 0.04)' : 'inherit'
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#2196f3' }}>
                      {student.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight="500">
                        {student.name}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" color="text.secondary">
                    {student.mis}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    icon={getStatusIcon(student.status)}
                    label={student.status?.toUpperCase()}
                    color={getStatusColor(student.status)}
                    size="small"
                    variant={student.status === 'present' ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell align="center">
                  {student.time ? (
                    <Typography variant="body2" color="text.secondary">
                      {student.time}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.disabled">
                      Not marked
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  {student.confidence ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: '60px' }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={student.confidence} 
                          color={student.confidence > 90 ? 'success' : 'warning'}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {student.confidence}%
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.disabled">
                      -
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {activeSession && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(33, 150, 243, 0.05)', borderRadius: 2 }}>
          <Typography variant="body2" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle fontSize="small" />
            Real-time updates enabled. Students appear here as they check in.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default StudentList;