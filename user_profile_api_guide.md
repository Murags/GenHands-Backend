# User Profile API Guide - `/me` Endpoint

## 📋 Overview

The `/me` endpoint provides a secure way to retrieve the current logged-in user's complete profile information, including role-specific details. This endpoint is essential for displaying user information in the UI and managing user-specific features.

---

## 🎯 **Endpoint Details**

### **URL:** `GET /api/auth/me`
### **Authentication:** Required (Bearer Token)
### **Access:** All authenticated users

---

## 📊 **Response Examples by User Type**

### 1. **Donor Response**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Donor",
    "email": "john.donor@example.com",
    "role": "donor",
    "userType": "Donor",
    "isVerified": true,
    "phoneNumber": "+1234567890",
    "address": "123 Main St, New York, NY",
    "location": {
      "type": "Point",
      "coordinates": [-73.856077, 40.848447]
    },
    "profilePictureUrl": "https://example.com/profile.jpg",
    "isActive": true,
    "lastLogin": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. **Volunteer Response**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Jane Volunteer",
    "email": "jane.volunteer@example.com",
    "role": "volunteer",
    "userType": "Volunteer",
    "isVerified": true,
    "phoneNumber": "+1234567891",
    "address": "456 Oak Ave, Brooklyn, NY",
    "location": {
      "type": "Point",
      "coordinates": [-73.956077, 40.748447]
    },
    "verificationStatus": "verified",
    "isPending": false,
    "isRejected": false,
    "availability": "weekends",
    "transportationMode": "car",
    "verificationDocuments": [
      "/uploads/volunteers/doc1.pdf",
      "/uploads/volunteers/doc2.pdf"
    ],
    "skills": ["driving", "heavy lifting"],
    "assignedTasksCount": 15,
    "verifiedBy": "507f1f77bcf86cd799439013",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. **Charity Response**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Admin User",
    "email": "admin@foodbank.org",
    "role": "charity",
    "userType": "Charity",
    "isVerified": true,
    "phoneNumber": "+1234567892",
    "address": "789 Charity Blvd, Manhattan, NY",
    "location": {
      "type": "Point",
      "coordinates": [-73.986077, 40.758447]
    },
    "verificationStatus": "verified",
    "isPending": false,
    "isRejected": false,
    "charityName": "Food Bank Central",
    "category": "Food Security",
    "description": "We provide food assistance to families in need",
    "registrationNumber": "CHR-12345",
    "contactFirstName": "Sarah",
    "contactLastName": "Johnson",
    "contactEmail": "sarah@foodbank.org",
    "contactPhone": "+1234567893",
    "verificationDocuments": [
      "/uploads/charities/registration.pdf",
      "/uploads/charities/tax-exempt.pdf"
    ],
    "neededCategories": [
      {
        "_id": "60d5ecb74b24a1001f647d01",
        "name": "Food items",
        "description": "Non-perishable food items"
      },
      {
        "_id": "60d5ecb74b24a1001f647d02",
        "name": "Baby supplies",
        "description": "Diapers, formula, baby food"
      }
    ],
    "needsStatement": "We urgently need non-perishable food items and baby supplies for families in our community.",
    "verifiedBy": "507f1f77bcf86cd799439013",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. **Admin Response**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "name": "System Admin",
    "email": "admin@generouslands.org",
    "role": "admin",
    "userType": "Admin",
    "isVerified": true,
    "phoneNumber": "+1234567894",
    "address": "100 Admin Plaza, NYC, NY",
    "permissionsLevel": 1,
    "profilePictureUrl": "https://example.com/admin-profile.jpg",
    "isActive": true,
    "lastLogin": "2024-01-15T11:00:00.000Z",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

## 🚫 **Error Responses**

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Not authorized, no token"
}
```

### User Not Found (404)
```json
{
  "success": false,
  "message": "User not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Server error fetching user profile",
  "error": "Database connection failed"
}
```

---

## 🖥️ **Frontend Implementation**

### React Hook for User Profile
```jsx
import { useState, useEffect } from 'react';

const useCurrentUser = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user profile');
      }

      if (data.success) {
        setUser(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch user profile');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching current user:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const refetch = () => {
    fetchCurrentUser();
  };

  return { user, loading, error, refetch };
};

export default useCurrentUser;
```

### User Profile Component
```jsx
import React from 'react';
import useCurrentUser from './hooks/useCurrentUser';

