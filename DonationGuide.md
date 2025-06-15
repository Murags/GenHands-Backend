# Donation Submission & Volunteer Dashboard Integration

This document explains how the donation submission system integrates with the volunteer dashboard to create a complete charity pickup flow.

## System Overview

The system consists of two main user interfaces:

1. **Donation Submission Page** (`/donate`) - Where donors submit their donation requests
2. **Volunteer Dashboard** (`/volunteer`) - Where volunteers view and manage pickup requests

## Data Flow

```
Donor submits donation → API processes submission → Pickup request created → Volunteers notified → Volunteer accepts → Pickup & delivery completed
```

## Integration Points

### 1. Donation Submission to Pickup Request Transformation

When a donor submits a donation through the form, the data is transformed into a pickup request format that volunteers can see and accept.

**Donation Form Data:**
```javascript
{
  // Donor Information
  donorName: "John Doe",
  donorPhone: "+254 712 345 678",
  donorEmail: "john@example.com",
  organizationType: "individual",

  // Pickup Location
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

  // Delivery & Scheduling
  deliveryAddress: "Kibera Community Center",
  preferredCharity: "Nairobi Food Bank",
  urgencyLevel: "medium",

  // ... other fields
}
```

**Transformed to Pickup Request:**
```javascript
{
  id: "DON-1704123456789",
  charity: "Nairobi Food Bank",
  address: "123 Main Street, Nairobi",
  coordinates: [-1.2921, 36.8219],
  items: ["Rice, beans, cooking oil (5 bags)"],
  contactPerson: "John Doe",
  phone: "+254 712 345 678",
  priority: "medium",
  status: "available",
  deliveryAddress: "Kibera Community Center",
  distance: "2.5 km", // Calculated from volunteer location
  estimatedTime: "10 min" // Calculated travel time
}
```

### 2. Volunteer Dashboard Integration

The volunteer dashboard displays pickup requests with:

- **Priority-based sorting** (high, medium, low)
- **Distance-based filtering** (nearby vs all requests)
- **Real-time status updates** (available → accepted → in progress → completed)
- **Interactive map** showing pickup and delivery locations
- **Contact integration** for communicating with donors

### 3. Status Lifecycle

```
AVAILABLE → ACCEPTED → EN_ROUTE_PICKUP → ARRIVED_PICKUP → PICKED_UP → EN_ROUTE_DELIVERY → DELIVERED
```

Each status change triggers:
- Database updates
- Notifications to relevant parties
- UI updates in both donor and volunteer interfaces

## API Endpoints Required

### Donation Submission

**POST /api/donations**
```javascript
// Request Body
{
  donation: {
    // Full donation form data
  },
  pickupRequest: {
    // Transformed pickup request data
  }
}

// Response
{
  success: true,
  submissionId: "DON-1704123456789",
  message: "Donation submitted successfully"
}
```

### Volunteer Pickup Requests

**GET /api/pickup-requests**
```javascript
// Query Parameters
?lat=-1.2921&lng=36.8219&radius=50&status=available

// Response
[
  {
    id: "DON-1704123456789",
    charity: "Nairobi Food Bank",
    address: "123 Main Street, Nairobi",
    coordinates: [-1.2921, 36.8219],
    items: ["Rice, beans, cooking oil (5 bags)"],
    contactPerson: "John Doe",
    phone: "+254 712 345 678",
    priority: "medium",
    status: "available",
    deliveryAddress: "Kibera Community Center",
    metadata: {
      // Additional details for volunteers
      accessNotes: "Gate code: 1234",
      totalWeight: "25 kg",
      requiresRefrigeration: false,
      fragileItems: false,
      contactPreference: "phone",
      additionalNotes: "Available weekdays 9-5",
      submittedAt: "2024-01-01T10:00:00Z"
    }
  }
]
```

### Status Updates

**PATCH /api/pickup-requests/{id}/status**
```javascript
// Request Body
{
  status: "accepted",
  volunteerId: "VOL-123",
  timestamp: "2024-01-01T10:30:00Z"
}

// Response
{
  success: true,
  updatedRequest: {
    // Updated pickup request with new status
  }
}
```

## Database Schema

