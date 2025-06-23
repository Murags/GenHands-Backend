### Charity Dashboard Statistics API Examples

This document provides examples for the charity dashboard statistics endpoint that provides key metrics for charity dashboards.

---

## Dashboard Statistics Endpoint

### Get Charity Dashboard Stats

**Endpoint:** `GET /api/donations/charity/dashboard-stats`
**Access:** Private/Charity only
**Description:** Retrieves real-time statistics for the charity dashboard including active requirements, incoming donations, pending deliveries, and thank you notes count.

#### Sample Request:

```http
GET http://localhost:3000/api/donations/charity/dashboard-stats
Headers:
  Authorization: Bearer <charity_auth_token>
```

#### Sample Response (Success):

```json
{
  "success": true,
  "data": {
    "activeRequirements": {
      "count": 24,
      "label": "Items needed"
    },
    "incomingDonations": {
      "count": 18,
      "label": "From generous donors"
    },
    "pendingDeliveries": {
      "count": 8,
      "label": "Awaiting pickup"
    },
    "thankYouNotes": {
      "count": 156,
      "label": "Gratitude expressed"
    }
  }
}
```

#### Response with Zero Values:

```json
{
  "success": true,
  "data": {
    "activeRequirements": {
      "count": 0,
      "label": "Items needed"
    },
    "incomingDonations": {
      "count": 0,
      "label": "From generous donors"
    },
    "pendingDeliveries": {
      "count": 0,
      "label": "Awaiting pickup"
    },
    "thankYouNotes": {
      "count": 0,
      "label": "Gratitude expressed"
    }
  }
}
```

---

## Statistics Breakdown

### 1. Active Requirements
- **What it counts:** Number of categories in the charity's `neededCategories` array
- **Source:** Charity's needs management (set via `/api/charity/needs`)
- **Use case:** Shows how many different types of items the charity currently needs
- **Example:** If charity needs "Food", "Clothing", "Books" → count = 3

### 2. Incoming Donations
- **What it counts:** Donations with status `submitted` or `assigned`
- **Source:** Donations table where `charityId` matches and status is early-stage
- **Use case:** Shows donations that are coming but haven't been picked up yet
- **Statuses included:** `submitted`, `assigned`

### 3. Pending Deliveries
- **What it counts:** Donations with status `picked_up`
- **Source:** Donations table where `charityId` matches and status is `picked_up`
- **Use case:** Shows donations that volunteers have collected but haven't delivered yet
- **Status included:** `picked_up`

### 4. Thank You Notes
- **What it counts:** Donations with status `confirmed`
- **Source:** Donations table where `charityId` matches and status is `confirmed`
- **Use case:** Shows total number of donations the charity has confirmed and sent thank you notes for
- **Status included:** `confirmed`

---

## Frontend Implementation Examples

### React Component Example:

```jsx
import React, { useState, useEffect } from 'react';

const CharityDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/donations/charity/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="dashboard-stats">
      <div className="stats-grid">
        <StatCard
          title="Active Requirements"
          count={stats.activeRequirements.count}
          label={stats.activeRequirements.label}
          color="blue"
          icon="📋"
        />

        <StatCard
          title="Incoming Donations"
          count={stats.incomingDonations.count}
          label={stats.incomingDonations.label}
          color="green"
          icon="🎁"
        />

        <StatCard
          title="Pending Deliveries"
          count={stats.pendingDeliveries.count}
          label={stats.pendingDeliveries.label}
          color="orange"
          icon="🚚"
        />

        <StatCard
          title="Thank You Notes"
          count={stats.thankYouNotes.count}
          label={stats.thankYouNotes.label}
          color="red"
          icon="💝"
        />
      </div>
    </div>
  );
};

const StatCard = ({ title, count, label, color, icon }) => (
  <div className={`stat-card ${color}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-content">
      <h3>{title}</h3>
      <div className="stat-number">{count}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);
```

### CSS Styling Example:

```css
.dashboard-stats {
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 2.5rem;
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
}

.stat-card.blue .stat-icon { background-color: #3b82f6; }
.stat-card.green .stat-icon { background-color: #10b981; }
.stat-card.orange .stat-icon { background-color: #f59e0b; }
.stat-card.red .stat-icon { background-color: #ef4444; }

.stat-content h3 {
  margin: 0 0 8px 0;
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  margin: 4px 0;
}

.stat-card.blue .stat-number { color: #3b82f6; }
.stat-card.green .stat-number { color: #10b981; }
.stat-card.orange .stat-number { color: #f59e0b; }
.stat-card.red .stat-number { color: #ef4444; }

.stat-label {
  font-size: 0.85rem;
  color: #9ca3af;
}
```

---

## Real-time Updates

For real-time dashboard updates, you can:

1. **Polling:** Fetch stats every 30-60 seconds
2. **Manual Refresh:** Add a refresh button
3. **Event-driven:** Refresh when user performs actions

```javascript
// Example: Auto-refresh every 60 seconds
useEffect(() => {
  const interval = setInterval(fetchDashboardStats, 60000);
  return () => clearInterval(interval);
}, []);
```

---

## Error Handling

```javascript
const fetchDashboardStats = async () => {
  try {
    const response = await fetch('/api/donations/charity/dashboard-stats', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      setStats(data.data);
    } else {
      throw new Error(data.message || 'Failed to fetch stats');
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Show user-friendly error message
    setError('Unable to load dashboard statistics. Please try again.');
  }
};
```
