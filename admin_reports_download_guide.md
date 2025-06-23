# Admin Reports Download Guide

## 📥 Downloadable Reports Feature

Yes! The admin reports are now **fully downloadable** in multiple formats. This guide covers how to download, use, and implement the export functionality.

---

## 🎯 **Available Download Formats**

### 1. **CSV Format** (Default)
- **Best for:** Excel analysis, data import, spreadsheet manipulation
- **Contains:** Structured data with clear sections and headers
- **File extension:** `.csv`

### 2. **JSON Format**
- **Best for:** API integration, programmatic analysis, data archiving
- **Contains:** Complete structured data with metadata
- **File extension:** `.json`

---

## 📋 **Download Endpoints**

### Base Export URL
```
GET /api/admin/reports/export/{reportType}
```

### Available Report Types
- `donation-overview`
- `user-activity`
- `charity-performance`
- `volunteer-efficiency`

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `format` | string | `csv` | Export format (`csv` or `json`) |
| `period` | string | `30d` | Time period (`7d`, `30d`, `90d`, `1y`, `all`) |
| `startDate` | date | - | Custom start date (YYYY-MM-DD) |
| `endDate` | date | - | Custom end date (YYYY-MM-DD) |

---

## 💡 **Usage Examples**

### 1. Download Donation Overview as CSV
```http
GET /api/admin/reports/export/donation-overview?format=csv&period=30d
Authorization: Bearer <admin_token>
```

**Response:** Downloads file `donation-overview-report-2024-01-15.csv`

### 2. Download User Activity as JSON
```http
GET /api/admin/reports/export/user-activity?format=json
Authorization: Bearer <admin_token>
```

**Response:** Downloads file `user-activity-report-2024-01-15.json`

### 3. Custom Date Range Export
```http
GET /api/admin/reports/export/charity-performance?format=csv&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <admin_token>
```

---

## 📊 **CSV Format Examples**

### Donation Overview CSV Structure
```csv
DONATION OVERVIEW SUMMARY
Metric,Value
Total Donations,156
Confirmed Donations,142
Confirmation Rate,91.0%
Average Confirmation Time (Hours),18

STATUS BREAKDOWN
Status,Count
confirmed,142
delivered,8
picked_up,4
assigned,2

TOP CHARITIES
Charity Name,Donation Count
"Food Bank Central",34
"Clothes for All",28

CATEGORY BREAKDOWN
Category,Count
"Food items",67
"Clothing",45
```

### Charity Performance CSV Structure
```csv
CHARITY PERFORMANCE SUMMARY
Metric,Value
Total Charities,15
Average Confirmation Rate,85.2%
Average Response Time (Hours),12.5

CHARITY OVERVIEW
Charity Name,Total Donations,Confirmed Donations,Confirmation Rate (%),Verification Status
"Food Bank Central",34,32,94.1,verified
"Clothes for All",28,25,89.3,verified

RESPONSE TIME ANALYSIS
Charity Name,Average Response Time (Hours),Total Confirmed
"Food Bank Central",8.5,32
"Clothes for All",15.2,25
```

---

## 🖥️ **Frontend Implementation**

