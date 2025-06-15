# Donation Creation Request Examples

This document provides examples of how to structure a request to create a new donation via the `/api/donations` endpoint.

## Endpoint

`POST /api/donations`

## Headers

`Content-Type: application/json`

## Body Schema

The request body should be a JSON object with the following structure:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `donorName` | string | Yes | Name of the donor. |
| `donorPhone` | string | Yes | Phone number of the donor. |
| `pickupAddress` | string | Yes | The full address for donation pickup. |
| `donationItems` | array | Yes | An array of items being donated. See `DonationItem` schema. |
| `deliveryAddress` | string | Yes | The full address for donation delivery. |
| `preferredCharity` | string | Yes | The name of the preferred charity. |
| `donorEmail` | string | No | Email of the donor. |
| `organizationName` | string | No | Name of the organization if applicable. |
| `organizationType` | string | No | Type of organization. Enum: `individual`, `business`, `organization`, `school`, `restaurant`. |
| `accessNotes` | string | No | Any notes regarding accessing the pickup location. |
| `totalWeight` | string | No | Estimated total weight of the donation. |
| `requiresRefrigeration`| boolean | No | Whether the donation requires refrigeration. |
| `fragileItems` | boolean | No | Whether the donation contains fragile items. |
| `deliveryInstructions` | string | No | Any specific instructions for the delivery. |
| `availabilityType` | string | No | Donor's availability. Enum: `flexible`, `specific`, `urgent`. |
| `preferredDate` | string | No | Preferred pickup date (format: YYYY-MM-DD). |
| `preferredTimeStart` | string | No | Preferred pickup time start (format: HH:MM). |
| `preferredTimeEnd` | string | No | Preferred pickup time end (format: HH:MM). |
| `urgencyLevel` | string | No | Urgency of the pickup. Enum: `low`, `medium`, `high`. |
| `additionalNotes` | string | No | Any other relevant notes. |
| `photoConsent` | boolean | No | Consent to take photos of the donation. |
| `contactPreference` | string | No | Preferred method of contact. Enum: `phone`, `email`, `sms`. |

### DonationItem Schema

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `category` | string | Yes | Category of the item. Enum: `Food items`, `Clothing`, `Electronics`, `Books`, `Toys`, `Furniture`, `Medical supplies`, `Household items`, `Other`. |
| `description` | string | Yes | A brief description of the item. |
| `quantity` | string | Yes | The quantity of the item (e.g., "1 box", "5 items"). |
| `condition` | string | Yes | The condition of the item. Enum: `new`, `good`, `fair`, `poor`. |

---

## Example Requests

### Example 1: Basic Donation

This example includes only the required fields for a successful donation submission.

```json
{
  "donorName": "John Doe",
  "donorPhone": "123-456-7890",
  "pickupAddress": "123 Main St, Anytown, USA 12345",
  "deliveryAddress": "456 Oak Ave, Charityville, USA 54321",
  "preferredCharity": "Anytown Community Shelter",
  "donationItems": [
    {
      "category": "Clothing",
      "description": "Men's winter jackets",
      "quantity": "2 large bags",
      "condition": "good"
    },
    {
      "category": "Books",
      "description": "Children's story books",
      "quantity": "1 box",
      "condition": "new"
    }
  ]
}
```

### Example 2: Detailed Donation from an Organization

This example showcases a more detailed donation from a business, including optional fields.

```json
{
  "donorName": "Jane Smith",
  "donorPhone": "098-765-4321",
  "donorEmail": "jane.smith@example.com",
  "organizationName": "Smith & Co.",
  "organizationType": "business",
  "pickupAddress": "789 Business Park, Suite 100, Workcity, USA 67890",
  "accessNotes": "Please use the loading dock at the back of the building. Ring bell for assistance.",
  "donationItems": [
    {
      "category": "Furniture",
      "description": "Office chairs",
      "quantity": "5",
      "condition": "good"
    },
    {
      "category": "Electronics",
      "description": "Computer monitors",
      "quantity": "5",
      "condition": "fair"
    }
  ],
  "totalWeight": "150 lbs",
  "requiresRefrigeration": false,
  "fragileItems": true,
  "deliveryAddress": "101 Help St, Charityville, USA 54321",
  "preferredCharity": "Goodwill",
  "deliveryInstructions": "Deliver to the main warehouse entrance.",
  "availabilityType": "specific",
  "preferredDate": "2024-08-15",
  "preferredTimeStart": "10:00",
  "preferredTimeEnd": "14:00",
  "urgencyLevel": "medium",
  "additionalNotes": "Items are packed and ready for pickup.",
  "photoConsent": true,
  "contactPreference": "email"
}
```

### Example 3: Urgent Food Donation

This example demonstrates an urgent donation of perishable food items.

```json
{
  "donorName": "Local Restaurant",
  "donorPhone": "555-123-9876",
  "organizationType": "restaurant",
  "pickupAddress": "321 Eatery Lane, Foodville, USA 11223",
  "donationItems": [
    {
      "category": "Food items",
      "description": "Prepared meals (sandwiches, salads)",
      "quantity": "3 large trays",
      "condition": "new"
    }
  ],
  "requiresRefrigeration": true,
  "deliveryAddress": "999 Soup Kitchen Rd, Charityville, USA 54321",
  "preferredCharity": "City Soup Kitchen",
  "availabilityType": "urgent",
  "urgencyLevel": "high",
  "contactPreference": "phone"
}
```