### Donations Table
```sql
CREATE TABLE donations (
  id VARCHAR(50) PRIMARY KEY,
  donor_name VARCHAR(255) NOT NULL,
  donor_phone VARCHAR(20) NOT NULL,
  donor_email VARCHAR(255),
  organization_name VARCHAR(255),
  organization_type ENUM('individual', 'business', 'organization', 'school', 'restaurant'),
  pickup_address TEXT NOT NULL,
  pickup_coordinates POINT,
  access_notes TEXT,
  donation_items JSON NOT NULL,
  total_weight VARCHAR(50),
  requires_refrigeration BOOLEAN DEFAULT FALSE,
  fragile_items BOOLEAN DEFAULT FALSE,
  delivery_address TEXT NOT NULL,
  preferred_charity VARCHAR(255) NOT NULL,
  delivery_instructions TEXT,
  availability_type ENUM('flexible', 'specific', 'urgent') DEFAULT 'flexible',
  preferred_date DATE,
  preferred_time_start TIME,
  preferred_time_end TIME,
  urgency_level ENUM('low', 'medium', 'high') DEFAULT 'medium',
  additional_notes TEXT,
  photo_consent BOOLEAN DEFAULT FALSE,
  contact_preference ENUM('phone', 'email', 'sms') DEFAULT 'phone',
  status ENUM('submitted', 'assigned', 'picked_up', 'delivered', 'cancelled') DEFAULT 'submitted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Pickup Requests Table
```sql
CREATE TABLE pickup_requests (
  id VARCHAR(50) PRIMARY KEY,
  donation_id VARCHAR(50) NOT NULL,
  volunteer_id VARCHAR(50),
  charity_name VARCHAR(255) NOT NULL,
  pickup_address TEXT NOT NULL,
  pickup_coordinates POINT NOT NULL,
  delivery_address TEXT NOT NULL,
  contact_person VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  contact_email VARCHAR(255),
  items JSON NOT NULL,
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  status ENUM('available', 'accepted', 'en_route_pickup', 'arrived_pickup', 'picked_up', 'en_route_delivery', 'delivered', 'cancelled') DEFAULT 'available',
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (donation_id) REFERENCES donations(id),
  INDEX idx_status_priority (status, priority),
  SPATIAL INDEX idx_coordinates (pickup_coordinates)
);
```

### Volunteers Table
```sql
CREATE TABLE volunteers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  current_location POINT,
  is_available BOOLEAN DEFAULT TRUE,
  max_distance_km INT DEFAULT 25,
  rating DECIMAL(3,2) DEFAULT 5.00,
  completed_pickups INT DEFAULT 0,
  total_requests INT DEFAULT 0,
  availability_schedule JSON,
  notification_preferences JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  SPATIAL INDEX idx_location (current_location)
);
```

## Notification System

### Real-time Notifications

1. **New Donation Submitted**
   - Notify volunteers within specified radius
   - Send push notifications, SMS, or email based on preferences

2. **Pickup Accepted**
   - Notify donor that volunteer is assigned
   - Provide volunteer contact information

3. **Status Updates**
   - Real-time updates to both donor and volunteer
   - Estimated arrival times and completion notifications

### Implementation with WebSockets

```javascript
// Server-side (Node.js with Socket.io)
io.on('connection', (socket) => {
  socket.on('volunteer-location-update', (data) => {
    // Update volunteer location
    // Check for nearby new donations
    // Send notifications for relevant pickups
  });

  socket.on('pickup-status-update', (data) => {
    // Update pickup status
    // Notify relevant parties
    io.to(`donation-${data.donationId}`).emit('status-update', data);
  });
});

