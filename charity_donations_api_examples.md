### `GET /api/donations/charity` - Sample Requests & Responses

This document provides examples for using the filterable endpoint for charities to retrieve their donations.

---

### 1. Basic Request: Fetching Latest Donations (Page 1)

This is how you'd fetch the first 10 most recent donations without any filters.

**Request:**

```http
GET http://localhost:3000/api/donations/charity
Headers:
  Authorization: Bearer <your_charity_auth_token>
```

**Response (Success with data):**

```json
{
    "success": true,
    "count": 10,
    "total": 127,
    "pages": 13,
    "data": [
        {
            "_id": "60d5f3f5e7b3c2a4e8f3b0e1",
            "status": "delivered",
            "urgencyLevel": "high",
            "donorName": "John Doe",
            "createdAt": "2023-10-27T12:00:00.000Z",
            "donorId": {
                "_id": "60d5f3f5e7b3c2a4e8f3b0d1",
                "name": "John Doe",
                "email": "john.doe@example.com"
            },
            "donationItems": [
                {
                    "category": {
                        "_id": "5f8f8f8f8f8f8f8f8f8f8f8f",
                        "name": "Clothing"
                    },
                    "description": "Winter jackets",
                    "quantity": "5 boxes",
                    "condition": "good",
                    "_id": "60d5f3f5e7b3c2a4e8f3b0e2"
                }
            ]
        }
    ]
}
```

---

### 2. Filtering by Status and Urgency

Here's how to find all "submitted" donations with "high" urgency.

**Request:**

```http
GET http://localhost:3000/api/donations/charity?status=submitted&urgency=high
Headers:
  Authorization: Bearer <your_charity_auth_token>
```

**Response:**

```json
{
    "success": true,
    "count": 4,
    "total": 4,
    "pages": 1,
    "data": []
}
```

---

### 3. Filtering by Date Range and Searching by Donor Name

Find donations from a donor named "Jane" within a specific week in October.

**Request:**

```http
GET http://localhost:3000/api/donations/charity?startDate=2023-10-01&endDate=2023-10-07&donorName=Jane
Headers:
  Authorization: Bearer <your_charity_auth_token>
```

**Response:**

```json
{
    "success": true,
    "count": 2,
    "total": 2,
    "pages": 1,
    "data": []
}
```

---

### 4. Filtering by Category and Using Pagination

Get the second page of donations containing "Food" items, with 5 items per page.

**Request:**

```http
GET http://localhost:3000/api/donations/charity?category=Food&page=2&limit=5
Headers:
  Authorization: Bearer <your_charity_auth_token>
```

**Response:**

```json
{
    "success": true,
    "count": 5,
    "total": 22,
    "pages": 5,
    "data": []
}
```

---

### 5. No Results Found

This is the response you'll get when the filters don't match any donations. The status code will still be `200 OK`.

**Request:**

```http
GET http://localhost:3000/api/donations/charity?status=cancelled&donorName=NonExistentDonor
Headers:
  Authorization: Bearer <your_charity_auth_token>
```

**Response (Success with no data):**

```json
{
    "success": true,
    "count": 0,
    "total": 0,
    "pages": 0,
    "data": []
}
```
