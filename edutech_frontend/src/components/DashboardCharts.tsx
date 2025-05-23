import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import Grid from '@mui/material/Grid';
import type { SelectChangeEvent } from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { api } from '../services/api';

// Define chart data types
interface NotesChartData {
  date: string;
  count: number;
}

interface CategoryData {
  id: number | null;
  name: string;
  noteCount: number;
  percentage: number;
}

interface CategorySummary {
  totalNotes: number;
  categories: CategoryData[];
}

interface CategoryProgress {
  id: number | null;
  name: string;
  totalLessons: number;
  lessonsWithNotes: number;
  progress: number;
}

interface ProgressSummary {
  categories: CategoryProgress[];
}

const DashboardCharts: React.FC = () => {
  const [notesData, setNotesData] = useState<NotesChartData[]>([]);
  const [categorySummary, setCategorySummary] = useState<CategorySummary | null>(null);
  const [progressData, setProgressData] = useState<CategoryProgress[]>([]);
  const [loading, setLoading] = useState<{[key: string]: boolean}>({
    notes: true,
    categories: true,
    progress: true
  });
  const [error, setError] = useState<{[key: string]: string | null}>({
    notes: null,
    categories: null,
    progress: null
  });
  const [timeRange, setTimeRange] = useState<string>('7');
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    fetchNotesData();
    fetchCategoryData();
    fetchProgressData();
  }, [timeRange]);

  const fetchNotesData = async () => {
    setLoading(prev => ({ ...prev, notes: true }));
    setError(prev => ({ ...prev, notes: null }));
    
    try {
      const response = await api.get(`/dashboard/notes-summary?days=${timeRange}`);
      setNotesData(response.data.data);
    } catch (err) {
      console.error('Error fetching notes data:', err);
      setError(prev => ({ ...prev, notes: 'Failed to load notes data' }));
    } finally {
      setLoading(prev => ({ ...prev, notes: false }));
    }
  };

  const fetchCategoryData = async () => {
    setLoading(prev => ({ ...prev, categories: true }));
    setError(prev => ({ ...prev, categories: null }));
    
    try {
      const response = await api.get('/dashboard/category-summary');
      setCategorySummary(response.data);
    } catch (err) {
      console.error('Error fetching category data:', err);
      setError(prev => ({ ...prev, categories: 'Failed to load category data' }));
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }
  };

  const fetchProgressData = async () => {
    setLoading(prev => ({ ...prev, progress: true }));
    setError(prev => ({ ...prev, progress: null }));
    
    try {
      const response = await api.get('/dashboard/lessons-progress');
      setProgressData(response.data.categories);
    } catch (err) {
      console.error('Error fetching progress data:', err);
      setError(prev => ({ ...prev, progress: 'Failed to load progress data' }));
    } finally {
      setLoading(prev => ({ ...prev, progress: false }));
    }
  };

  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Format date for x-axis display
  const formatDate = (date: string) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFCC00'];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Tabs 
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            aria-label="dashboard charts tabs"
          >
            <Tab label="Activity" />
            <Tab label="Categories" />
            <Tab label="Progress" />
          </Tabs>
        </Paper>
      </Grid>

      {/* Notes Activity Chart */}
      {activeTab === 0 && (
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Notes Activity</Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={handleTimeRangeChange}
                >
                  <MenuItem value="7">Last 7 days</MenuItem>
                  <MenuItem value="14">Last 14 days</MenuItem>
                  <MenuItem value="30">Last 30 days</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {loading.notes ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : error.notes ? (
              <Alert severity="error">{error.notes}</Alert>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={notesData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value} notes`, 'Count']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Bar dataKey="count" name="Notes" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      )}

      {/* Category Distribution Chart */}
      {activeTab === 1 && (
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Notes by Category</Typography>
            
            {loading.categories ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : error.categories ? (
              <Alert severity="error">{error.categories}</Alert>
            ) : categorySummary?.totalNotes === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">No notes found in any category</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categorySummary?.categories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="noteCount"
                    nameKey="name"
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                  >
                    {categorySummary?.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} notes`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      )}

      {/* Lessons Progress */}
      {activeTab === 2 && (
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Lessons with Notes Progress</Typography>
            
            {loading.progress ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : error.progress ? (
              <Alert severity="error">{error.progress}</Alert>
            ) : progressData.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">No lessons found in any category</Typography>
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                {progressData.map((category) => (
                  <Box key={category.name} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1">{category.name}</Typography>
                      <Typography variant="body2">
                        {category.lessonsWithNotes} / {category.totalLessons} lessons with notes
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ flexGrow: 1, mr: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={category.progress} 
                          sx={{ height: 10, borderRadius: 5 }}
                        />
                      </Box>
                      <Typography variant="body2">{category.progress}%</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      )}
    </Grid>
  );
};

export default DashboardCharts;