// Client-side (React)
useEffect(() => {
  const socket = io();

  socket.on('new-pickup-available', (pickup) => {
    // Update volunteer dashboard with new pickup
    setPickupRequests(prev => [...prev, pickup]);
  });

  socket.on('status-update', (update) => {
    // Update pickup status in real-time
    updatePickupStatus(update.pickupId, update.status);
  });

  return () => socket.disconnect();
}, []);
```

## Geocoding Integration

For accurate distance calculations and mapping using **completely free services**:

### OpenStreetMap Nominatim API (Free)

```javascript
// Using OpenStreetMap Nominatim API - completely free, no API key required
const geocodeAddress = async (address) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=ke`,
    {
      headers: {
        'User-Agent': 'GenHands-Charity-App/1.0' // Required by Nominatim
      }
    }
  );
  const data = await response.json();

  if (data.length > 0) {
    const result = data[0];
    return {
      coordinates: [parseFloat(result.lat), parseFloat(result.lon)],
      formattedAddress: result.display_name,
      confidence: result.importance || 0.5
    };
  }

  throw new Error('Address not found');
};

// Process donation submission with free geocoding
const processDonation = async (donationData) => {
  // Geocode pickup address using free OpenStreetMap service
  const pickupCoordinates = await geocodeAddress(donationData.pickupAddress);

  // Geocode delivery address
  const deliveryCoordinates = await geocodeAddress(donationData.deliveryAddress);

  // Create pickup request with coordinates
  const pickupRequest = {
    ...donationData,
    pickupCoordinates: pickupCoordinates.coordinates,
    deliveryCoordinates: deliveryCoordinates.coordinates
  };

  return pickupRequest;
};
```

### Free Mapping Alternatives

1. **OpenStreetMap with Leaflet** (Already implemented in your app)
   - Completely free
   - No API keys required
   - Great community support

2. **Address Autocomplete** (Implemented)
   - Uses OpenStreetMap Nominatim
   - Real-time address suggestions
   - No costs or limits

3. **Distance Calculations** (Implemented)
   - Haversine formula for accurate distances
   - No external API calls needed
   - Works offline

### Optional: OpenRouteService (Free with API Key)

For advanced routing (optional upgrade):

```javascript
// Free routing service - sign up at openrouteservice.org for free API key
const getRoute = async (startCoords, endCoords, apiKey) => {
  const response = await fetch(
    `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${startCoords[1]},${startCoords[0]}&end=${endCoords[1]},${endCoords[0]}`
  );

  const data = await response.json();

  return {
    coordinates: data.features[0].geometry.coordinates,
    distance: data.features[0].properties.segments[0].distance / 1000, // Convert to km
    duration: data.features[0].properties.segments[0].duration / 60 // Convert to minutes
  };
};
```

### Benefits of Free Alternatives

✅ **No API costs** - Save money on mapping services
✅ **No API key management** - Simpler deployment
✅ **No usage limits** - Scale without worrying about quotas
✅ **Privacy-friendly** - No tracking by big tech companies
✅ **Open source** - Community-driven and transparent
✅ **Kenya-focused** - Good coverage for Kenyan addresses

## Testing the Integration

### 1. Submit a Donation
1. Navigate to `/donate`
2. Fill out the donation form with test data
3. Submit the form
4. Verify the success message appears

### 2. View in Volunteer Dashboard
1. Navigate to `/volunteer`
2. Check that the submitted donation appears in the pickup requests list
3. Verify the priority, distance, and item details are correct
4. Test accepting the pickup request

### 3. Test Status Flow
1. Accept a pickup request
2. Update status through the flow (en route → arrived → picked up → delivered)
3. Verify status updates appear in real-time
4. Check that completed pickups update volunteer stats

## Security Considerations

1. **Data Validation**
   - Validate all form inputs on both client and server
   - Sanitize addresses and contact information
   - Verify phone number formats

2. **Privacy Protection**
   - Don't expose full donor addresses to volunteers until pickup is accepted
   - Implement contact masking for initial communications
   - Allow donors to opt out of photo documentation

3. **Volunteer Verification**
   - Implement volunteer background checks
   - Require identity verification before allowing pickups
   - Track volunteer ratings and feedback

## Performance Optimization

1. **Database Indexing**
   - Spatial indexes on coordinates for location-based queries
   - Composite indexes on status and priority
   - Proper indexing on foreign keys

2. **Caching Strategy**
   - Cache frequently accessed pickup requests
   - Use Redis for real-time data
   - Implement CDN for static assets

3. **API Rate Limiting**
   - Limit donation submissions per IP/user
   - Throttle location updates from volunteers
   - Implement proper error handling and retries

This integration creates a seamless flow from donation submission to volunteer pickup, ensuring efficient coordination and real-time communication between all parties involved.
