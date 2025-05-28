
# DIY Guide: Building GU Hospital Management System from Scratch

This guide will walk you through creating the Gauhati University Hospital Management System step by step.

## Prerequisites

- Node.js (v16 or higher)
- Basic knowledge of React, TypeScript, and Express.js
- Text editor or IDE

## Step 1: Project Setup

### 1.1 Initialize the Project

```bash
mkdir gu-hospital-hms
cd gu-hospital-hms
npm init -y
```

### 1.2 Install Dependencies

```bash
# Core dependencies
npm install express react react-dom typescript @types/react @types/react-dom @types/node @types/express

# Build tools
npm install -D vite @vitejs/plugin-react eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser

# UI and styling
npm install tailwindcss postcss autoprefixer @tailwindcss/typography
npm install lucide-react class-variance-authority clsx tailwind-merge

# Form handling and validation
npm install react-hook-form @hookform/resolvers zod

# State management and data fetching
npm install @tanstack/react-query wouter

# Internationalization
npm install i18next react-i18next i18next-browser-languagedetector

# Database and ORM
npm install drizzle-orm drizzle-kit pg @types/pg

# Development utilities
npm install -D @types/pg concurrently nodemon
```

### 1.3 Create Project Structure

```bash
mkdir -p client/src/{components,pages,hooks,lib,context,assets}
mkdir -p client/src/components/{ui,layout,dashboard,patients,appointments,prescriptions,medical-records,billing}
mkdir -p client/src/pages/{dashboard,patients,appointments,prescriptions,medical-records,billing,settings}
mkdir -p client/public
mkdir -p server
mkdir -p shared
```

## Step 2: Configuration Files

### 2.1 TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./client/src/*"],
      "@db/*": ["./server/*"],
      "@shared/*": ["./shared/*"]
    }
  },
  "include": ["client/src", "server", "shared"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 2.2 Vite Configuration

Create `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: "client",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
```

### 2.3 Tailwind Configuration

Create `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./client/src/**/*.{ts,tsx}",
    "./client/index.html",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
```

### 2.4 Package.json Scripts

Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "concurrently \"npm run server:dev\" \"npm run client:dev\"",
    "build": "npm run client:build && npm run server:build",
    "start": "node dist/server/index.js",
    "client:dev": "vite",
    "client:build": "vite build",
    "server:dev": "nodemon --exec tsx server/index.ts",
    "server:build": "tsc server/index.ts --outDir dist",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate"
  }
}
```

## Step 3: Database Schema and Setup

### 3.1 Create Database Schema

Create `shared/schema.ts`:

```typescript
import { z } from "zod";

// User types
export const UserRole = {
  DOCTOR: "doctor",
  PATIENT: "patient",
  ADMIN: "admin",
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// Zod schemas
export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
  role: z.enum([UserRole.DOCTOR, UserRole.PATIENT, UserRole.ADMIN]),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const PatientSchema = z.object({
  id: z.string(),
  userId: z.string(),
  dateOfBirth: z.date(),
  gender: z.enum(["male", "female", "other"]),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  bloodGroup: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  medicalHistory: z.array(z.string()).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const AppointmentSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  date: z.date(),
  time: z.string(),
  duration: z.number().default(30),
  status: z.enum(["scheduled", "completed", "cancelled", "no-show"]),
  reason: z.string(),
  notes: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const MedicalRecordSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  appointmentId: z.string().optional(),
  date: z.date(),
  diagnosis: z.string(),
  symptoms: z.array(z.string()),
  treatment: z.string(),
  medications: z.array(z.string()),
  notes: z.string().optional(),
  files: z.array(z.string()).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const PrescriptionSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  appointmentId: z.string().optional(),
  medicalRecordId: z.string().optional(),
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string(),
    instructions: z.string().optional(),
  })),
  date: z.date(),
  notes: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const InvoiceSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  appointmentId: z.string().optional(),
  amount: z.number(),
  description: z.string(),
  status: z.enum(["pending", "paid", "cancelled"]),
  dueDate: z.date(),
  paidDate: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type Patient = z.infer<typeof PatientSchema>;
export type Appointment = z.infer<typeof AppointmentSchema>;
export type MedicalRecord = z.infer<typeof MedicalRecordSchema>;
export type Prescription = z.infer<typeof PrescriptionSchema>;
export type Invoice = z.infer<typeof InvoiceSchema>;
```

### 3.2 Create Database Configuration

Create `server/db.ts`:

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/guhospital",
});

export const db = drizzle(pool);
```

### 3.3 Create Drizzle Configuration

Create `drizzle.config.ts`:

```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./server/schema.sql",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/guhospital",
  },
} satisfies Config;
```

## Step 4: Backend Implementation

