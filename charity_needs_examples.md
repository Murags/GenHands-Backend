## Charity Needs API Examples

Here are the sample requests for the Charity Needs CRUD endpoints.

---

### 1. Create or Update a Charity's Needs List

Use this request to set or completely overwrite a charity's list of needed items.

**Endpoint:**
`PUT http://localhost:3000/api/charity/needs`

**Headers:**
```
Authorization: Bearer <your_charity_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "neededCategories": [
    "60d5f3f5e7b3c2a4e8f3b0e1",
    "60d5f3f5e7b3c2a4e8f3b0e2"
  ],
  "needsStatement": "We are preparing for the winter and are in urgent need of non-perishable food and warm clothing for all ages. Your support is greatly appreciated!"
}
```

---

### 2. Get a Charity's Needs List

This request retrieves the needs you've set. It does not require a request body.

**Endpoint:**
`GET http://localhost:3000/api/charity/needs`

**Headers:**
```
Authorization: Bearer <your_charity_jwt_token>
```

---

### 3. Clear a Charity's Needs List

Use this request to remove all items from the needs list. It does not require a request body.

**Endpoint:**
`DELETE http://localhost:3000/api/charity/needs`

**Headers:**
```
Authorization: Bearer <your_charity_jwt_token>
```
