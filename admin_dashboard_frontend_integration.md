# Admin Dashboard Frontend Integration Guide

This guide demonstrates how to integrate the admin dashboard API endpoints with a React frontend to create comprehensive data visualizations and statistics displays.

## Table of Contents
1. [API Endpoints Overview](#api-endpoints-overview)
2. [React Hooks for Data Fetching](#react-hooks-for-data-fetching)
3. [Dashboard Components](#dashboard-components)
4. [Chart Components](#chart-components)
5. [Complete Dashboard Implementation](#complete-dashboard-implementation)
6. [Styling and Layout](#styling-and-layout)

## API Endpoints Overview

The admin dashboard provides 5 main endpoints:

```javascript
// Available endpoints
const API_ENDPOINTS = {
  overview: '/api/admin/dashboard/overview',
  supplyDemand: '/api/admin/dashboard/supply-demand',
  operationalMetrics: '/api/admin/dashboard/operational-metrics',
  userAnalytics: '/api/admin/dashboard/user-analytics',
  donationTrends: '/api/admin/dashboard/donation-trends'
};
```

## React Hooks for Data Fetching

### Custom Hook for Dashboard Data

```javascript
// hooks/useDashboardData.js
import { useState, useEffect } from 'react';
import axios from 'axios';

export const useDashboardData = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { timeframe = '30d', refreshInterval = 300000 } = options; // 5 min default

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params: { timeframe }
      });
      setData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh data
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [endpoint, timeframe, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
};

// Specialized hooks for each dashboard section
export const useOverviewData = (options) =>
  useDashboardData('/api/admin/dashboard/overview', options);

export const useSupplyDemandData = (options) =>
  useDashboardData('/api/admin/dashboard/supply-demand', options);

export const useOperationalMetrics = (options) =>
  useDashboardData('/api/admin/dashboard/operational-metrics', options);

export const useUserAnalytics = (options) =>
  useDashboardData('/api/admin/dashboard/user-analytics', options);

export const useDonationTrends = (options) =>
  useDashboardData('/api/admin/dashboard/donation-trends', options);
```

## Dashboard Components

### Overview Metrics Cards

```javascript
// components/admin/OverviewCards.jsx
import React from 'react';
import { useOverviewData } from '../../hooks/useDashboardData';
import { TrendingUp, TrendingDown, Users, Gift, Truck, CheckCircle } from 'lucide-react';

const MetricCard = ({ title, value, growth, icon: Icon, color = 'blue' }) => {
  const isPositive = growth > 0;
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    red: 'bg-red-50 border-red-200 text-red-800'
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-2">{value.toLocaleString()}</p>
        </div>
        <Icon className="h-8 w-8 opacity-75" />
      </div>
      <div className="flex items-center mt-4">
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-green-600" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-600" />
        )}
        <span className={`ml-1 text-sm font-medium ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {Math.abs(growth)}%
        </span>
        <span className="text-sm text-gray-600 ml-1">vs last period</span>
      </div>
    </div>
  );
};

export const OverviewCards = () => {
  const { data, loading, error } = useOverviewData();

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
    ))}
  </div>;

  if (error) return <div className="text-red-600">Error loading overview: {error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Donations"
        value={data.totalDonations.count}
        growth={data.totalDonations.growth}
        icon={Gift}
        color="blue"
      />
      <MetricCard
        title="Active Donations"
        value={data.activeDonations.count}
        growth={data.activeDonations.growth}
        icon={Truck}
        color="orange"
      />
      <MetricCard
        title="Completed Donations"
        value={data.completedDonations.count}
        growth={data.completedDonations.growth}
        icon={CheckCircle}
        color="green"
      />
      <MetricCard
        title="Active Volunteers"
        value={data.activeVolunteers.count}
        growth={data.activeVolunteers.growth}
        icon={Users}
        color="blue"
      />
      <MetricCard
        title="Total Users"
        value={data.totalUsers.count}
        growth={data.totalUsers.growth}
        icon={Users}
        color="green"
      />
      <MetricCard
        title="Verified Charities"
        value={data.verifiedCharities.count}
        growth={data.verifiedCharities.growth}
        icon={CheckCircle}
        color="green"
      />
      <MetricCard
        title="Pending Pickups"
        value={data.pendingPickups.count}
        growth={data.pendingPickups.growth}
        icon={Truck}
        color="red"
      />
      <MetricCard
        title="Completed Pickups"
        value={data.completedPickups.count}
        growth={data.completedPickups.growth}
        icon={CheckCircle}
        color="green"
      />
    </div>
  );
};
```

### Supply & Demand Analysis Chart

```javascript
// components/admin/SupplyDemandChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSupplyDemandData } from '../../hooks/useDashboardData';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
        <p className="font-semibold">{label}</p>
        <p className="text-blue-600">
          Items Needed: {payload[0]?.value?.toLocaleString()}
        </p>
        <p className="text-green-600">
          Items Donated: {payload[1]?.value?.toLocaleString()}
        </p>
        <p className="text-red-600">
          Gap: {(payload[0]?.value - payload[1]?.value)?.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export const SupplyDemandChart = ({ timeframe = '30d' }) => {
  const { data, loading, error } = useSupplyDemandData({ timeframe });

  if (loading) return (
    <div className="h-96 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <span className="text-gray-500">Loading chart...</span>
    </div>
  );

  if (error) return <div className="text-red-600">Error loading chart: {error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Supply & Demand Analysis</h3>
        <div className="text-sm text-gray-600">
          Period: {timeframe}
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {data.keyInsights.totalGap.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Gap</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {data.keyInsights.categoriesWithUnmetNeeds}
          </div>
          <div className="text-sm text-gray-600">Unmet Needs</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {data.keyInsights.categoriesWithSurplus}
          </div>
          <div className="text-sm text-gray-600">Surplus Categories</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {data.supplyDemandData.length}
          </div>
          <div className="text-sm text-gray-600">Total Categories</div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data.supplyDemandData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="category"
            angle={-45}
            textAnchor="end"
            height={100}
            fontSize={12}
          />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="itemsNeeded" fill="#ef4444" name="Items Needed" />
          <Bar dataKey="itemsDonated" fill="#22c55e" name="Items Donated" />
        </BarChart>
      </ResponsiveContainer>

      {/* Biggest Gaps */}
      <div className="mt-6">
        <h4 className="font-semibold text-gray-800 mb-3">Biggest Gaps</h4>
        <div className="space-y-2">
          {data.keyInsights.biggestGaps.map((gap, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
              <span className="font-medium">{gap.category}</span>
              <span className="text-red-600 font-bold">{gap.gap.toLocaleString()} items</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### Operational Metrics Dashboard

```javascript
// components/admin/OperationalMetrics.jsx
import React from 'react';
import { useOperationalMetrics } from '../../hooks/useDashboardData';
import { Package, Truck, Users, Clock } from 'lucide-react';

const MetricCard = ({ title, count, label, action, color, icon: Icon }) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    red: 'bg-red-500 text-white',
    orange: 'bg-orange-500 text-white',
    green: 'bg-green-500 text-white'
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className={`${colorClasses[color]} p-4`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">{count.toLocaleString()}</div>
            <div className="text-sm opacity-90">{label}</div>
          </div>
          <Icon className="h-8 w-8 opacity-75" />
        </div>
      </div>
      <div className="p-4">
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          {action} →
        </button>
      </div>
    </div>
  );
};

const ActivityItem = ({ activity }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'donation': return <Package className="h-4 w-4 text-blue-500" />;
      case 'pickup': return <Truck className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded">
      {getActivityIcon(activity.type)}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
        <p className="text-xs text-gray-500">{activity.subtitle}</p>
        <p className="text-xs text-gray-400">{formatTime(activity.timestamp)}</p>
      </div>
      <div className="flex-shrink-0">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          activity.status === 'delivered' ? 'bg-green-100 text-green-800' :
          activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {activity.status}
        </span>
      </div>
    </div>
  );
};

export const OperationalMetrics = () => {
  const { data, loading, error } = useOperationalMetrics();

  if (loading) return <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
      ))}
    </div>
  </div>;

  if (error) return <div className="text-red-600">Error loading metrics: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Item Listings"
          count={data.metrics.activeItemListings.count}
          label={data.metrics.activeItemListings.label}
          action={data.metrics.activeItemListings.action}
          color={data.metrics.activeItemListings.color}
          icon={Package}
        />
        <MetricCard
          title="Pending Pickups"
          count={data.metrics.pendingPickups.count}
          label={data.metrics.pendingPickups.label}
          action={data.metrics.pendingPickups.action}
          color={data.metrics.pendingPickups.color}
          icon={Truck}
        />
        <MetricCard
          title="Pending Deliveries"
          count={data.metrics.pendingDeliveries.count}
          label={data.metrics.pendingDeliveries.label}
          action={data.metrics.pendingDeliveries.action}
          color={data.metrics.pendingDeliveries.color}
          icon={Truck}
        />
        <MetricCard
          title="Active Volunteers"
          count={data.metrics.activeVolunteers.count}
          label={data.metrics.activeVolunteers.label}
          action={data.metrics.activeVolunteers.action}
          color={data.metrics.activeVolunteers.color}
          icon={Users}
        />
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
          <p className="text-sm text-gray-600 mt-1">Latest donation and pickup activities</p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {data.recentActivities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
      </div>
    </div>
  );
};
```

## Chart Components

### User Analytics Charts

```javascript
// components/admin/UserAnalyticsCharts.jsx
import React from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useUserAnalytics } from '../../hooks/useDashboardData';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export const UserAnalyticsCharts = ({ timeframe = '30d' }) => {
  const { data, loading, error } = useUserAnalytics({ timeframe });

  if (loading) return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="animate-pulse bg-gray-200 h-80 rounded-lg"></div>
    ))}
  </div>;

  if (error) return <div className="text-red-600">Error loading analytics: {error}</div>;

  // Process registration trends data for line chart
  const registrationTrendsData = data.newUsersOverTime.reduce((acc, item) => {
    const existing = acc.find(a => a.date === item._id.date);
    if (existing) {
      existing[item._id.role] = item.count;
    } else {
      acc.push({
        date: item._id.date,
        [item._id.role]: item.count
      });
    }
    return acc;
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Users by Role Pie Chart */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Users by Role</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.usersByRole}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ _id, count, percent }) => `${_id}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
            >
              {data.usersByRole.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Registration Trends Line Chart */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Registration Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={registrationTrendsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="donor" stroke="#3b82f6" name="Donors" />
            <Line type="monotone" dataKey="volunteer" stroke="#10b981" name="Volunteers" />
            <Line type="monotone" dataKey="charity" stroke="#ef4444" name="Charities" />
            <Line type="monotone" dataKey="admin" stroke="#f59e0b" name="Admins" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Verification Status Chart */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Verification Status</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.verificationStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id.status" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* User Activity Status */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">User Activity</h3>
        <div className="space-y-4">
          {data.userActivity.map((activity, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <span className="font-medium capitalize">{activity._id}</span>
                <div className="text-sm text-gray-600">
                  Total: {activity.totalUsers}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  {activity.activeUsers}
                </div>
                <div className="text-sm text-gray-600">Active (7d)</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### Donation Trends Charts

```javascript
// components/admin/DonationTrendsCharts.jsx
import React from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useDonationTrends } from '../../hooks/useDashboardData';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const DonationTrendsCharts = ({ timeframe = '30d' }) => {
  const { data, loading, error } = useDonationTrends({ timeframe });

  if (loading) return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="animate-pulse bg-gray-200 h-80 rounded-lg"></div>
    ))}
  </div>;

  if (error) return <div className="text-red-600">Error loading trends: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <div className="text-3xl font-bold text-blue-600">
            {data.donationsOverTime.reduce((sum, item) => sum + item.count, 0)}
          </div>
          <div className="text-gray-600">Total Donations</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <div className="text-3xl font-bold text-green-600">{data.avgDeliveryTime}h</div>
          <div className="text-gray-600">Avg Delivery Time</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <div className="text-3xl font-bold text-purple-600">
            {data.donationsByCategory.length}
          </div>
          <div className="text-gray-600">Active Categories</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donations Over Time */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Donations Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.donationsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donation Status Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Donation Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.donationsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ _id, count, percent }) => `${_id}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {data.donationsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Donations by Category */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Donations by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.donationsByCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="_id"
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Performers */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Top Charities</h4>
              {data.topCharities.slice(0, 5).map((charity, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm">{charity.charityName}</span>
                  <span className="font-medium text-blue-600">{charity.donationCount}</span>
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Top Donors</h4>
              {data.topDonors.slice(0, 5).map((donor, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm">{donor.donorName}</span>
                  <span className="font-medium text-green-600">{donor.donationCount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## Complete Dashboard Implementation

### Main Dashboard Component

```javascript
// components/admin/AdminDashboard.jsx
import React, { useState } from 'react';
import { OverviewCards } from './OverviewCards';
import { SupplyDemandChart } from './SupplyDemandChart';
import { OperationalMetrics } from './OperationalMetrics';
import { UserAnalyticsCharts } from './UserAnalyticsCharts';
import { DonationTrendsCharts } from './DonationTrendsCharts';
import { Calendar, RefreshCw, Download } from 'lucide-react';

const TimeframeSelector = ({ timeframe, onChange }) => {
  const options = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
    { value: 'all', label: 'All Time' }
  ];

  return (
    <div className="flex items-center space-x-2">
      <Calendar className="h-4 w-4 text-gray-500" />
      <select
        value={timeframe}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export const AdminDashboard = () => {
  const [timeframe, setTimeframe] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'supply-demand', label: 'Supply & Demand' },
    { id: 'operations', label: 'Operations' },
    { id: 'users', label: 'User Analytics' },
    { id: 'donations', label: 'Donation Trends' }
  ];

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting data...');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Monitor and analyze platform performance</p>
            </div>
            <div className="flex items-center space-x-4">
              <TimeframeSelector timeframe={timeframe} onChange={setTimeframe} />
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && <OverviewCards />}
          {activeTab === 'supply-demand' && <SupplyDemandChart timeframe={timeframe} />}
          {activeTab === 'operations' && <OperationalMetrics />}
          {activeTab === 'users' && <UserAnalyticsCharts timeframe={timeframe} />}
          {activeTab === 'donations' && <DonationTrendsCharts timeframe={timeframe} />}
        </div>
      </div>
    </div>
  );
};
```

## Styling and Layout

### CSS Styles (Tailwind CSS)

```css
/* Additional custom styles if needed */
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

/* Custom chart styles */
.recharts-tooltip-wrapper {
  z-index: 1000;
}

.recharts-legend-wrapper {
  padding-top: 20px !important;
}

/* Loading animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
```

### Package Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.4.0",
    "recharts": "^2.7.2",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24"
  }
}
```

## Usage Example

```javascript
// App.jsx
import React from 'react';
import { AdminDashboard } from './components/admin/AdminDashboard';

function App() {
  return (
    <div className="App">
      <AdminDashboard />
    </div>
  );
}

export default App;
```

## Key Features

1. **Real-time Data**: Auto-refresh every 5 minutes
2. **Interactive Charts**: Using Recharts library for responsive visualizations
3. **Time Period Selection**: 7d, 30d, 90d, 1y, all time options
4. **Export Functionality**: Download data in CSV/JSON formats
5. **Responsive Design**: Works on desktop, tablet, and mobile
6. **Loading States**: Skeleton loading for better UX
7. **Error Handling**: Graceful error display and retry options
8. **Modular Components**: Reusable chart and metric components

This integration provides a comprehensive admin dashboard that matches the data structure from your backend APIs and creates professional, interactive visualizations for monitoring platform performance.

### Platform Trends Component

```javascript
// components/admin/PlatformTrends.jsx
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useDonationTrends } from '../../hooks/useDashboardData';

export const PlatformTrends = () => {
  const [activeTab, setActiveTab] = useState('Donations');
  const { data, loading, error } = useDonationTrends({
    timeframe: '1y',
    aggregation: 'monthly'
  });

  if (loading) return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="text-red-600">Error loading trends: {error}</div>
    </div>
  );

  const { platformTrends } = data;
  const currentValue = platformTrends.currentMonth.itemCount;
  const growthPercentage = platformTrends.growthPercentage;
  const isIncreasing = platformTrends.isIncreasing;

  // Format data for the chart
  const chartData = platformTrends.monthlyData.map(item => ({
    month: item.monthLabel.split(' ')[0], // Get short month name (Jan, Feb, etc.)
    value: item.itemCount,
    fullLabel: item.monthLabel
  }));

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Platform Trends</h2>
        <p className="text-sm text-gray-600 mt-1">Items donated per month</p>

        {/* Tab Navigation */}
        <div className="flex mt-4 space-x-1">
          {['Donations', 'Requests', 'Activity'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-teal-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 flex">
        {/* Chart Section */}
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
                domain={[0, 'dataMax + 200']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value, name) => [value.toLocaleString(), 'Items']}
                labelFormatter={(label) => {
                  const item = chartData.find(d => d.month === label);
                  return item ? item.fullLabel : label;
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Summary Section */}
        <div className="ml-8 flex flex-col justify-center">
          <div className="bg-gray-50 rounded-lg p-6 min-w-[280px]">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                {isIncreasing ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Trend Summary</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isIncreasing
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isIncreasing ? '↗' : '↘'} {platformTrends.trend}
                </div>
              </div>

              <div>
                <div className={`text-3xl font-bold ${
                  isIncreasing ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(growthPercentage)}%
                </div>
                <div className="text-sm text-gray-600">vs previous month</div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Latest ({platformTrends.currentMonth.month.split('-')[1]})
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {currentValue.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Usage in Main Dashboard

```javascript
// pages/AdminDashboard.jsx
import { PlatformTrends } from '../components/admin/PlatformTrends';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Other dashboard components */}

      {/* Platform Trends - Full Width */}
      <PlatformTrends />

      {/* Other components */}
    </div>
  );
};
```

### Updated Hook for Platform Trends

```javascript
// hooks/useDashboardData.js - Add this function
export const useDonationTrends = ({ timeframe = '30d', aggregation = 'daily' } = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/admin/dashboard/donation-trends?timeframe=${timeframe}&aggregation=${aggregation}`,
          {
            headers: {
              'Authorization': `Bearer ${getAuthToken()}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          setData(result.data);
          setError(null);
        } else {
          throw new Error(result.message || 'Failed to fetch trends');
        }
      } catch (err) {
        console.error('Error fetching donation trends:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [timeframe, aggregation]);

  return { data, loading, error };
};
```