### 4.1 Create Storage Layer

Create `server/storage.ts`:

```typescript
import type {
  User,
  Patient,
  Appointment,
  MedicalRecord,
  Prescription,
  Invoice,
} from "@shared/schema";

// In-memory storage for development
class InMemoryStorage {
  private users: Map<string, User> = new Map();
  private patients: Map<string, Patient> = new Map();
  private appointments: Map<string, Appointment> = new Map();
  private medicalRecords: Map<string, MedicalRecord> = new Map();
  private prescriptions: Map<string, Prescription> = new Map();
  private invoices: Map<string, Invoice> = new Map();

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Add sample users
    const sampleDoctor: User = {
      id: "doctor1",
      username: "dr.johnson",
      email: "dr.johnson@guhospital.com",
      password: "password",
      role: "doctor",
      firstName: "Sarah",
      lastName: "Johnson",
      phone: "+91-9876543210",
      avatar: "/placeholder-doctor.png",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const samplePatient: User = {
      id: "patient1",
      username: "patient1",
      email: "patient1@example.com",
      password: "password",
      role: "patient",
      firstName: "John",
      lastName: "Doe",
      phone: "+91-9876543211",
      avatar: "/placeholder-patient.png",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(sampleDoctor.id, sampleDoctor);
    this.users.set(samplePatient.id, samplePatient);

    // Add sample patient data
    const patientData: Patient = {
      id: "patientData1",
      userId: "patient1",
      dateOfBirth: new Date("1990-01-01"),
      gender: "male",
      address: "123 Main St, Guwahati, Assam",
      emergencyContact: "+91-9876543212",
      bloodGroup: "O+",
      allergies: ["Penicillin"],
      medicalHistory: ["Hypertension"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.patients.set(patientData.id, patientData);
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return Array.from(this.users.values()).find(user => user.username === username) || null;
  }

  async createUser(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const newUser: User = {
      ...user,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<Omit<User, "id" | "createdAt">>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Patient methods
  async getPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  async getPatientById(id: string): Promise<Patient | null> {
    return this.patients.get(id) || null;
  }

  async getPatientByUserId(userId: string): Promise<Patient | null> {
    return Array.from(this.patients.values()).find(patient => patient.userId === userId) || null;
  }

  async createPatient(patient: Omit<Patient, "id" | "createdAt" | "updatedAt">): Promise<Patient> {
    const newPatient: Patient = {
      ...patient,
      id: `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.patients.set(newPatient.id, newPatient);
    return newPatient;
  }

  // Appointment methods
  async getAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  async getAppointmentById(id: string): Promise<Appointment | null> {
    return this.appointments.get(id) || null;
  }

  async createAppointment(appointment: Omit<Appointment, "id" | "createdAt" | "updatedAt">): Promise<Appointment> {
    const newAppointment: Appointment = {
      ...appointment,
      id: `appointment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.appointments.set(newAppointment.id, newAppointment);
    return newAppointment;
  }

  // Medical record methods
  async getMedicalRecords(): Promise<MedicalRecord[]> {
    return Array.from(this.medicalRecords.values());
  }

  async getMedicalRecordById(id: string): Promise<MedicalRecord | null> {
    return this.medicalRecords.get(id) || null;
  }

  async getMedicalRecordsByPatientId(patientId: string): Promise<MedicalRecord[]> {
    return Array.from(this.medicalRecords.values()).filter(record => record.patientId === patientId);
  }

  async createMedicalRecord(record: Omit<MedicalRecord, "id" | "createdAt" | "updatedAt">): Promise<MedicalRecord> {
    const newRecord: MedicalRecord = {
      ...record,
      id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.medicalRecords.set(newRecord.id, newRecord);
    return newRecord;
  }

  // Prescription methods
  async getPrescriptions(): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values());
  }

  async getPrescriptionById(id: string): Promise<Prescription | null> {
    return this.prescriptions.get(id) || null;
  }

  async getPrescriptionsByPatientId(patientId: string): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values()).filter(prescription => prescription.patientId === patientId);
  }

  async createPrescription(prescription: Omit<Prescription, "id" | "createdAt" | "updatedAt">): Promise<Prescription> {
    const newPrescription: Prescription = {
      ...prescription,
      id: `prescription_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.prescriptions.set(newPrescription.id, newPrescription);
    return newPrescription;
  }

  // Invoice methods
  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    return this.invoices.get(id) || null;
  }

  async getInvoicesByPatientId(patientId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(invoice => invoice.patientId === patientId);
  }

  async createInvoice(invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt">): Promise<Invoice> {
    const newInvoice: Invoice = {
      ...invoice,
      id: `invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.invoices.set(newInvoice.id, newInvoice);
    return newInvoice;
  }
}

export const storage = new InMemoryStorage();
```

### 4.2 Create API Routes

Create `server/routes.ts`:

```typescript
import { Router } from "express";
import { storage } from "./storage";
import { UserSchema, PatientSchema, AppointmentSchema, MedicalRecordSchema, PrescriptionSchema, InvoiceSchema } from "@shared/schema";

const router = Router();

// Authentication routes
router.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await storage.getUserByUsername(username);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Store user session
    req.session.userId = user.id;
    req.session.userRole = user.role;

    // Don't send password back
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get("/auth/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const user = await storage.getUserById(req.session.userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
});

// Middleware to check authentication
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Users routes
router.get("/users", requireAuth, async (req, res) => {
  try {
    const users = await storage.getUsers();
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/users/:id", requireAuth, async (req, res) => {
  try {
    const user = await storage.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Patients routes
router.get("/patients", requireAuth, async (req, res) => {
  try {
    const patients = await storage.getPatients();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch patients" });
  }
});

router.get("/patients/:id", requireAuth, async (req, res) => {
  try {
    const patient = await storage.getPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch patient" });
  }
});

// Appointments routes
router.get("/appointments", requireAuth, async (req, res) => {
  try {
    const appointments = await storage.getAppointments();
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

router.post("/appointments", requireAuth, async (req, res) => {
  try {
    const appointmentData = AppointmentSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(req.body);
    const appointment = await storage.createAppointment(appointmentData);
    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ error: "Invalid appointment data" });
  }
});

// Medical records routes
router.get("/medical-records", requireAuth, async (req, res) => {
  try {
    const records = await storage.getMedicalRecords();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch medical records" });
  }
});

router.get("/medical-records/patient/:patientId", requireAuth, async (req, res) => {
  try {
    const records = await storage.getMedicalRecordsByPatientId(req.params.patientId);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch patient medical records" });
  }
});

router.post("/medical-records", requireAuth, async (req, res) => {
  try {
    const recordData = MedicalRecordSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(req.body);
    const record = await storage.createMedicalRecord(recordData);
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ error: "Invalid medical record data" });
  }
});

// Prescriptions routes
router.get("/prescriptions", requireAuth, async (req, res) => {
  try {
    const prescriptions = await storage.getPrescriptions();
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch prescriptions" });
  }
});

router.get("/prescriptions/patient/:patientId", requireAuth, async (req, res) => {
  try {
    const prescriptions = await storage.getPrescriptionsByPatientId(req.params.patientId);
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch patient prescriptions" });
  }
});

router.post("/prescriptions", requireAuth, async (req, res) => {
  try {
    const prescriptionData = PrescriptionSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(req.body);
    const prescription = await storage.createPrescription(prescriptionData);
    res.status(201).json(prescription);
  } catch (error) {
    res.status(400).json({ error: "Invalid prescription data" });
  }
});

// Invoices routes
router.get("/invoices", requireAuth, async (req, res) => {
  try {
    const invoices = await storage.getInvoices();
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

router.get("/invoices/patient/:patientId", requireAuth, async (req, res) => {
  try {
    const invoices = await storage.getInvoicesByPatientId(req.params.patientId);
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch patient invoices" });
  }
});

router.post("/invoices", requireAuth, async (req, res) => {
  try {
    const invoiceData = InvoiceSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(req.body);
    const invoice = await storage.createInvoice(invoiceData);
    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ error: "Invalid invoice data" });
  }
});

// Dashboard stats
router.get("/dashboard/stats", requireAuth, async (req, res) => {
  try {
    const users = await storage.getUsers();
    const patients = await storage.getPatients();
    const appointments = await storage.getAppointments();
    const medicalRecords = await storage.getMedicalRecords();

    const stats = {
      totalPatients: patients.length,
      totalDoctors: users.filter(u => u.role === "doctor").length,
      totalAppointments: appointments.length,
      totalRecords: medicalRecords.length,
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

export default router;
```

### 4.3 Create Express Server

Create `server/index.ts`:

```typescript
import express from "express";
import session from "express-session";
import path from "path";
import { createServer } from "./vite";
import routes from "./routes";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key-here",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// API routes
app.use("/api", routes);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));
  
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  });
} else {
  // Development server with Vite
  createServer(app);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
```

Create `server/vite.ts`:

```typescript
import { createServer as createViteServer } from "vite";
import { Express } from "express";

export async function createServer(app: Express) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);
}
```

## Step 5: Frontend Implementation

### 5.1 Create Main App Structure

Create `client/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GU Hospital HMS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `client/src/main.tsx`:

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Create `client/src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 9% 83%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### 5.2 Create Context Providers

Create `client/src/context/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: Omit<User, "password"> | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Omit<User, "password"> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

### 5.3 Create Internationalization Setup

Create `client/src/lib/i18n.ts`:

```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    common: {
      welcome: "Welcome",
      login: "Login",
      logout: "Logout",
      username: "Username",
      password: "Password",
      email: "Email",
      phone: "Phone",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      view: "View",
      create: "Create",
      update: "Update",
      search: "Search",
      filter: "Filter",
      loading: "Loading...",
      noData: "No data available",
    },
    navigation: {
      dashboard: "Dashboard",
      patients: "Patients",
      appointments: "Appointments",
      prescriptions: "Prescriptions",
      medicalRecords: "Medical Records",
      billing: "Billing",
      settings: "Settings",
    },
    dashboard: {
      title: "Dashboard",
      recentPatients: "Recent Patients",
      upcomingAppointments: "Upcoming Appointments",
      statistics: "Statistics",
      totalPatients: "Total Patients",
      totalAppointments: "Total Appointments",
      totalDoctors: "Total Doctors",
    },
  },
  hi: {
    common: {
      welcome: "स्वागत है",
      login: "लॉगिन",
      logout: "लॉगआउट",
      username: "उपयोगकर्ता नाम",
      password: "पासवर्ड",
      email: "ईमेल",
      phone: "फोन",
      save: "सहेजें",
      cancel: "रद्द करें",
      edit: "संपादित करें",
      delete: "हटाएं",
      view: "देखें",
      create: "बनाएं",
      update: "अपडेट करें",
      search: "खोजें",
      filter: "फिल्टर",
      loading: "लोड हो रहा है...",
      noData: "कोई डेटा उपलब्ध नहीं",
    },
    navigation: {
      dashboard: "डैशबोर्ड",
      patients: "मरीज़",
      appointments: "अपॉइंटमेंट",
      prescriptions: "नुस्खे",
      medicalRecords: "मेडिकल रिकॉर्ड",
      billing: "बिलिंग",
      settings: "सेटिंग्स",
    },
    dashboard: {
      title: "डैशबोर्ड",
      recentPatients: "हाल के मरीज़",
      upcomingAppointments: "आने वाले अपॉइंटमेंट",
      statistics: "आंकड़े",
      totalPatients: "कुल मरीज़",
      totalAppointments: "कुल अपॉइंटमेंट",
      totalDoctors: "कुल डॉक्टर",
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
```

### 5.4 Create Basic UI Components

You'll need to implement the Shadcn/UI components. Here's how to set up a few basic ones:

Create `client/src/components/ui/button.tsx`:

```typescript
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

Create `client/src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 5.5 Create Main App Component

Create `client/src/App.tsx`:

```typescript
import React from "react";
import { Router, Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { MainLayout } from "./components/layout/MainLayout";
import { AuthLayout } from "./components/layout/AuthLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import PatientsPage from "./pages/patients/PatientsPage";
import AppointmentsPage from "./pages/appointments/AppointmentsPage";
import PrescriptionsPage from "./pages/prescriptions/PrescriptionsPage";
import MedicalRecordsPage from "./pages/medical-records/MedicalRecordsPage";
import BillingPage from "./pages/billing/BillingPage";
import SettingsPage from "./pages/settings/SettingsPage";
import { Toaster } from "./components/ui/toaster";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthLayout>
        <LoginPage />
      </AuthLayout>
    );
  }

  return (
    <MainLayout>
      <Router>
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/patients" component={PatientsPage} />
          <Route path="/appointments" component={AppointmentsPage} />
          <Route path="/prescriptions" component={PrescriptionsPage} />
          <Route path="/medical-records" component={MedicalRecordsPage} />
          <Route path="/billing" component={BillingPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={() => <div>Page not found</div>} />
        </Switch>
      </Router>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <AppRoutes />
          <Toaster />
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
```

## Step 6: Create Essential Components

Continue building the essential components for the layout, pages, and functionality. The complete implementation would include:

1. **Layout Components**: Header, Sidebar, Footer, MainLayout, AuthLayout
2. **Page Components**: Dashboard, Patients, Appointments, Prescriptions, Medical Records, Billing, Settings
3. **Feature Components**: Forms, tables, cards, modals for each module
4. **UI Components**: Complete Shadcn/UI component library setup

## Step 7: Testing and Deployment

1. **Development Testing**:
   ```bash
   npm run dev
   ```

2. **Production Build**:
   ```bash
   npm run build
   npm start
   ```

3. **Deploy on Replit**: Use Replit's deployment features to publish your application.

This guide provides the foundation for building the complete hospital management system. Each step builds upon the previous one, creating a scalable and maintainable application architecture.
