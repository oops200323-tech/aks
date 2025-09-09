import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  Title, 
  Tooltip, 
  Legend,
  ArcElement 
} from 'chart.js';
import { Calendar, UserCheck, TrendingUp, MessageCircle, BarChart3, Filter, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Register Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  Title, 
  Tooltip, 
  Legend,
  ArcElement
);

interface AnalyticsProps {
  survey: any;
}

interface SurveyOverview {
  id: string;
  name: string;
  responses: number;
  score: number;
  status: string;
  created_at: string;
}

interface ResponseData {
  date: string;
  responses: number;
  score: number;
}

const Analytics: React.FC<AnalyticsProps> = ({ survey }) => {
  const [scoreDistribution, setScoreDistribution] = useState<number[]>(Array(11).fill(0));
  const [npsScore, setNpsScore] = useState(0);
  const [allSurveys, setAllSurveys] = useState<SurveyOverview[]>([]);
  const [totalResponses, setTotalResponses] = useState(0);
  const [averageNPS, setAverageNPS] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Memoized chart options to prevent re-creation
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }), []);

  // Memoized trend data generation
  const responsesTrend = useMemo(() => {
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const data: ResponseData[] = [];
    
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Limit data points for performance
    const maxPoints = 30;
    const step = Math.max(1, Math.floor(daysDiff / maxPoints));
    
    for (let i = 0; i <= daysDiff; i += step) {
      const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const responses = Math.floor(Math.random() * 10);
      const score = Math.floor(Math.random() * 100) - 50;
      data.push({ date: dateStr, responses, score });
    }
    
    return data;
  }, [dateRange.startDate, dateRange.endDate]);

  // Calculate total responses for survey (moved to top level)
  const totalResponsesForSurvey = useMemo(() => {
    return scoreDistribution.reduce((sum, count) => sum + count, 0);
  }, [scoreDistribution]);

  // Memoized chart data for specific survey (moved to top level)
  const specificSurveyChartData = useMemo(() => ({
    labels: Array.from({ length: 11 }, (_, i) => i.toString()),
    datasets: [
      {
        label: 'Responses',
        data: scoreDistribution,
        backgroundColor: [
          ...Array(7).fill('rgba(254, 202, 202, 0.8)'),
          ...Array(2).fill('rgba(254, 240, 138, 0.8)'),
          ...Array(2).fill('rgba(187, 247, 208, 0.8)'),
        ],
        borderColor: [
          ...Array(7).fill('rgb(239, 68, 68)'),
          ...Array(2).fill('rgb(234, 179, 8)'),
          ...Array(2).fill('rgb(34, 197, 94)'),
        ],
        borderWidth: 1,
      },
    ],
  }), [scoreDistribution]);

  const specificSurveyChartOptions = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            const percentage = totalResponsesForSurvey ? Math.round((value / totalResponsesForSurvey) * 100) : 0;
            return `${value} responses (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Responses',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Score',
        },
      },
    },
  }), [totalResponsesForSurvey]);

  // Memoized chart data
  const chartData = useMemo(() => {
    const responseTrendChart = {
      labels: responsesTrend.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Daily Responses',
          data: responsesTrend.map(d => d.responses),
          borderColor: 'rgb(79, 70, 229)',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          tension: 0.4,
        }
      ]
    };

    const npsScoreTrendChart = {
      labels: responsesTrend.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [
        {
          label: 'NPS Score',
          data: responsesTrend.map(d => d.score),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
        }
      ]
    };

    const detractors = Math.round(totalResponses * 0.2);
    const promoters = Math.round(totalResponses * 0.5);
    const passives = totalResponses - detractors - promoters;

    const npsDistributionChart = {
      labels: ['Detractors (0-6)', 'Passives (7-8)', 'Promoters (9-10)'],
      datasets: [
        {
          data: [detractors, passives, promoters],
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(234, 179, 8, 0.8)',
            'rgba(34, 197, 94, 0.8)',
          ],
          borderColor: [
            'rgb(239, 68, 68)',
            'rgb(234, 179, 8)',
            'rgb(34, 197, 94)',
          ],
          borderWidth: 2,
        }
      ]
    };

    const surveyPerformanceChart = {
      labels: allSurveys.slice(0, 10).map(s => s.name.length > 15 ? s.name.substring(0, 15) + '...' : s.name),
      datasets: [
        {
          label: 'NPS Score',
          data: allSurveys.slice(0, 10).map(s => s.score || 0),
          backgroundColor: allSurveys.slice(0, 10).map(s => {
            const score = s.score || 0;
            if (score >= 50) return 'rgba(34, 197, 94, 0.8)';
            if (score >= 0) return 'rgba(234, 179, 8, 0.8)';
            return 'rgba(239, 68, 68, 0.8)';
          }),
          borderColor: allSurveys.slice(0, 10).map(s => {
            const score = s.score || 0;
            if (score >= 50) return 'rgb(34, 197, 94)';
            if (score >= 0) return 'rgb(234, 179, 8)';
            return 'rgb(239, 68, 68)';
          }),
          borderWidth: 1,
        }
      ]
    };

    return {
      responseTrendChart,
      npsScoreTrendChart,
      npsDistributionChart,
      surveyPerformanceChart
    };
  }, [responsesTrend, totalResponses, allSurveys]);

  // Optimized data loading
  const loadOverviewData = useCallback(async () => {
    if (survey) return; // Skip if specific survey is selected
    
    setLoading(true);
    try {
      const { data: surveysData, error } = await supabase
        .from('surveys')
        .select('id, name, responses, score, status, created_at')
        .eq('status', 'published')
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate + 'T23:59:59')
        .order('created_at', { ascending: false })
        .limit(50); // Limit results for performance

      if (error) throw error;

      setAllSurveys(surveysData || []);
      
      // Calculate totals
      const total = surveysData?.reduce((sum, s) => sum + (s.responses || 0), 0) || 0;
      setTotalResponses(total);
      
      // Calculate average NPS
      const publishedSurveys = surveysData?.filter(s => (s.responses || 0) > 0) || [];
      if (publishedSurveys.length > 0) {
        const avgNPS = publishedSurveys.reduce((sum, s) => sum + (s.score || 0), 0) / publishedSurveys.length;
        setAverageNPS(Math.round(avgNPS));
      }
    } catch (error) {
      console.error('Error loading overview data:', error);
    } finally {
      setLoading(false);
    }
  }, [survey, dateRange.startDate, dateRange.endDate]);

  const handleDateRangeChange = useCallback((field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  }, []);

  const setQuickDateRange = useCallback((days: number) => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setDateRange({ startDate: start, endDate: end });
  }, []);

  const exportData = useCallback(() => {
    const csvContent = [
      ['Survey Name', 'Responses', 'NPS Score', 'Status', 'Created Date'],
      ...allSurveys.map(s => [s.name, s.responses, s.score, s.status, s.created_at])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nps-analytics-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [allSurveys, dateRange]);

  // Load data on mount and date range change
  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  // Initialize analytics data for specific survey
  useEffect(() => {
    if (survey && survey.responses && survey.responses > 0) {
      setLoading(true);
      
      // Simulate async operation for consistency
      setTimeout(() => {
        const mockScoreDistribution = Array(11).fill(0).map(() => Math.floor(Math.random() * 20));
        setScoreDistribution(mockScoreDistribution);
        
        const total = mockScoreDistribution.reduce((sum, count) => sum + count, 0);
        if (total > 0) {
          const promoters = mockScoreDistribution.slice(9).reduce((sum, count) => sum + count, 0);
          const detractors = mockScoreDistribution.slice(0, 7).reduce((sum, count) => sum + count, 0);
          const nps = Math.round(((promoters / total) - (detractors / total)) * 100);
          setNpsScore(nps);
        }
        setLoading(false);
      }, 100);
    } else if (survey) {
      setScoreDistribution(Array(11).fill(0));
      setNpsScore(0);
      setLoading(false);
    }
  }, [survey]);

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4F46E5]"></div>
        </div>
      </div>
    );
  }

  // Show overview when no specific survey is selected
  if (!survey) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1>Analytics Overview</h1>
            <p className="text-gray-500 mt-1">Comprehensive insights across all your NPS surveys</p>
          </div>
          <button
            onClick={exportData}
            className="btn-secondary"
          >
            <Download size={18} />
            Export Data
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="card mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Filter size={20} className="text-gray-500" />
            <h3 className="text-lg font-semibold">Date Range Filter</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex items-end">
              <div className="grid grid-cols-3 gap-2 w-full">
                <button
                  onClick={() => setQuickDateRange(7)}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  7 Days
                </button>
                <button
                  onClick={() => setQuickDateRange(30)}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  30 Days
                </button>
                <button
                  onClick={() => setQuickDateRange(90)}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  90 Days
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="stats-icon">
              <BarChart3 size={18} />
            </div>
            <h3 className="text-xl font-bold mt-2">{allSurveys.length}</h3>
            <p className="text-sm text-gray-500">Total Surveys</p>
            <div className="text-xs text-gray-400 mt-1">
              {allSurveys.filter(s => s.status === 'published').length} published
            </div>
          </div>
          
          <div className="card">
            <div className="stats-icon">
              <TrendingUp size={18} />
            </div>
            <h3 className="text-xl font-bold mt-2">{averageNPS}</h3>
            <p className="text-sm text-gray-500">Average NPS Score</p>
            <div className={`text-xs mt-1 ${averageNPS >= 50 ? 'text-green-600' : averageNPS >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
              {averageNPS >= 50 ? 'Excellent' : averageNPS >= 0 ? 'Good' : 'Needs Improvement'}
            </div>
          </div>
          
          <div className="card">
            <div className="stats-icon">
              <UserCheck size={18} />
            </div>
            <h3 className="text-xl font-bold mt-2">{totalResponses}</h3>
            <p className="text-sm text-gray-500">Total Responses</p>
            <div className="text-xs text-gray-400 mt-1">
              {Math.round(totalResponses / Math.max(allSurveys.length, 1))} avg per survey
            </div>
          </div>
          
          <div className="card">
            <div className="stats-icon">
              <MessageCircle size={18} />
            </div>
            <h3 className="text-xl font-bold mt-2">{Math.round(totalResponses * 0.75)}</h3>
            <p className="text-sm text-gray-500">Feedback Comments</p>
            <div className="text-xs text-gray-400 mt-1">
              75% response rate
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Response Trend Chart */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Response Trend</h2>
            <div className="h-64">
              <Line data={chartData.responseTrendChart} options={chartOptions} />
            </div>
          </div>

          {/* NPS Score Trend Chart */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">NPS Score Trend</h2>
            <div className="h-64">
              <Line data={chartData.npsScoreTrendChart} options={chartOptions} />
            </div>
          </div>

          {/* NPS Distribution */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">NPS Distribution</h2>
            <div className="h-64">
              <Doughnut 
                data={chartData.npsDistributionChart} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                  },
                }} 
              />
            </div>
          </div>

          {/* Survey Performance */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Survey Performance</h2>
            <div className="h-64">
              <Bar data={chartData.surveyPerformanceChart} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Surveys Table */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Survey Performance Details</h2>
          {allSurveys.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">No surveys found</h3>
              <p className="text-gray-400">No surveys found in the selected date range.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Survey Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Responses</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">NPS Score</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {allSurveys.map((surveyItem) => (
                    <tr key={surveyItem.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{surveyItem.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <UserCheck size={16} className="text-gray-400 mr-2" />
                          {surveyItem.responses || 0}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${
                            (surveyItem.score || 0) >= 50 ? 'bg-green-400' :
                            (surveyItem.score || 0) >= 0 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}></div>
                          <span className="font-medium">{surveyItem.score || 0}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          (surveyItem.score || 0) >= 50 ? 'bg-green-100 text-green-800' :
                          (surveyItem.score || 0) >= 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {(surveyItem.score || 0) >= 50 ? 'Excellent' : (surveyItem.score || 0) >= 0 ? 'Good' : 'Poor'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          surveyItem.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {surveyItem.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(surveyItem.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Insights */}
        {allSurveys.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Top Performing Survey</h3>
              {(() => {
                const topSurvey = allSurveys.reduce((prev, current) => 
                  (current.score || 0) > (prev.score || 0) ? current : prev
                );
                return (
                  <div>
                    <div className="font-medium text-gray-900 mb-2">{topSurvey.name}</div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center">
                        <TrendingUp size={16} className="text-green-500 mr-1" />
                        <span className="text-lg font-bold text-green-600">{topSurvey.score || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <UserCheck size={16} className="text-gray-400 mr-1" />
                        <span className="text-gray-600">{topSurvey.responses || 0} responses</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Most Active Survey</h3>
              {(() => {
                const mostActive = allSurveys.reduce((prev, current) => 
                  (current.responses || 0) > (prev.responses || 0) ? current : prev
                );
                return (
                  <div>
                    <div className="font-medium text-gray-900 mb-2">{mostActive.name}</div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center">
                        <UserCheck size={16} className="text-blue-500 mr-1" />
                        <span className="text-lg font-bold text-blue-600">{mostActive.responses || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <TrendingUp size={16} className="text-gray-400 mr-1" />
                        <span className="text-gray-600">NPS: {mostActive.score || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Response Rate</h3>
              <div>
                <div className="font-medium text-gray-900 mb-2">Overall Performance</div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <MessageCircle size={16} className="text-purple-500 mr-1" />
                    <span className="text-lg font-bold text-purple-600">75%</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar size={16} className="text-gray-400 mr-1" />
                    <span className="text-gray-600">Last 30 days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show specific survey analytics
  // Calculate percentages
  const detractors = scoreDistribution.slice(0, 7).reduce((sum, count) => sum + count, 0);
  const passives = scoreDistribution.slice(7, 9).reduce((sum, count) => sum + count, 0);
  const promoters = scoreDistribution.slice(9).reduce((sum, count) => sum + count, 0);
  
  const detractorsPercentage = totalResponsesForSurvey ? Math.round((detractors / totalResponsesForSurvey) * 100) : 0;
  const passivesPercentage = totalResponsesForSurvey ? Math.round((passives / totalResponsesForSurvey) * 100) : 0;
  const promotersPercentage = totalResponsesForSurvey ? Math.round((promoters / totalResponsesForSurvey) * 100) : 0;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1>{survey.name}</h1>
          <p className="text-gray-500 mt-1">Analytics and insights</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="stats-icon">
            <TrendingUp size={18} />
          </div>
          <h3 className="text-xl font-bold mt-2">{npsScore}</h3>
          <p className="text-sm text-gray-500">NPS Score</p>
        </div>
        
        <div className="card">
          <div className="stats-icon">
            <UserCheck size={18} />
          </div>
          <h3 className="text-xl font-bold mt-2">{totalResponsesForSurvey}</h3>
          <p className="text-sm text-gray-500">Total Responses</p>
        </div>
        
        <div className="card">
          <div className="stats-icon">
            <MessageCircle size={18} />
          </div>
          <h3 className="text-xl font-bold mt-2">{totalResponsesForSurvey > 0 ? Math.round(totalResponsesForSurvey * 0.75) : 0}</h3>
          <p className="text-sm text-gray-500">Feedback Comments</p>
        </div>
        
        <div className="card">
          <div className="stats-icon">
            <Calendar size={18} />
          </div>
          <h3 className="text-xl font-bold mt-2">{totalResponsesForSurvey > 0 ? '30 days' : '0 days'}</h3>
          <p className="text-sm text-gray-500">Active Period</p>
        </div>
      </div>

      {/* Score Distribution Chart */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-6">Score Distribution</h2>
        <div className="h-64">
          <Bar data={specificSurveyChartData} options={specificSurveyChartOptions} />
        </div>
      </div>

      {/* Respondent Categories */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6">Respondent Categories</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-red-50 rounded-xl p-6 border border-red-100">
            <h3 className="text-xl font-bold text-red-700">{detractorsPercentage}%</h3>
            <p className="text-sm font-medium text-red-600 mt-1">Detractors (0-6)</p>
            <p className="text-xs text-gray-500 mt-2">{detractors} responses</p>
          </div>
          
          <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-100">
            <h3 className="text-xl font-bold text-yellow-700">{passivesPercentage}%</h3>
            <p className="text-sm font-medium text-yellow-600 mt-1">Passives (7-8)</p>
            <p className="text-xs text-gray-500 mt-2">{passives} responses</p>
          </div>
          
          <div className="bg-green-50 rounded-xl p-6 border border-green-100">
            <h3 className="text-xl font-bold text-green-700">{promotersPercentage}%</h3>
            <p className="text-sm font-medium text-green-600 mt-1">Promoters (9-10)</p>
            <p className="text-xs text-gray-500 mt-2">{promoters} responses</p>
          </div>
        </div>
        
        <div className="mt-8">
          <h4 className="text-sm font-medium text-gray-700 mb-2">NPS Calculation</h4>
          <p className="text-sm text-gray-600">
            NPS = % Promoters - % Detractors = {promotersPercentage}% - {detractorsPercentage}% = {npsScore}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;