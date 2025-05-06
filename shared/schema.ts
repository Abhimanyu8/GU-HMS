import { pgTable, text, serial, integer, boolean, date, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (doctors and patients)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("patient"), // doctor, patient
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  gender: text("gender"), // male, female, other
  dateOfBirth: date("date_of_birth"),
  bloodGroup: text("blood_group"),
  address: text("address"),
  profileImage: text("profile_image"),
  specialization: text("specialization"), // For doctors
  languages: text("languages").array(), // Languages the doctor speaks
  isActive: boolean("is_active").default(true),
});

// Patient medical information
export const patientInfo = pgTable("patient_info", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => users.id),
  allergies: text("allergies").array(),
  medicalConditions: text("medical_conditions").array(),
  currentMedications: text("current_medications").array(),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  height: text("height"),
  weight: text("weight"),
});

// Doctor availability/schedule
export const doctorSchedule = pgTable("doctor_schedule", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => users.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 for Sunday to Saturday
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  isAvailable: boolean("is_available").default(true),
});

// Appointments
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => users.id),
  doctorId: integer("doctor_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  time: text("time").notNull(), // HH:MM format
  duration: integer("duration").default(30), // In minutes
  purpose: text("purpose").notNull(),
  status: text("status").default("pending"), // pending, completed, cancelled
  notes: text("notes"),
});

// Medical Records
export const medicalRecords = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => users.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  recordDate: timestamp("record_date").defaultNow(),
  diagnosis: text("diagnosis"),
  symptoms: text("symptoms").array(),
  treatment: text("treatment"),
  notes: text("notes"),
});

// Prescriptions
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => users.id),
  doctorId: integer("doctor_id").notNull().references(() => users.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  prescriptionDate: timestamp("prescription_date").defaultNow(),
  expiryDate: date("expiry_date"),
  diagnosis: text("diagnosis"),
  notes: text("notes"),
});

// Prescription Items (medicines)
export const prescriptionItems = pgTable("prescription_items", {
  id: serial("id").primaryKey(),
  prescriptionId: integer("prescription_id").notNull().references(() => prescriptions.id),
  medicationName: text("medication_name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  duration: text("duration").notNull(),
  instructions: text("instructions"),
});

// Medical Files (test reports, etc.)
export const medicalFiles = pgTable("medical_files", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => users.id),
  recordId: integer("record_id").references(() => medicalRecords.id),
  fileType: text("file_type").notNull(), // pdf, image, etc.
  fileName: text("file_name").notNull(),
  fileData: text("file_data").notNull(), // Base64 encoded file data
  uploadDate: timestamp("upload_date").defaultNow(),
  description: text("description"),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => users.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  invoiceDate: timestamp("invoice_date").defaultNow(),
  dueDate: date("due_date"),
  totalAmount: integer("total_amount").notNull(),
  status: text("status").default("unpaid"), // unpaid, paid, cancelled
  notes: text("notes"),
});

// Invoice Items
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(),
  totalPrice: integer("total_price").notNull(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertPatientInfoSchema = createInsertSchema(patientInfo).omit({ id: true });
export const insertDoctorScheduleSchema = createInsertSchema(doctorSchedule).omit({ id: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true });
export const insertMedicalRecordSchema = createInsertSchema(medicalRecords).omit({ id: true });
export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({ id: true });
export const insertPrescriptionItemSchema = createInsertSchema(prescriptionItems).omit({ id: true });
export const insertMedicalFileSchema = createInsertSchema(medicalFiles).omit({ id: true });
export const insertInvoiceSchema = createInsertSchema(invoices, {
  dueDate: z.string().nullable().optional(),
  invoiceDate: z.string().nullable().optional(),
  status: z.string().default('unpaid'),
  notes: z.string().nullable().optional(),
  appointmentId: z.number().nullable().optional()
}).omit({ id: true });
export const insertInvoiceItemSchema = createInsertSchema(invoiceItems, {
  quantity: z.number().default(1)
}).omit({ id: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type PatientInfo = typeof patientInfo.$inferSelect;
export type InsertPatientInfo = z.infer<typeof insertPatientInfoSchema>;

export type DoctorSchedule = typeof doctorSchedule.$inferSelect;
export type InsertDoctorSchedule = z.infer<typeof insertDoctorScheduleSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

export type PrescriptionItem = typeof prescriptionItems.$inferSelect;
export type InsertPrescriptionItem = z.infer<typeof insertPrescriptionItemSchema>;

export type MedicalFile = typeof medicalFiles.$inferSelect;
export type InsertMedicalFile = z.infer<typeof insertMedicalFileSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
