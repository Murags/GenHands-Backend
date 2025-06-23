### Donation Confirmation & Thank You Notes API Examples

This document provides examples for charity donation confirmation and donor thank you note viewing functionality.

---

## Charity Endpoints

### 1. Confirm Donation Delivery and Send Thank You Note

**Endpoint:** `POST /api/donations/:id/confirm`
**Access:** Private/Charity only
**Description:** Allows charities to confirm they received a donation and send a personalized thank you note to the donor.

#### Prerequisites:
- Donation must have status `delivered` (set by volunteer)
- Only the recipient charity can confirm their own donations
- Thank you note is required

#### Sample Request:

```http
POST http://localhost:3000/api/donations/60d5f3f5e7b3c2a4e8f3b0e1/confirm
Headers:
  Authorization: Bearer <charity_auth_token>
  Content-Type: application/json

Body:
{
  "thankYouNote": "Thank you so much for your generous donation of winter clothing! These items arrived just in time for the cold season and will help keep our community members warm. Your kindness and generosity make a real difference in the lives of those we serve. We are incredibly grateful for your support and hope you know how much your donation means to our organization and the people we help."
}
```

#### Sample Response (Success):

```json
{
  "success": true,
  "message": "Donation confirmed and thank you note sent to donor.",
  "data": {
    "_id": "60d5f3f5e7b3c2a4e8f3b0e1",
    "status": "confirmed",
    "thankYouNote": "Thank you so much for your generous donation of winter clothing! These items arrived just in time for the cold season and will help keep our community members warm. Your kindness and generosity make a real difference in the lives of those we serve. We are incredibly grateful for your support and hope you know how much your donation means to our organization and the people we help.",
    "confirmedAt": "2023-10-27T15:30:00.000Z"
  }
}
```

#### Error Responses:

**400 - Missing Thank You Note:**
```json
{
  "success": false,
  "message": "Thank you note is required."
}
```

**400 - Wrong Status:**
```json
{
  "success": false,
  "message": "This donation cannot be confirmed yet. Its current status is 'picked_up'. It must be 'delivered' first."
}
```

**400 - Already Confirmed:**
```json
{
  "success": false,
  "message": "This donation has already been confirmed."
}
```

**403 - Unauthorized:**
```json
{
  "success": false,
  "message": "You are not authorized to confirm this donation."
}
```

**404 - Not Found:**
```json
{
  "success": false,
  "message": "Donation not found."
}
```

---

## Donor Endpoints

### 2. View Donation History with Thank You Notes

**Endpoint:** `GET /api/donations/my-donations`
**Access:** Private/Donor only
**Description:** Allows donors to view their donation history, including thank you notes from charities for confirmed donations.

#### Sample Request:

```http
GET http://localhost:3000/api/donations/my-donations
Headers:
  Authorization: Bearer <donor_auth_token>
```

#### Sample Response (Success):

```json
{
  "success": true,
  "donations": [
    {
      "id": "DON-1698412800000",
      "donorName": "John Doe",
      "donorEmail": "john.doe@example.com",
      "donorPhone": "+1234567890",
      "organizationName": null,
      "organizationType": "individual",
      "pickupAddress": "123 Main St, Anytown, USA",
      "accessNotes": "Ring doorbell, items in garage",
      "donationItems": [
        {
          "category": "60d5f3f5e7b3c2a4e8f3b0c1",
          "description": "Winter jackets and coats",
          "quantity": "5 boxes",
          "condition": "good"
        },
        {
          "category": "60d5f3f5e7b3c2a4e8f3b0c2",
          "description": "Canned food items",
          "quantity": "2 boxes",
          "condition": "new"
        }
      ],
      "totalWeight": "25 kg",
      "requiresRefrigeration": false,
      "fragileItems": false,
      "deliveryInstructions": "Please deliver during business hours",
      "availabilityType": "flexible",
      "urgencyLevel": "high",
      "additionalNotes": "Items are sorted and ready for pickup",
      "photoConsent": true,
      "contactPreference": "phone",
      "status": "confirmed",
      "charityName": "Local Food Bank",
      "thankYouNote": "Thank you so much for your generous donation of winter clothing! These items arrived just in time for the cold season and will help keep our community members warm. Your kindness and generosity make a real difference in the lives of those we serve. We are incredibly grateful for your support and hope you know how much your donation means to our organization and the people we help.",
      "confirmedAt": "2023-10-27T15:30:00.000Z",
      "createdAt": "2023-10-27T10:00:00.000Z"
    },
    {
      "id": "DON-1698326400000",
      "donorName": "John Doe",
      "donorEmail": "john.doe@example.com",
      "donorPhone": "+1234567890",
      "organizationName": null,
      "organizationType": "individual",
      "pickupAddress": "123 Main St, Anytown, USA",
      "accessNotes": "Items by front door",
      "donationItems": [
        {
          "category": "60d5f3f5e7b3c2a4e8f3b0c3",
          "description": "Children's books",
          "quantity": "1 box",
          "condition": "good"
        }
      ],
      "totalWeight": "5 kg",
      "requiresRefrigeration": false,
      "fragileItems": false,
      "deliveryInstructions": "Standard delivery",
      "availabilityType": "flexible",
      "urgencyLevel": "medium",
      "additionalNotes": "",
      "photoConsent": false,
      "contactPreference": "email",
      "status": "delivered",
      "charityName": "City Library Foundation",
      "createdAt": "2023-10-26T14:00:00.000Z"
    }
  ]
}
```

#### Key Points for Frontend Implementation:

1. **Thank You Notes**: Only appear when `status` is `confirmed` and `thankYouNote` field is present
2. **Confirmation Date**: `confirmedAt` field shows when the charity confirmed receipt
3. **Charity Name**: `charityName` field shows which charity received the donation
4. **Status Tracking**: Use `status` field to show donation progress:
   - `submitted` → `assigned` → `picked_up` → `delivered` → `confirmed`

#### Frontend Display Suggestions:

```javascript
// Example of how to display thank you notes in your frontend
donations.map(donation => {
  if (donation.status === 'confirmed' && donation.thankYouNote) {
    return (
      <div className="donation-card confirmed">
        <h3>Donation to {donation.charityName}</h3>
        <p>Status: <span className="status-confirmed">Confirmed</span></p>
        <p>Confirmed on: {new Date(donation.confirmedAt).toLocaleDateString()}</p>

        <div className="thank-you-section">
          <h4>💝 Thank You Message:</h4>
          <blockquote className="thank-you-note">
            {donation.thankYouNote}
          </blockquote>
        </div>

        {/* Other donation details */}
      </div>
    );
  }
  // Handle other statuses...
});
```

---

## Email Notification

When a charity confirms a donation, the donor automatically receives an email with:
- Personalized greeting
- Confirmation that items were received
- The charity's thank you message
- Professional styling and branding

The email is sent in the background and doesn't affect the API response timing.
