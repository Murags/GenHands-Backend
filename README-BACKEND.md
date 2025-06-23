# Generous Hands Backend API

Complete backend implementation for the Generous Hands donation platform with REST API endpoints.

## Features

✅ **Donation Submission System** - Complete donation form processing with geocoding
✅ **Volunteer Dashboard API** - Pickup request management for volunteers
✅ **Free Geocoding** - OpenStreetMap integration (no API keys required)
✅ **Location-based Queries** - Find nearby pickup requests
✅ **Status Tracking** - Complete pickup lifecycle management
✅ **API Documentation** - Swagger/OpenAPI integration

## Quick Start

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Setup**
Create a `.env` file in the root directory:
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/genhands-db

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=30d
```

3. **Start the Server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

4. **Access API Documentation**
Visit `http://localhost:5000/api-docs` for interactive API documentation.

## API Endpoints

### Donation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/donations` | Submit a new donation |
| `GET` | `/api/donations/:id` | Get donation details |
| `GET` | `/api/donations/search-addresses` | Search address suggestions |

### Pickup Request Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/donations/pickup-requests` | Get available pickup requests |
| `PATCH` | `/api/donations/pickup-requests/:id/status` | Update pickup status |

### Example: Submit Donation

```javascript
const donationData = {
  // Donor Information
  donorName: "John Doe",
  donorPhone: "+254 712 345 678",
  donorEmail: "john@example.com",
  organizationType: "individual",

  // Pickup Details
  pickupAddress: "123 Main Street, Nairobi",
  accessNotes: "Gate code: 1234",

  // Donation Items
  donationItems: [
    {
      category: "Food items",
      description: "Rice, beans, cooking oil",
      quantity: "5 bags",
      condition: "good"
    }
  ],

  // Delivery Details
  deliveryAddress: "Kibera Community Center",
  preferredCharity: "Nairobi Food Bank",
  urgencyLevel: "medium",
  additionalNotes: "Available weekdays 9-5"
};

const response = await fetch('/api/donations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(donationData)
});

const result = await response.json();
console.log('Donation submitted:', result.submissionId);
```

### Example: Get Pickup Requests (for volunteers)

```javascript
// Get pickup requests near volunteer location
const response = await fetch(
  '/api/donations/pickup-requests?lat=-1.2921&lng=36.8219&radius=25&status=available'
);

const data = await response.json();
console.log('Available pickups:', data.requests);
```

### Example: Update Pickup Status

```javascript
// Update pickup status (requires authentication)
const response = await fetch('/api/donations/pickup-requests/DON-1704123456789/status', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
  },
  body: JSON.stringify({
    status: 'accepted',
    volunteerId: 'VOL-123',
    notes: 'On my way to pickup location'
  })
});

const result = await response.json();
console.log('Status updated:', result);
```

## Database Models

### Donation Model
- Complete donor information
- Pickup and delivery addresses with coordinates
- Donation items with categories and conditions
- Scheduling and urgency preferences
- Contact preferences and additional notes

### PickupRequest Model
- Links to donation record
- Volunteer assignment
- Status tracking through pickup lifecycle
- Distance and time calculations
- Metadata for additional context

## Geocoding Integration

Uses **OpenStreetMap Nominatim API** - completely free, no API keys required:

```javascript
// Address to coordinates
const result = await geocodeAddress("123 Main Street, Nairobi");
console.log(result.coordinates); // [-1.2921, 36.8219]

// Address search/autocomplete
const suggestions = await searchAddresses("Nairobi", 5);
console.log(suggestions); // Array of address suggestions
```

## Status Lifecycle

```
AVAILABLE → ACCEPTED → EN_ROUTE_PICKUP → ARRIVED_PICKUP →
PICKED_UP → EN_ROUTE_DELIVERY → DELIVERED
```

Each status change:
- Updates database records
- Returns updated status in API response
- Can be polled by frontend for updates

## Security Features

- JWT-based authentication for volunteers
- Request validation and sanitization
- Input validation for all endpoints
- CORS configuration for frontend integration

## Development

### Project Structure
```
src/
├── controllers/     # Route handlers
├── models/         # Database schemas
├── routes/         # API routes
├── middleware/     # Auth & validation
├── utils/          # Geocoding & helpers
└── config/         # Database connection
```

### Testing the API

1. **Health Check**: `GET /health`
2. **API Docs**: `GET /api-docs`
3. **Submit Test Donation**: Use Swagger UI or Postman
4. **Check Pickup Requests**: Verify data flow

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/genhands-db` |
| `PORT` | Server port | `5000` |
| `JWT_SECRET` | JWT signing secret | Required |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `NODE_ENV` | Environment mode | `development` |

## Production Deployment

1. **Environment Setup**
   - Set production environment variables
   - Use MongoDB Atlas for database
   - Configure JWT secret

2. **Performance Optimizations**
   - Enable database indexes
   - Set up Redis for caching (optional)
   - Configure rate limiting

3. **Monitoring**
   - Health check endpoint: `/health`
   - Database connection status

## Integration with Frontend

This backend supports the donation flow described in `DonationGuide.md`:

1. **Donation Page** (`/donate`) → POST `/api/donations`
2. **Volunteer Dashboard** (`/volunteer`) → GET `/api/donations/pickup-requests`
3. **Status Updates** → PATCH `/api/donations/pickup-requests/:id/status`
4. **Address Autocomplete** → GET `/api/donations/search-addresses`

The API is designed to work seamlessly with React, Vue, or any modern frontend framework.

## Future Enhancements

- **Real-time Notifications**: Add Socket.IO for live updates
- **Push Notifications**: SMS/Email notifications for donors and volunteers
- **Advanced Routing**: Optimize pickup routes for volunteers
- **Analytics Dashboard**: Track donation metrics and volunteer performance

## Support

- API Documentation: `http://localhost:5000/api-docs`
- Health Status: `http://localhost:5000/health`

For issues or questions, check the Swagger documentation for detailed API specifications.
