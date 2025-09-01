# Generous Hands Backend

Welcome to the backend API for **Generous Hands** – a platform connecting donors, charities, and volunteers to make giving and receiving easier, safer, and more impactful.

---

## 🚀 Features

- **User Registration & Authentication**
  - Donor, Charity, Volunteer, and Admin roles
  - JWT-based authentication
- **Charity & Volunteer Verification**
  - Admin approval workflow
  - Email notifications for application status
- **Document Uploads**
  - Secure file uploads for verification and donations
- **Donation Management**
  - Donors can submit donations
  - Volunteers can arrange pickups
  - Charities can view and manage donations
- **Admin Dashboard**
  - Approve/reject applications
  - View supporting documents
  - Manage users and donations
- **RESTful API**
  - Well-documented endpoints (Swagger/OpenAPI)
- **Notifications**
  - Automated emails for important actions

---

## 🛠️ Tech Stack

- **Node.js** & **Express**
- **MongoDB** (Mongoose ODM)
- **JWT** for authentication
- **Multer** for file uploads
- **Nodemailer** for email notifications
- **Swagger** for API docs

---

## 📦 Setup & Installation

1. **Clone the repository**
   ```sh
   git clone https://github.com/your-org/genhands-backend.git
   cd genhands-backend
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:

   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=3000
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password_or_app_password
   ```

   > **Note:** Never commit your `.env` file to version control.

4. **Run the server**
   ```sh
   npm start
   ```

   The API will be available at `http://localhost:3000`.

---

## 📚 API Documentation

- Interactive Swagger docs available at:  
  `http://localhost:3000/api-docs`

---

## 📁 Folder Structure

```
GenHands-Backend/
├── src/
│   ├── controllers/        # Route logic
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express routes
│   ├── middleware/         # Auth, uploads, etc.
│   ├── utils/              # Helper functions (e.g., sendEmail.js)
│   └── ...                 # Other core files
├── uploads/                # Uploaded documents (auto-created)
├── .env                    # Environment variables
├── package.json
└── README.md
```

---

## 📝 Key Endpoints

- `POST /api/auth/register` – Register user (donor, charity, volunteer)
- `POST /api/auth/login` – Login
- `PUT /api/auth/verify/:id` – Admin: verify or reject charity/volunteer
- `GET /api/donations/my-donations` – Get logged-in user's donations
- `POST /api/donations` – Submit a donation
- `GET /api/donations/:id/documents` – Get donation documents
- ...and more!

---

## 🛡️ Security & Privacy

- Passwords are hashed and never stored in plain text.
- Uploaded documents are stored securely and only accessible to authorized users.
- Email credentials and secrets are kept in `.env` and never committed.

---

## 📧 Contact & Support

Questions, feedback, or need help?  
Email us at [janny.jonyo@strathmore.edu](mailto:janny.jonyo@strathmore.edu)

---

## ❤️ About Generous Hands

Generous Hands is dedicated to making giving easier and more transparent.  
Join us in building a more generous world!

---
