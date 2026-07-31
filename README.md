## 🚀 Local Setup

### Frontend

```bash
# Clone
git clone https://github.com/Ajoymon/etuitionbd-server.git
cd etuitionbd-client

# Install
npm install

# .env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_IMGBB_API_KEY=

# Run
npm run dev
```

### Backend

```bash
# Clone
git clone https://github.com/your-username/etuitionbd-server.git
cd etuitionbd-server

# Install
npm install

# .env
PORT=3000
MONGODB_URI=
STRIPE_SECRET_KEY=
SITE_DOMAIN=http://localhost:5173
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Run
nodemon index.js
```

---

## 📡 API Endpoints

### Public

| Method | Endpoint                   | Description              |
| ------ | -------------------------- | ------------------------ |
| POST   | `/users`                   | Create new user          |
| GET    | `/users/:email/role`       | Get user role            |
| GET    | `/users/tutors`            | All tutors               |
| GET    | `/users/tutors/latest`     | Latest 6 tutors          |
| GET    | `/Tution/tuitionPosts`     | All approved tuitions    |
| GET    | `/tuitionPosts/latest`     | Latest 6 tuitions        |
| GET    | `/tuitionPosts/:id`        | Single tuition details   |
| GET    | `/tutorApplications/check` | Check if already applied |
| GET    | `/payment-success`         | Payment success handler  |

### Private (Token Required)

| Method | Endpoint                     | Description               |
| ------ | ---------------------------- | ------------------------- |
| GET    | `/myTuitions`                | Student's tuitions        |
| POST   | `/tuitionPosts`              | Create tuition            |
| DELETE | `/tuitionPosts/:id`          | Delete tuition            |
| POST   | `/tutorApplications`         | Apply for tuition         |
| GET    | `/tutorApplications/Tutor`   | Tutor's applications      |
| GET    | `/tutorApplications/Student` | Student's applications    |
| GET    | `/tutorApplications/ongoing` | Ongoing tuitions          |
| DELETE | `/tutorApplications/:id`     | Delete application        |
| PATCH  | `/update/Apply/:id`          | Update application status |
| POST   | `/create-checkout-session`   | Stripe checkout           |
| GET    | `/payments/student`          | Student payment history   |
| GET    | `/payments/tutor`            | Tutor revenue history     |
| POST   | `/payments`                  | Save payment record       |
| PATCH  | `/users/update/:email`       | Update profile            |

### Admin Only

| Method | Endpoint                   | Description            |
| ------ | -------------------------- | ---------------------- |
| GET    | `/admin/tuitionPosts`      | All tuitions           |
| PATCH  | `/tuitionPosts/:id/status` | Approve/Reject tuition |
| GET    | `/users/admin`             | All users              |
| PATCH  | `/users/:id/role`          | Change user role       |
| DELETE | `/users/:id`               | Delete user            |
| GET    | `/payments/admin`          | All payments           |

---

## 🔒 Security

- Firebase JWT Token verification on all private routes
- Admin middleware to protect admin-only routes
- Email verification on sensitive operations
- Stripe secure payment processing
- Environment variables for all sensitive data

---

## 📸 Screenshots

> Add screenshots here after deployment

---

## 🙏 Acknowledgements

- [Firebase](https://firebase.google.com/)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [Stripe](https://stripe.com/)
- [DaisyUI](https://daisyui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)

### Backend

├── index.js ├── .env └── package.json
