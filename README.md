# GU Hospital HMS - Gauhati University Hospital Management System

GU Hospital HMS is a comprehensive hospital management system designed for Gauhati University Hospital to streamline healthcare operations with electronic health records (EHR), appointment scheduling, prescription management, billing, and analytics. The system supports multiple user roles (doctors and patients) and offers multilingual support in English, Hindi, and Assamese.

## Table of Contents

1. [Features](#features)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Installation](#installation)
5. [Running the Application](#running-the-application)
6. [Modules](#modules)
7. [API Endpoints](#api-endpoints)
8. [Multilingual Support](#multilingual-support)
9. [Authentication](#authentication)

## Features

- **User Authentication**: Secure login system with role-based access (Doctor/Patient)
- **Dashboard**: Role-specific analytics and quick access to key features
- **Patient Management**: Complete patient profiles and medical history
- **Electronic Health Records (EHR)**: Digital storage and management of patient medical records
- **Appointment Scheduling**: Calendar-based appointment booking system
- **Prescription Management**: Create, view, and manage prescriptions
- **Billing & Invoicing**: Generate and manage patient bills
- **Settings**: User profile, security, and preferences management
- **Multilingual Support**: Interface available in multiple languages

## Technology Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Node.js, Express
- **State Management**: React Query, Context API
- **Routing**: Wouter
- **Forms**: React Hook Form, Zod validation
- **Internationalization**: i18next
- **Data Storage**: In-memory storage (development), PostgreSQL (optional)
- **Build Tools**: Vite

## Project Structure

```
/
├── client/                     # Frontend code
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── billing/        # Billing-related components
│   │   │   ├── layout/         # Layout components
│   │   │   ├── medical-records/ # Medical record components
│   │   │   └── ui/             # Shadcn UI components
│   │   ├── context/            # React contexts
│   │   │   ├── AuthContext.tsx # Authentication context
│   │   │   └── LanguageContext.tsx # Language context
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utility functions and constants
│   │   ├── pages/              # Application pages
│   │   │   ├── appointments/   # Appointment-related pages
│   │   │   ├── billing/        # Billing-related pages
│   │   │   ├── dashboard/      # Dashboard pages
│   │   │   ├── medical-records/ # Medical records pages
│   │   │   ├── patients/       # Patient management pages
│   │   │   ├── prescriptions/  # Prescription-related pages
│   │   │   └── settings/       # User settings pages
│   │   ├── App.tsx             # Main App component
│   │   ├── index.css           # Global styles
│   │   └── main.tsx            # Entry point
│   └── index.html              # HTML template
├── server/                     # Backend code
│   ├── index.ts                # Server entry point
│   ├── routes.ts               # API route definitions
│   ├── storage.ts              # Data storage interface
│   └── vite.ts                 # Vite server setup
├── shared/                     # Shared code
│   └── schema.ts               # Database schema and types
├── components.json             # Shadcn UI components config
├── package.json                # Project dependencies
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite configuration
```

## Installation

Follow these steps to install and run the GU Hospital HMS on a Linux system:

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/gu-hospital-hms.git
   cd gu-hospital-hms
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create any necessary environment variables (optional):
   ```bash
   touch .env
   ```
   
   Add the following variables to the `.env` file if needed:
   ```
   # Application settings
   PORT=5000
   NODE_ENV=development
   
   # Database settings (if using PostgreSQL)
   DATABASE_URL=postgresql://username:password@localhost:5432/guhospital
   ```

## Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Access the application:
   The application will be available at `http://localhost:5000`

3. Login with default credentials:
   - **Doctor Login**: 
     - Username: dr.johnson
     - Password: password
   - **Patient Login**:
     - Username: patient1
     - Password: password

## Modules

### Dashboard

The dashboard provides an overview of the system with role-specific information:

- **For Doctors**: Upcoming appointments, recent patient activity, statistics on patients and consultations
- **For Patients**: Upcoming appointments, recent prescriptions, and payment reminders

### Patient Management

Allows doctors to:
- View and manage patient profiles
- Access patient medical history
- Track patient visits and consultations

Allows patients to:
- View their personal information
- Access their medical history

### Electronic Health Records (EHR)

- Complete digital records of patient health information
- Support for diagnosis, symptoms, treatment plans, and test results
- File upload capability for reports and images
- Searchable and filterable medical history

### Appointment Scheduling

- Calendar view for booking appointments
- Appointment status tracking (Pending, Completed, Cancelled)
- Doctor availability management
- Email notifications for appointment confirmations and reminders

### Prescription Management

- Digital prescription creation during or after appointments
- Medication details including dosage, frequency, and duration
- Prescription history for both doctors and patients
- Downloadable prescriptions in PDF format

### Billing & Invoicing

- Generate invoices for consultations and services
- Track payment status (Paid, Unpaid, Cancelled)
- Invoice history for accounting purposes
- Downloadable invoices

### Settings

- User profile management
- Password and security settings
- Notification preferences
- Language settings

## API Endpoints

The system exposes the following API endpoints:

### Authentication
- `POST /api/auth/login`: User login
- `POST /api/auth/register`: User registration
- `POST /api/auth/logout`: User logout
- `POST /api/auth/change-password`: Change user password

### Users
- `GET /api/users`: Get all users
- `GET /api/users/:id`: Get user by ID
- `PATCH /api/users/:id`: Update user information
- `PATCH /api/users/:id/notifications`: Update notification preferences

### Patients
- `GET /api/patients`: Get all patients
- `GET /api/patients/:id`: Get patient by ID
- `GET /api/patients/:id/info`: Get patient additional information

### Appointments
- `GET /api/appointments`: Get all appointments
- `GET /api/appointments/:id`: Get appointment by ID
- `POST /api/appointments`: Create new appointment
- `PATCH /api/appointments/:id`: Update appointment
- `DELETE /api/appointments/:id`: Delete appointment

### Medical Records
- `GET /api/medical-records`: Get all medical records
- `GET /api/medical-records/:id`: Get medical record by ID
- `GET /api/medical-records/patient/:id`: Get records by patient ID
- `POST /api/medical-records`: Create new medical record
- `PATCH /api/medical-records/:id`: Update medical record
- `GET /api/medical-files/recent`: Get recent medical files

### Prescriptions
- `GET /api/prescriptions`: Get all prescriptions
- `GET /api/prescriptions/:id`: Get prescription by ID
- `GET /api/prescriptions/patient/:id`: Get prescriptions by patient ID
- `POST /api/prescriptions`: Create new prescription
- `PATCH /api/prescriptions/:id`: Update prescription

### Invoices
- `GET /api/invoices`: Get all invoices
- `GET /api/invoices/:id`: Get invoice by ID
- `GET /api/invoices/patient/:id`: Get invoices by patient ID
- `POST /api/invoices`: Create new invoice
- `PATCH /api/invoices/:id`: Update invoice
- `GET /api/invoices/:id/download`: Download invoice PDF

### Dashboard
- `GET /api/dashboard/stats`: Get dashboard statistics

## Multilingual Support

The application supports multiple languages:

- English (default)
- Hindi
- Assamese

Language can be changed in the settings page, and preference is saved in local storage.

## Authentication

The system uses session-based authentication:

1. Users log in with username/password
2. Successful authentication creates a user session
3. Authentication state is managed via AuthContext
4. Protected routes check authentication status before rendering
5. Different permission levels based on user role (doctor/patient)

## Deployment

### For Production

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.