const UserProfile = () => {
  const { user, loading, error, refetch } = useCurrentUser();

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-error">
        <h3>Error Loading Profile</h3>
        <p>{error}</p>
        <button onClick={refetch} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  if (!user) {
    return <div className="profile-empty">No user data available</div>;
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="profile-avatar">
          {user.profilePictureUrl ? (
            <img src={user.profilePictureUrl} alt="Profile" />
          ) : (
            <div className="avatar-placeholder">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="profile-info">
          <h1>{user.name}</h1>
          <p className="user-role">{user.userType}</p>
          <p className="user-email">{user.email}</p>

          {/* Verification Status for Volunteers and Charities */}
          {(user.role === 'volunteer' || user.role === 'charity') && (
            <div className={`verification-badge ${user.verificationStatus}`}>
              {user.isPending && '⏳ Pending Verification'}
              {user.isRejected && '❌ Verification Rejected'}
              {user.verificationStatus === 'verified' && '✅ Verified'}
              {user.verificationStatus === 'in_progress' && '🔄 In Progress'}
            </div>
          )}
        </div>
      </div>

      <div className="profile-details">
        <ProfileSection title="Contact Information">
          <ProfileField label="Email" value={user.email} />
          <ProfileField label="Phone" value={user.phoneNumber} />
          <ProfileField label="Address" value={user.address} />
        </ProfileSection>

        {/* Role-specific sections */}
        {user.role === 'charity' && (
          <>
            <ProfileSection title="Charity Information">
              <ProfileField label="Charity Name" value={user.charityName} />
              <ProfileField label="Category" value={user.category} />
              <ProfileField label="Registration Number" value={user.registrationNumber} />
              <ProfileField label="Description" value={user.description} />
            </ProfileSection>

            {user.neededCategories && user.neededCategories.length > 0 && (
              <ProfileSection title="Needed Categories">
                <div className="needed-categories">
                  {user.neededCategories.map(category => (
                    <div key={category._id} className="category-tag">
                      {category.name}
                    </div>
                  ))}
                </div>
              </ProfileSection>
            )}

            {user.needsStatement && (
              <ProfileSection title="Current Needs">
                <p className="needs-statement">{user.needsStatement}</p>
              </ProfileSection>
            )}
          </>
        )}

        {user.role === 'volunteer' && (
          <ProfileSection title="Volunteer Information">
            <ProfileField label="Transportation" value={user.transportationMode} />
            <ProfileField label="Availability" value={user.availability} />
            <ProfileField label="Completed Tasks" value={user.assignedTasksCount} />
            {user.skills && user.skills.length > 0 && (
              <div className="skills">
                <label>Skills:</label>
                <div className="skills-list">
                  {user.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </ProfileSection>
        )}

        <ProfileSection title="Account Information">
          <ProfileField
            label="Member Since"
            value={new Date(user.createdAt).toLocaleDateString()}
          />
          <ProfileField
            label="Last Updated"
            value={new Date(user.updatedAt).toLocaleDateString()}
          />
          {user.lastLogin && (
            <ProfileField
              label="Last Login"
              value={new Date(user.lastLogin).toLocaleDateString()}
            />
          )}
        </ProfileSection>
      </div>
    </div>
  );
};

const ProfileSection = ({ title, children }) => (
  <div className="profile-section">
    <h3>{title}</h3>
    <div className="section-content">
      {children}
    </div>
  </div>
);

const ProfileField = ({ label, value }) => (
  <div className="profile-field">
    <label>{label}:</label>
    <span>{value || 'Not provided'}</span>
  </div>
);

export default UserProfile;
```

### Context Provider for Global User State
```jsx
import React, { createContext, useContext } from 'react';
import useCurrentUser from './hooks/useCurrentUser';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const userState = useCurrentUser();

  return (
    <UserContext.Provider value={userState}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
```

### CSS Styling
```css
.user-profile {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 32px;
  font-weight: bold;
  color: #6b7280;
}

.profile-info h1 {
  margin: 0 0 8px 0;
  font-size: 1.875rem;
  font-weight: bold;
  color: #1f2937;
}

.user-role {
  margin: 0 0 4px 0;
  font-size: 1.125rem;
  font-weight: 500;
  color: #3b82f6;
}

.user-email {
  margin: 0 0 12px 0;
  color: #6b7280;
}

.verification-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.verification-badge.verified {
  background: #d1fae5;
  color: #065f46;
}

.verification-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.verification-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.verification-badge.in_progress {
  background: #dbeafe;
  color: #1e40af;
}

.profile-section {
  margin-bottom: 24px;
}

.profile-section h3 {
  margin: 0 0 16px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.profile-field {
  display: flex;
  margin-bottom: 12px;
}

.profile-field label {
  min-width: 120px;
  font-weight: 500;
  color: #374151;
}

.profile-field span {
  color: #6b7280;
}

.needed-categories,
.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-tag,
.skill-tag {
  padding: 4px 12px;
  background: #f3f4f6;
  border-radius: 16px;
  font-size: 0.875rem;
  color: #374151;
}

.needs-statement {
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

.profile-loading,
.profile-error,
.profile-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  text-align: center;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.retry-button {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 16px;
}

.retry-button:hover {
  background: #2563eb;
}
```

---

## 🔧 **Usage Examples**

### Simple Profile Display
```jsx
import { useUser } from './context/UserContext';

const HeaderProfile = () => {
  const { user, loading } = useUser();

  if (loading || !user) return <div>Loading...</div>;

  return (
    <div className="header-profile">
      <span>Welcome, {user.name}</span>
      <span className="role-badge">{user.userType}</span>
    </div>
  );
};
```

### Role-based Navigation
```jsx
import { useUser } from './context/UserContext';

const Navigation = () => {
  const { user } = useUser();

  if (!user) return null;

  return (
    <nav>
      <NavLink to="/dashboard">Dashboard</NavLink>

      {user.role === 'donor' && (
        <NavLink to="/donate">Make Donation</NavLink>
      )}

      {user.role === 'volunteer' && (
        <>
          <NavLink to="/pickups">My Pickups</NavLink>
          <NavLink to="/availability">Set Availability</NavLink>
        </>
      )}

      {user.role === 'charity' && (
        <>
          <NavLink to="/donations">Incoming Donations</NavLink>
          <NavLink to="/needs">Manage Needs</NavLink>
        </>
      )}

      {user.role === 'admin' && (
        <NavLink to="/admin">Admin Panel</NavLink>
      )}
    </nav>
  );
};
```

---

## 🎯 **Key Benefits**

1. **🔒 Secure:** Requires authentication, returns only user's own data
2. **📱 Role-aware:** Returns role-specific fields for different user types
3. **🔄 Real-time:** Always returns current user state from database
4. **📊 Complete:** Includes all user fields including populated references
5. **🛡️ Clean:** Excludes sensitive data like passwords
6. **🎨 UI-ready:** Perfect for profile displays and role-based features

This endpoint provides everything needed to build comprehensive user profile interfaces and role-based functionality in your frontend application!
