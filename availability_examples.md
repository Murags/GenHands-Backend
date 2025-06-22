# Volunteer Availability API Examples

## Endpoint
`POST /api/availability`

## Headers
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

---

## 1. Recurring Weekly Schedule
For volunteers who are available on the same days/times each week:

```json
{
  "type": "recurring_weekly",
  "recurringSchedule": [
    {
      "dayOfWeek": 1,
      "timeSlots": [
        { "startTime": "09:00", "endTime": "17:00" }
      ]
    },
    {
      "dayOfWeek": 3,
      "timeSlots": [
        { "startTime": "14:00", "endTime": "18:00" }
      ]
    },
    {
      "dayOfWeek": 6,
      "timeSlots": [
        { "startTime": "08:00", "endTime": "12:00" },
        { "startTime": "14:00", "endTime": "17:00" }
      ]
    }
  ],
  "serviceArea": {
    "center": {
      "coordinates": [36.8219, -1.2921]
    },
    "maxRadius": 15
  },
  "preferences": {
    "maxPickupsPerDay": 2,
    "transportationMode": "car"
  },
  "notes": "Available for pickups in Nairobi area"
}
```

---

## 2. Specific Dates Only
For volunteers available on specific individual dates:

```json
{
  "type": "specific_dates",
  "specificDates": [
    {
      "date": "2024-12-25",
      "timeSlots": [
        { "startTime": "10:00", "endTime": "14:00" }
      ]
    },
    {
      "date": "2024-12-31",
      "timeSlots": [
        { "startTime": "09:00", "endTime": "12:00" }
      ]
    },
    {
      "date": "2025-01-01",
      "timeSlots": [
        { "startTime": "15:00", "endTime": "18:00" }
      ]
    }
  ],
  "serviceArea": {
    "center": {
      "coordinates": [36.8219, -1.2921]
    },
    "maxRadius": 20
  },
  "preferences": {
    "maxPickupsPerDay": 1,
    "transportationMode": "car"
  }
}
```

---

## 3. Date Range with Specific Days
For volunteers available during a date range but only on certain days of the week:

```json
{
  "type": "date_range",
  "dateRange": {
    "startDate": "2024-11-01",
    "endDate": "2024-11-30",
    "daysOfWeek": [1, 2, 3, 4, 5],
    "timeSlots": [
      { "startTime": "17:00", "endTime": "20:00" }
    ]
  },
  "serviceArea": {
    "center": {
      "coordinates": [36.8219, -1.2921]
    },
    "maxRadius": 25
  },
  "preferences": {
    "maxPickupsPerDay": 3,
    "transportationMode": "motorcycle"
  },
  "notes": "Available weekdays after work"
}
```

---

## 4. Always Available (With Time Constraints)
For volunteers who are generally available with some time restrictions:

```json
{
  "type": "always_available",
  "generalTimeSlots": [
    { "startTime": "08:00", "endTime": "22:00" }
  ],
  "serviceArea": {
    "center": {
      "coordinates": [36.8219, -1.2921]
    },
    "maxRadius": 30
  },
  "preferences": {
    "maxPickupsPerDay": 5,
    "transportationMode": "car"
  },
  "notes": "Available most days, flexible schedule"
}
```

---

## 5. Always Available (24/7)
For volunteers available anytime:

```json
{
  "type": "always_available",
  "serviceArea": {
    "center": {
      "coordinates": [36.8219, -1.2921]
    },
    "maxRadius": 50
  },
  "preferences": {
    "maxPickupsPerDay": 10,
    "transportationMode": "car"
  }
}
```

---

## Field Reference

### Required Fields
- **`type`**: One of `"recurring_weekly"`, `"specific_dates"`, `"date_range"`, `"always_available"`

### Day of Week Values
- 0 = Sunday
- 1 = Monday
- 2 = Tuesday
- 3 = Wednesday
- 4 = Thursday
- 5 = Friday
- 6 = Saturday

### Transportation Modes
- `"car"`
- `"bicycle"`
- `"motorcycle"`
- `"public_transport"`
- `"walking"`
- `"other"`

### Service Area
- **`coordinates`**: `[longitude, latitude]` format
- **`maxRadius`**: Distance in kilometers (1-100)

### Time Format
- Use 24-hour format: `"HH:MM"` (e.g., `"09:00"`, `"17:30"`)

### Date Format
- Use ISO date format: `"YYYY-MM-DD"` (e.g., `"2024-12-25"`)

---

## Additional Endpoints

### Get My Availability
```
GET /api/availability/my
Authorization: Bearer <your_jwt_token>
```

### Delete My Availability
```
DELETE /api/availability
Authorization: Bearer <your_jwt_token>
```

### Add Temporary Unavailability
```
POST /api/availability/unavailable
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "startDate": "2024-11-15",
  "endDate": "2024-11-20",
  "reason": "Out of town for vacation"
}
```

### Check Availability at Specific Time
```
POST /api/availability/check
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "dateTime": "2024-11-25T14:30:00Z"
}
```
