'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Eye, 
  Download, 
  Share2, 
  TrendingUp,
  Calendar,
  MapPin,
  Monitor,
  Smartphone
} from 'lucide-react';

import { UnifiedResume } from '@/types/resume';

interface AnalyticsDashboardProps {
  resume: UnifiedResume;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ resume }) => {
  // Mock data - in a real app, this would come from analytics service
  const mockAnalytics = {
    totalViews: 1247,
    totalDownloads: 89,
    totalShares: 23,
    conversionRate: 7.1,
    viewsThisWeek: 156,
    downloadsThisWeek: 12,
    viewsOverTime: [
      { date: '2024-01-01', views: 45 },
      { date: '2024-01-02', views: 52 },
      { date: '2024-01-03', views: 38 },
      { date: '2024-01-04', views: 64 },
      { date: '2024-01-05', views: 71 },
      { date: '2024-01-06', views: 56 },
      { date: '2024-01-07', views: 83 },
    ],
    deviceBreakdown: [
      { name: 'Desktop', value: 68, color: '#3b82f6' },
      { name: 'Mobile', value: 28, color: '#10b981' },
      { name: 'Tablet', value: 4, color: '#f59e0b' },
    ],
    topReferrers: [
      { name: 'LinkedIn', count: 423 },
      { name: 'Indeed', count: 289 },
      { name: 'Company Website', count: 186 },
      { name: 'Email', count: 94 },
      { name: 'Direct', count: 67 },
    ],
    locationBreakdown: [
      { city: 'San Francisco', state: 'CA', views: 234 },
      { city: 'New York', state: 'NY', views: 189 },
      { city: 'Seattle', state: 'WA', views: 156 },
      { city: 'Austin', state: 'TX', views: 123 },
      { city: 'Boston', state: 'MA', views: 98 },
    ],
    applicationTracking: [
      { company: 'Google', position: 'Senior SWE', status: 'Interview', appliedDate: '2024-01-15' },
      { company: 'Meta', position: 'Full Stack Dev', status: 'Rejected', appliedDate: '2024-01-12' },
      { company: 'Apple', position: 'iOS Engineer', status: 'Applied', appliedDate: '2024-01-18' },
      { company: 'Netflix', position: 'Backend Engineer', status: 'Interview', appliedDate: '2024-01-10' },
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'interview': return 'bg-blue-100 text-blue-800';
      case 'applied': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'offer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Resume Analytics</h1>
        <p className="text-gray-600">
          Track your resume's performance and application progress
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.totalViews}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +{mockAnalytics.viewsThisWeek} this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.totalDownloads}</div>
            <p className="text-xs text-muted-foreground">
              +{mockAnalytics.downloadsThisWeek} this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shares</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.totalShares}</div>
            <p className="text-xs text-muted-foreground">
              Across all platforms
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Views to downloads
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Views Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockAnalytics.viewsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockAnalytics.deviceBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {mockAnalytics.deviceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockAnalytics.topReferrers.map((referrer, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{referrer.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{referrer.count}</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(referrer.count / mockAnalytics.topReferrers[0].count) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Top Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockAnalytics.locationBreakdown.map((location, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{location.city}, {location.state}</span>
                  </div>
                  <span className="text-sm font-medium">{location.views}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Application Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Company</th>
                  <th className="text-left p-2">Position</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Applied Date</th>
                </tr>
              </thead>
              <tbody>
                {mockAnalytics.applicationTracking.map((app, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{app.company}</td>
                    <td className="p-2">{app.position}</td>
                    <td className="p-2">
                      <Badge className={getStatusColor(app.status)}>
                        {app.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-gray-600">{app.appliedDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Resume Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle>Resume Performance Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {resume.optimization.analysis.atsScore}%
              </div>
              <p className="text-sm text-blue-700">ATS Compatibility</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((mockAnalytics.totalDownloads / mockAnalytics.totalViews) * 100)}%
              </div>
              <p className="text-sm text-green-700">Download Rate</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                4.2
              </div>
              <p className="text-sm text-purple-700">Performance Score</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Recommendations</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Your resume performs best on LinkedIn - consider optimizing for this platform</li>
              <li>• Desktop users spend more time viewing - optimize for desktop readability</li>
              <li>• Peak viewing hours are 9-11 AM - time your applications accordingly</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};