### React Download Component
```jsx
import React, { useState } from 'react';

const ReportDownloader = ({ reportType, authToken }) => {
  const [downloading, setDownloading] = useState(false);
  const [format, setFormat] = useState('csv');
  const [period, setPeriod] = useState('30d');

  const downloadReport = async () => {
    setDownloading(true);

    try {
      const params = new URLSearchParams({
        format,
        period
      });

      const response = await fetch(
        `/api/admin/reports/export/${reportType}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          }
        }
      );

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition?.split('filename=')[1]?.replace(/"/g, '')
        || `${reportType}-report.${format}`;

      // Create download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="report-downloader">
      <div className="download-controls">
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="format-selector"
        >
          <option value="csv">CSV Format</option>
          <option value="json">JSON Format</option>
        </select>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="period-selector"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="1y">Last Year</option>
          <option value="all">All Time</option>
        </select>

        <button
          onClick={downloadReport}
          disabled={downloading}
          className="download-button"
        >
          {downloading ? (
            <>
              <span className="spinner"></span>
              Downloading...
            </>
          ) : (
            <>
              📥 Download {format.toUpperCase()}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Usage in admin dashboard
const AdminReportsPage = () => {
  const authToken = useAuthToken(); // Your auth hook

  return (
    <div className="admin-reports">
      <h1>Admin Reports</h1>

      <div className="report-section">
        <h2>📊 Donation Overview</h2>
        <ReportDownloader
          reportType="donation-overview"
          authToken={authToken}
        />
      </div>

      <div className="report-section">
        <h2>👥 User Activity</h2>
        <ReportDownloader
          reportType="user-activity"
          authToken={authToken}
        />
      </div>

      <div className="report-section">
        <h2>🏢 Charity Performance</h2>
        <ReportDownloader
          reportType="charity-performance"
          authToken={authToken}
        />
      </div>

      <div className="report-section">
        <h2>🚛 Volunteer Efficiency</h2>
        <ReportDownloader
          reportType="volunteer-efficiency"
          authToken={authToken}
        />
      </div>
    </div>
  );
};

export default AdminReportsPage;
```

### CSS Styling
```css
.report-downloader {
  margin: 16px 0;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.download-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.format-selector,
.period-selector {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 14px;
}

.download-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.download-button:hover:not(:disabled) {
  background: #2563eb;
}

.download-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.report-section {
  margin-bottom: 32px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.report-section h2 {
  margin: 0 0 16px 0;
  color: #1f2937;
  font-size: 1.25rem;
}
```

---

## 🔧 **Advanced Features**

### 1. **Bulk Export All Reports**
```javascript
const exportAllReports = async () => {
  const reportTypes = [
    'donation-overview',
    'user-activity',
    'charity-performance',
    'volunteer-efficiency'
  ];

  for (const reportType of reportTypes) {
    await downloadReport(reportType, 'csv', '30d');
    // Add delay to prevent server overload
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};
```

### 2. **Custom Date Range Picker**
```jsx
const CustomDateRangeDownloader = ({ reportType, authToken }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [format, setFormat] = useState('csv');

  const downloadCustomReport = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    const params = new URLSearchParams({
      format,
      startDate,
      endDate
    });

    // Download logic here...
  };

  return (
    <div className="custom-date-downloader">
      <div className="date-inputs">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="Start Date"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="End Date"
        />
      </div>

      <select value={format} onChange={(e) => setFormat(e.target.value)}>
        <option value="csv">CSV</option>
        <option value="json">JSON</option>
      </select>

      <button onClick={downloadCustomReport}>
        📅 Download Custom Range
      </button>
    </div>
  );
};
```

### 3. **Scheduled Reports** (Future Enhancement)
```javascript
// Example for implementing scheduled exports
const scheduleReport = async (reportType, frequency, format) => {
  const scheduleData = {
    reportType,
    frequency, // 'daily', 'weekly', 'monthly'
    format,
    email: adminEmail
  };

  await fetch('/api/admin/reports/schedule', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(scheduleData)
  });
};
```

---

## 📧 **Email Export Integration**

For automatic report delivery, you could extend the system:

```javascript
// Backend enhancement for email delivery
export const emailReport = async (req, res) => {
  try {
    const { reportType, format, email } = req.body;

    // Generate report data
    const reportData = await getReportData(reportType);

    // Convert to desired format
    const fileContent = format === 'csv'
      ? convertToCSV(reportData, reportType)
      : JSON.stringify(reportData);

    // Send email with attachment
    await sendEmail({
      to: email,
      subject: `Admin Report: ${reportType}`,
      text: `Please find the attached ${reportType} report.`,
      attachments: [{
        filename: `${reportType}-report-${new Date().toISOString().split('T')[0]}.${format}`,
        content: fileContent,
        contentType: format === 'csv' ? 'text/csv' : 'application/json'
      }]
    });

    res.json({ success: true, message: 'Report emailed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to email report' });
  }
};
```

---

## 🚀 **Testing the Download Feature**

### Using cURL
```bash
# Download CSV report
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -o donation-report.csv \
     "http://localhost:5000/api/admin/reports/export/donation-overview?format=csv&period=30d"

# Download JSON report
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -o user-activity.json \
     "http://localhost:5000/api/admin/reports/export/user-activity?format=json"
```

### Using JavaScript/Fetch
```javascript
const downloadReport = async (reportType, format = 'csv') => {
  try {
    const response = await fetch(
      `/api/admin/reports/export/${reportType}?format=${format}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    if (response.ok) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Download failed:', error);
  }
};
```

---

## 📈 **Business Benefits**

### **For Administrators:**
- **Data Analysis:** Export to Excel for detailed analysis and visualization
- **Reporting:** Share insights with stakeholders and board members
- **Compliance:** Maintain records for auditing and regulatory requirements
- **Backup:** Archive historical data for long-term storage

### **For Decision Making:**
- **Trend Analysis:** Track performance over time
- **Resource Planning:** Identify peak periods and capacity needs
- **Performance Monitoring:** Benchmark against previous periods
- **Issue Identification:** Spot problems early through data patterns

---

## 🎯 **Summary**

✅ **Fully Downloadable:** All 4 admin reports support CSV and JSON export
✅ **Flexible Filtering:** Custom date ranges and predefined periods
✅ **Professional Format:** Well-structured CSV files ready for Excel
✅ **API Integration:** JSON format perfect for automated systems
✅ **Easy Implementation:** Simple frontend integration with examples
✅ **Scalable:** Ready for enhancements like email delivery and scheduling

The downloadable reports feature transforms your admin analytics from view-only to actionable business intelligence tools that can be shared, analyzed, and archived as needed.
