# 🛡️ ThriveSecure Server

The **ThriveSecure Server** is a secure, scalable backend built with **Node.js** and **Express**, designed to power modern life and health insurance services. It delivers **RESTful APIs** for managing policies, payments, and user data while ensuring **robust JWT-based authentication**, **Firebase Admin** integration, and **Stripe payment processing**. Built for reliability and clarity, it seamlessly supports the ThriveSecure client platform.

---

## 🧩 Project Overview

This backend is responsible for:

- Managing insurance policies and user data
- Handling secure Stripe payment processing
- JWT & Firebase-admin protected routes
- Environment-based secure configuration with `dotenv`
- Seamless integration with the ThriveSecure client

---

## 🔗 Frontend Companion

👉 [ThriveSecure Client Repository](https://github.com/ameerhamzahd/thrivesecure)

---

## 🚀 Features

- 📦 REST API with CRUD operations for insurance data
- 💳 Stripe payment integration for premium handling
- 🔐 Firebase Admin authentication & JWT token system
- 🌐 CORS-enabled for frontend-backend interaction
- 🌱 Environment configuration using `.env`
- ⚙️ Ready for deployment with `vercel.json`

---

## ⚙️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: Firebase Admin SDK + JWT
- **Payments**: Stripe SDK
- **Environment Config**: dotenv
- **Deployment**: Vercel

---

## 📦 NPM Packages Used

### Backend

| Package           | Purpose                                           |
|-------------------|---------------------------------------------------|
| `cors`            | Enable cross-origin requests                      |
| `dotenv`          | Manage environment variables                      |
| `express`         | Server setup and API endpoints                    |
| `firebase-admin`  | Firebase server-side integration                  |
| `mongodb`         | MongoDB client and query management               |
| `stripe`          | Stripe payment processing                         |

---

## 🛠️ Installation & Local Development

1. **Clone the repository**:
    ```bash
    git clone https://github.com/ameerhamzahd/thrivesecure-server.git
    cd thrivesecure-server
    ```

2. **Install dependencies:**
    ```bash
    npm install
    ```

3. **Set up environment variables:**

    Create a `.env` file and add your variables:
    ```env
    DB_USERNAME=your_database_username
    DB_PASSWORD=your_database_password
    ACCESS_TOKEN_SECRET=your_jwt_secret
    STRIPE_SECRET_KEY=your_stripe_secret_key
    ```

4. **Run locally:**
    ```bash
    nodemon index.js
    ```

---

## 🚀 Deployment

1. **Install Vercel CLI (if not already):**
    ```bash
    npm install -g vercel
    ```

2. **Login to your Vercel account:**
    ```bash
    vercel login
    ```

3. **Deploy your server:**
    ```bash
    vercel --prod
    ```

---

## 📬 Contact

For issues or suggestions, please contact: ameerhamzah.daiyan@gmail.com

---

## 📄 License

This project is licensed under the MIT License.

---

## ✨ Acknowledgements

Thanks to Firebase, Stripe, and the Node.js ecosystem for powering this project.

---
