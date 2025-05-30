import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema,
  insertPatientInfoSchema,
  insertDoctorScheduleSchema,
  insertAppointmentSchema,
  insertMedicalRecordSchema,
  insertPrescriptionSchema,
  insertPrescriptionItemSchema,
  insertMedicalFileSchema,
  insertInvoiceSchema,
  insertInvoiceItemSchema
} from "@shared/schema";
import { z } from "zod";

// Middleware for verifying authentication
const authenticate = async (req: Request, res: Response, next: Function) => {
  const userId = req.headers['user-id'];

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await storage.getUser(Number(userId));
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  req.body.currentUser = user;
  next();
};

// Middleware for checking doctor role
const checkDoctorRole = (req: Request, res: Response, next: Function) => {
  const { currentUser } = req.body;

  if (currentUser.role !== 'doctor') {
    return res.status(403).json({ message: "Access denied" });
  }

  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Sanitize user data before sending
      const { password: _, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);

      // Sanitize user data before sending
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }

      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User routes
  app.get("/api/users", authenticate, async (req, res) => {
    try {
      const role = req.query.role as string | undefined;
      const users = await storage.getUsers(role);

      // Sanitize user data before sending
      const sanitizedUsers = users.map(({ password: _, ...user }) => user);

      res.json({ users: sanitizedUsers });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:id", authenticate, async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Sanitize user data before sending
      const { password: _, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create a new user (for doctors to create patients)
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);

      // Sanitize user data before sending
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }

      console.error("Create user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/users/:id", authenticate, async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const { currentUser } = req.body;

      // Check if the user is updating their own profile or is a doctor
      if (currentUser.id !== userId && currentUser.role !== 'doctor') {
        return res.status(403).json({ message: "Access denied" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't allow changing role or username
      const { role: _, username: __, password, profileImage, ...updateData } = req.body;

      // Handle profile image update if provided
      if (profileImage) {
        if (!profileImage.startsWith('data:image')) {
          return res.status(400).json({ message: "Invalid image format" });
        }
        updateData.profileImage = profileImage;
      }

      const updatedUser = await storage.updateUser(userId, updateData);

      // Sanitize user data before sending
      const { password: ___, ...userWithoutPassword } = updatedUser!;

      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Patient Info routes
  app.get("/api/patients/:patientId/info", authenticate, async (req, res) => {
    try {
      const patientId = Number(req.params.patientId);
      const { currentUser } = req.body;

      // Check if the user is accessing their own info or is a doctor
      if (currentUser.id !== patientId && currentUser.role !== 'doctor') {
        return res.status(403).json({ message: "Access denied" });
      }

      const patientInfo = await storage.getPatientInfo(patientId);

      if (!patientInfo) {
        return res.status(404).json({ message: "Patient info not found" });
      }

      res.json({ patientInfo });
    } catch (error) {
      console.error("Get patient info error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/patients/:patientId/info", authenticate, async (req, res) => {
    try {
      const patientId = Number(req.params.patientId);
      const { currentUser } = req.body;

      // Check if the user is creating their own info or is a doctor
      if (currentUser.id !== patientId && currentUser.role !== 'doctor') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Validate input
      const infoData = insertPatientInfoSchema.parse({ ...req.body, patientId });

      // Check if patient info already exists
      const existingInfo = await storage.getPatientInfo(patientId);
      if (existingInfo) {
        return res.status(400).json({ message: "Patient info already exists" });
      }

      const patientInfo = await storage.createPatientInfo(infoData);

      res.status(201).json({ patientInfo });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient info data", errors: error.errors });
      }

      console.error("Create patient info error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/patients/:patientId/info", authenticate, async (req, res) => {
    try {
      const patientId = Number(req.params.patientId);
      const { currentUser } = req.body;

      // Check if the user is updating their own info or is a doctor
      if (currentUser.id !== patientId && currentUser.role !== 'doctor') {
        return res.status(403).json({ message: "Access denied" });
      }

      const patientInfo = await storage.getPatientInfo(patientId);
      if (!patientInfo) {
        return res.status(404).json({ message: "Patient info not found" });
      }

      const updatedInfo = await storage.updatePatientInfo(patientId, req.body);

      res.json({ patientInfo: updatedInfo });
    } catch (error) {
      console.error("Update patient info error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Doctor Schedule routes
  app.get("/api/doctors/:doctorId/schedule", authenticate, async (req, res) => {
    try {
      const doctorId = Number(req.params.doctorId);

      const schedule = await storage.getDoctorSchedule(doctorId);

      res.json({ schedule });
    } catch (error) {
      console.error("Get doctor schedule error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/doctors/:doctorId/schedule", authenticate, checkDoctorRole, async (req, res) => {
    try {
      const doctorId = Number(req.params.doctorId);
      const { currentUser } = req.body;

      // Check if the doctor is creating their own schedule
      if (currentUser.id !== doctorId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Validate input
      const scheduleData = insertDoctorScheduleSchema.parse({ ...req.body, doctorId });

      const schedule = await storage.createDoctorSchedule(scheduleData);

      res.status(201).json({ schedule });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid schedule data", errors: error.errors });
      }

      console.error("Create doctor schedule error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/doctors/schedule/:scheduleId", authenticate, checkDoctorRole, async (req, res) => {
    try {
      const scheduleId = Number(req.params.scheduleId);
      const { currentUser } = req.body;

      const schedule = await storage.getDoctorSchedule(currentUser.id);
      const scheduleItem = schedule.find(s => s.id === scheduleId);

      if (!scheduleItem) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      // Check if the doctor is updating their own schedule
      if (scheduleItem.doctorId !== currentUser.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedSchedule = await storage.updateDoctorSchedule(scheduleId, req.body);

      res.json({ schedule: updatedSchedule });
    } catch (error) {
      console.error("Update doctor schedule error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/doctors/schedule/:scheduleId", authenticate, checkDoctorRole, async (req, res) => {
    try {
      const scheduleId = Number(req.params.scheduleId);
      const { currentUser } = req.body;

      const schedule = await storage.getDoctorSchedule(currentUser.id);
      const scheduleItem = schedule.find(s => s.id === scheduleId);

      if (!scheduleItem) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      // Check if the doctor is deleting their own schedule
      if (scheduleItem.doctorId !== currentUser.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteDoctorSchedule(scheduleId);

      res.json({ success: true });
    } catch (error) {
      console.error("Delete doctor schedule error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Appointment routes
  app.get("/api/appointments", authenticate, async (req, res) => {
    try {
      const { currentUser } = req.body;
      const doctorId = req.query.doctorId ? Number(req.query.doctorId) : undefined;
      const patientId = req.query.patientId ? Number(req.query.patientId) : undefined;
      const date = req.query.date as string | undefined;

      let appointments = [];

      if (doctorId && date) {
        appointments = await storage.getAppointmentsByDate(doctorId, date);
      } else if (doctorId) {
        appointments = await storage.getAppointmentsByDoctor(doctorId);
      } else if (patientId) {
        appointments = await storage.getAppointmentsByPatient(patientId);
      } else if (currentUser.role === 'doctor') {
        appointments = await storage.getAppointmentsByDoctor(currentUser.id);
      } else {
        appointments = await storage.getAppointmentsByPatient(currentUser.id);
      }

      // For each appointment, get the patient and doctor info
      const appointmentsWithUsers = await Promise.all(appointments.map(async (appointment) => {
        const patient = await storage.getUser(appointment.patientId);
        const doctor = await storage.getUser(appointment.doctorId);

        return {
          ...appointment,
          patient: patient ? { id: patient.id, fullName: patient.fullName, profileImage: patient.profileImage } : null,
          doctor: doctor ? { id: doctor.id, fullName: doctor.fullName, specialization: doctor.specialization } : null
        };
      }));

      res.json({ appointments: appointmentsWithUsers });
    } catch (error) {
      console.error("Get appointments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/appointments/:id", authenticate, async (req, res) => {
    try {
      const appointmentId = Number(req.params.id);
      const { currentUser } = req.body;

      const appointment = await storage.getAppointment(appointmentId);

      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Check if the user is the patient or the doctor for this appointment
      if (currentUser.id !== appointment.patientId && currentUser.id !== appointment.doctorId && currentUser.role !== 'doctor') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get patient and doctor info
      const patient = await storage.getUser(appointment.patientId);
      const doctor = await storage.getUser(appointment.doctorId);

      const appointmentWithUsers = {
        ...appointment,
        patient: patient ? { id: patient.id, fullName: patient.fullName, profileImage: patient.profileImage } : null,
        doctor: doctor ? { id: doctor.id, fullName: doctor.fullName, specialization: doctor.specialization } : null
      };

      res.json({ appointment: appointmentWithUsers });
    } catch (error) {
      console.error("Get appointment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/appointments", authenticate, async (req, res) => {
    try {
      const { currentUser } = req.body;

      // Validate input
      const appointmentData = insertAppointmentSchema.parse(req.body);

      // Check if the patient exists
      const patient = await storage.getUser(appointmentData.patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Check if the doctor exists
      const doctor = await storage.getUser(appointmentData.doctorId);
      if (!doctor || doctor.role !== 'doctor') {
        return res.status(404).json({ message: "Doctor not found" });
      }

      // Check if the user is the patient or a doctor
      if (currentUser.id !== appointmentData.patientId && currentUser.role !== 'doctor') {
        return res.status(403).json({ message: "Access denied" });
      }

      const appointment = await storage.createAppointment(appointmentData);

      // Get patient and doctor info for response
      const appointmentWithUsers = {
        ...appointment,
        patient: { id: patient.id, fullName: patient.fullName, profileImage: patient.profileImage },
        doctor: { id: doctor.id, fullName: doctor.fullName, specialization: doctor.specialization }
      };

      res.status(201).json({ appointment: appointmentWithUsers });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }

      console.error("Create appointment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/appointments/:id", authenticate, async (req, res) => {
    try {
      const appointmentId = Number(req.params.id);
      const { currentUser } = req.body;

      const appointment = await storage.getAppointment(appointmentId);

      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Check if the user is the patient or the doctor for this appointment
      if (currentUser.id !== appointment.patientId && currentUser.id !== appointment.doctorId && currentUser.role !== 'doctor') {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedAppointment = await storage.updateAppointment(appointmentId, req.body);

      // Get patient and doctor info for response
      const patient = await storage.getUser(updatedAppointment!.patientId);
      const doctor = await storage.getUser(updatedAppointment!.doctorId);

      const appointmentWithUsers = {
        ...updatedAppointment,
        patient: patient ? { id: patient.id, fullName: patient.fullName, profileImage: patient.profileImage } : null,
        doctor: doctor ? { id: doctor.id, fullName: doctor.fullName, specialization: doctor.specialization } : null
      };

      res.json({ appointment: appointmentWithUsers });
    } catch (error) {
      console.error("Update appointment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/appointments/:id", authenticate, async (req, res) => {
    try {
      const appointmentId = Number(req.params.id);
      const { currentUser } = req.body;

      const appointment = await storage.getAppointment(appointmentId);

      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Check if the user is the patient or the doctor for this appointment
      if (currentUser.id !== appointment.patientId && currentUser.id !== appointment.doctorId && currentUser.role !== 'doctor') {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteAppointment(appointmentId);

      res.json({ success: true });
    } catch (error) {
      console.error("Delete appointment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Medical Records routes
  app.get("/api/medical-records", authenticate, async (req, res) => {
    try {
      const { patientId } = req.query;
      const { currentUser } = req.body;

      let records = [];

      if (patientId) {
        const patientIdNum = Number(patientId);

        // Check if the user is the patient or a doctor when requesting specific patient records
        if (currentUser.id !== patientIdNum && currentUser.role !== 'doctor') {
          return res.status(403).json({ message: "Access denied" });
        }

        records = await storage.getMedicalRecordsByPatient(patientIdNum);
      } else {
        // For non-specific requests, only doctors can see all records
        if (currentUser.role !== 'doctor') {
          return res.status(403).json({ message: "Access denied" });
        }

        // Get all records from all patients
        // This is just a simple implementation; in a real app, you might want pagination
        const patients = await storage.getUsers('patient');
        records = [];

        for (const patient of patients) {
          const patientRecords = await storage.getMedicalRecordsByPatient(patient.id);
          records = [...records, ...patientRecords];
        }
      }

      // Enhance records with patient details
      const enhancedRecords = await Promise.all(records.map(async (record) => {
        const patient = await storage.getUser(record.patientId);
        return { ...record, patient };
      }));

      res.json({ records: enhancedRecords });
    } catch (error) {
      console.error("Get medical records error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/patients/:patientId/medical-records", authenticate, async (req, res) => {
    try {
      const patientId = Number(req.params.patientId);
      const { currentUser } = req.body;

      // Check if the user is the patient or a doctor
      if (currentUser.id !== patientId && currentUser.role !== 'doctor') {
        return res.status(403).json({ message: "Access denied" });
      }

      const records = await storage.getMedicalRecordsByPatient(patientId);

      res.json({ records });
    } catch (error) {
      console.error("Get medical records error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/medical-records/:id", authenticate, async (req, res) => {
    try {
      const recordId = Number(req.params.id);
      const { currentUser } = req.body;

      const record = await storage.getMedicalRecord(recordId);

      if (!record) {
        return res.status(404).json({ message: "Medical record not found" });
      }

      // Check if the user is the patient or a doctor
      if (currentUser.id !== record.patientId && currentUser.role !== 'doctor') {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json({ record });
    } catch (error) {
      console.error("Get medical record error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/medical-records", authenticate, checkDoctorRole, async (req, res) => {
    try {
      // Validate input
      const recordData = insertMedicalRecordSchema.parse(req.body);

      // Check if the patient exists
      const patient = await storage.getUser(recordData.patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const record = await storage.createMedicalRecord(recordData);

      res.status(201).json({ record });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid medical record data", errors: error.errors });
      }

      console.error("Create medical record error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/medical-records/:id", authenticate, checkDoctorRole, async (req, res) => {
    try {
      const recordId = Number(req.params.id);

      const record = await storage.getMedicalRecord(recordId);

      if (!record) {
        return res.status(404).json({ message: "Medical record not found" });
      }

      const updatedRecord = await storage.updateMedicalRecord(recordId, req.body);

      res.json({ record: updatedRecord });
    } catch (error) {
      console.error("Update medical record error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Prescription routes
  app.get("/api/prescriptions", authenticate, async (req, res) => {
    try {
      const { currentUser } = req.body;
      const patientId = req.query.patientId ? Number(req.query.patientId) : undefined;
      const doctorId = req.query.doctorId ? Number(req.query.doctorId) : undefined;

      let prescriptions = [];

      if (patientId) {
        // Check if the user is the patient or a doctor
        if (currentUser.id !== patientId && currentUser.role !== 'doctor') {
          return res.status(403).json({ message: "Access denied" });
        }

        prescriptions = await storage.getPrescriptionsByPatient(patientId);
      } else if (doctorId) {
        // Check if the user is the doctor
        if (currentUser.id !== doctorId && currentUser.role !== 'doctor') {
          return res.status(403).json({ message: "Access denied" });
        }

        prescriptions = await storage.getPrescriptionsByDoctor(doctorId);
      } else if (currentUser.role === 'doctor') {
        prescriptions = await storage.getPrescriptionsByDoctor(currentUser.id);
      } else {
        prescriptions = await storage.getPrescriptionsByPatient(currentUser.id);
      }

      // For each prescription, get the patient and doctor info
      const prescriptionsWithUsers = await Promise.all(prescriptions.map(async (prescription) => {
        const patient = await storage.getUser(prescription.patientId);
        const doctor = await storage.getUser(prescription.doctorId);
        const items = await storage.getPrescriptionItems(prescription.id);

        return {
          ...prescription,
          patient: patient ? { id: patient.id, fullName: patient.fullName } : null,
          doctor: doctor ? { id: doctor.id, fullName: doctor.fullName, specialization: doctor.specialization } : null,
          items
        };
      }));

      res.json({ prescriptions: prescriptionsWithUsers });
    } catch (error) {
      console.error("Get prescriptions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/prescriptions/:id", authenticate, async (req, res) => {
    try {
      const prescriptionId = Number(req.params.id);
      const { currentUser } = req.body;

      const prescription = await storage.getPrescription(prescriptionId);

      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }

      // Check if the user is the patient or the doctor for this prescription
      if (currentUser.id !== prescription.patientId && currentUser.id !== prescription.doctorId && currentUser.role !== 'doctor') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get patient and doctor info
      const patient = await storage.getUser(prescription.patientId);
      const doctor = await storage.getUser(prescription.doctorId);
      const items = await storage.getPrescriptionItems(prescription.id);

      const prescriptionWithDetails = {
        ...prescription,
        patient: patient ? { id: patient.id, fullName: patient.fullName } : null,
        doctor: doctor ? { id: doctor.id, fullName: doctor.fullName, specialization: doctor.specialization } : null,
        items
      };

      res.json({ prescription: prescriptionWithDetails });
    } catch (error) {
      console.error("Get prescription error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/prescriptions", authenticate, checkDoctorRole, async (req, res) => {
    try {
      const { currentUser, items, ...prescriptionData } = req.body;

      // Validate input
      const validatedData = insertPrescriptionSchema.parse({
        ...prescriptionData,
        doctorId: currentUser.id
      });

      // Check if the patient exists
      const patient = await storage.getUser(validatedData.patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const prescription = await storage.createPrescription(validatedData);

      // Add prescription items if provided
      if (items && Array.isArray(items) && items.length > 0) {
        const createdItems = await Promise.all(items.map(item => 
          storage.createPrescriptionItem({
            ...item,
            prescriptionId: prescription.id
          })
        ));

        // Get patient and doctor info for response
        const prescriptionWithDetails = {
          ...prescription,
          patient: { id: patient.id, fullName: patient.fullName },
          doctor: { 
            id: currentUser.id, 
            fullName: currentUser.fullName, 
            specialization: currentUser.specialization 
          },
          items: createdItems
        };

        res.status(201).json({ prescription: prescriptionWithDetails });
      } else {
        // Get patient and doctor info for response
        const prescriptionWithDetails = {
          ...prescription,
          patient: { id: patient.id, fullName: patient.fullName },
          doctor: { 
            id: currentUser.id, 
            fullName: currentUser.fullName, 
            specialization: currentUser.specialization 
          },
          items: []
        };

        res.status(201).json({ prescription: prescriptionWithDetails });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid prescription data", errors: error.errors });
      }

      console.error("Create prescription error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/prescriptions/:prescriptionId/items", authenticate, checkDoctorRole, async (req, res) => {
    try {
      const prescriptionId = Number(req.params.prescriptionId);
      const { currentUser } = req.body;

      const prescription = await storage.getPrescription(prescriptionId);

      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }

      // Check if the doctor is the one who created the prescription
      if (currentUser.id !== prescription.doctorId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Validate input
      const itemData = insertPrescriptionItemSchema.parse({
        ...req.body,
        prescriptionId
      });

      const item = await storage.createPrescriptionItem(itemData);

      res.status(201).json({ item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid prescription item data", errors: error.errors });
      }

      console.error("Create prescription item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Medical Files routes
  app.get("/api/patients/:patientId/files", authenticate, async (req, res) => {
    try {
      const patientId = Number(req.params.patientId);
      const { currentUser } = req.body;

      // Check if the user is the patient or a doctor
      if (currentUser.id !== patientId && currentUser.role !== 'doctor') {
        return res.status(403).json({ message: "Access denied" });
      }      const files = await storage.getMedicalFilesByPatient(patientId);

      res.json({ files });
    } catch (error) {
      console.error("Get medical files error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/medical-files", authenticate, async (req, res) => {
    try {
      const { currentUser } = req.body;

      // Validate input
      const fileData = insertMedicalFileSchema.parse(req.body);

      // Check if the user is the patient or a doctor
      if (currentUser.id !== fileData.patientId && currentUser.role !== 'doctor') {
        return res.status(403).json({ message: "Access denied" });
      }

      const file = await storage.createMedicalFile(fileData);

      res.status(201).json({ file });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid medical file data", errors: error.errors });
      }

      console.error("Create medical file error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/medical-files/:id", authenticate, async (req, res) => {
    try {
      const fileId = Number(req.params.id);
      const { currentUser } = req.body;

      const file = await storage.getMedicalFile(fileId);

      if (!file) {
        return res.status(404).json({ message: "Medical file not found" });
      }

      // Check if the user is the patient or a doctor
      if (currentUser.id !== file.patientId && currentUser.role !== 'doctor') {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteMedicalFile(fileId);

      res.json({ success: true });
    } catch (error) {
      console.error("Delete medical file error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Invoice routes
  // Get all invoices - for admin/doctor to see all invoices
  app.get("/api/invoices", async (req, res) => {
    try {
      // Get all users to get patient names
      const users = await storage.getUsers();

      // Get all invoices 
      const allInvoices = await storage.getInvoices();

      // Get invoice items for each invoice and add patient name
      const invoicesWithDetails = await Promise.all(allInvoices.map(async invoice => {
        const items = await storage.getInvoiceItems(invoice.id);
        const patient = users.find(user => user.id === invoice.patientId);

        return { 
          ...invoice, 
          items,
          patientName: patient ? patient.fullName : 'Unknown'
        };
      }));

      res.json({ invoices: invoicesWithDetails });
    } catch (error) {
      console.error("Get all invoices error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/patients/:patientId/invoices", async (req, res) => {
    try {
      const patientId = Number(req.params.patientId);

      const invoices = await storage.getInvoicesByPatient(patientId);

      // Get invoice items for each invoice
      const invoicesWithItems = await Promise.all(invoices.map(async invoice => {
        const items = await storage.getInvoiceItems(invoice.id);
        return { ...invoice, items };
      }));

      res.json({ invoices: invoicesWithItems });
    } catch (error) {
      console.error("Get invoices error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get invoice by ID
  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoiceId = Number(req.params.id);

      const invoice = await storage.getInvoice(invoiceId);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Get invoice items
      const items = await storage.getInvoiceItems(invoice.id);

      // Get patient info
      const patient = await storage.getUser(invoice.patientId);

      const invoiceWithDetails = {
        ...invoice,
        items,
        patient: patient ? { 
          id: patient.id, 
          fullName: patient.fullName,
          address: patient.address,
          phone: patient.phone,
          email: patient.email
        } : null
      };

      res.json({ invoice: invoiceWithDetails });
    } catch (error) {
      console.error("Get invoice error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Download invoice as HTML
  app.get("/api/invoices/:invoiceId/download", async (req, res) => {
    try {
      const invoiceId = Number(req.params.invoiceId);
      const invoice = await storage.getInvoice(invoiceId);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Generate HTML invoice
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #${invoice.id}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
            color: #333;
        }
        .header {
            border-bottom: 2px solid #0066cc;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .hospital-name {
            font-size: 28px;
            font-weight: bold;
            color: #0066cc;
            margin-bottom: 5px;
        }
        .hospital-tagline {
            color: #666;
            font-size: 14px;
        }
        .invoice-title {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin: 30px 0;
            color: #0066cc;
        }
        .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        .detail-section h3 {
            color: #0066cc;
            font-size: 16px;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            font-size: 14px;
        }
        .detail-label {
            font-weight: bold;
            color: #555;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
        }
        .items-table th {
            background-color: #0066cc;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
        }
        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
        }
        .items-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .text-right {
            text-align: right;
        }
        .total-section {
            margin-top: 30px;
            border-top: 2px solid #0066cc;
            padding-top: 20px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 16px;
        }
        .total-final {
            font-weight: bold;
            font-size: 18px;
            color: #0066cc;
            border-top: 1px solid #ddd;
            padding-top: 10px;
            margin-top: 10px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-paid {
            background-color: #d4edda;
            color: #155724;
        }
        .status-unpaid {
            background-color: #fff3cd;
            color: #856404;
        }
        .status-cancelled {
            background-color: #f8d7da;
            color: #721c24;
        }
        .notes-section {
            margin-top: 30px;
            padding: 20px;
            background-color: #f8f9fa;
            border-left: 4px solid #0066cc;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        @media print {
            body {
                margin: 0;
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="hospital-name">GU Hospital Management System</div>
        <div class="hospital-tagline">Quality Healthcare for Everyone</div>
    </div>

    <div class="invoice-title">INVOICE</div>

    <div class="invoice-details">
        <div class="detail-section">
            <h3>Invoice Information</h3>
            <div class="detail-row">
                <span class="detail-label">Invoice Number:</span>
                <span>#${invoice.id}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Invoice Date:</span>
                <span>${invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Due Date:</span>
                <span>${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span>
            </div>
        </div>

        <div class="detail-section">
            <h3>Patient Information</h3>
            <div class="detail-row">
                <span class="detail-label">Patient Name:</span>
                <span>${invoice.patient?.fullName || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span>${invoice.patient?.email || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span>${invoice.patient?.phone || 'N/A'}</span>
            </div>
            ${invoice.patient?.address ? `
            <div class="detail-row">
                <span class="detail-label">Address:</span>
                <span>${invoice.patient.address}</span>
            </div>
            ` : ''}
        </div>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th>Description</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            ${invoice.items && invoice.items.length > 0 ? invoice.items.map(item => `
            <tr>
                <td>${item.description}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">₹${Math.floor(item.unitPrice)}</td>
                <td class="text-right">₹${Math.floor(item.totalPrice)}</td>
            </tr>
            `).join('') : `
            <tr>
                <td colspan="4" style="text-align: center; color: #666; font-style: italic;">No items added</td>
            </tr>
            `}
        </tbody>
    </table>

    <div class="total-section">
        <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${Math.floor(invoice.totalAmount)}</span>
        </div>
        <div class="total-row total-final">
            <span>Total Amount:</span>
            <span>₹${Math.floor(invoice.totalAmount)}</span>
        </div>
    </div>

    ${invoice.notes ? `
    <div class="notes-section">
        <h3 style="margin-top: 0; color: #0066cc;">Notes</h3>
        <p style="margin: 0;">${invoice.notes}</p>
    </div>
    ` : ''}

    <div class="footer">
        <p>Thank you for choosing GU Hospital Management System</p>
        <p>This is a computer-generated invoice and does not require a signature.</p>
    </div>
</body>
</html>`;

      // Set headers for HTML download
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.id}.html"`);
      res.send(htmlContent);

    } catch (error) {
      console.error("Download invoice error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const { items, ...invoiceData } = req.body;

      console.log("Received invoice data:", JSON.stringify(invoiceData));
      console.log("Received items:", JSON.stringify(items));

      // Manual validation and data preparation instead of using Zod schema
      const preparedData = {
        patientId: Number(invoiceData.patientId),
        status: invoiceData.status || 'unpaid',
        notes: invoiceData.notes || null,
        appointmentId: invoiceData.appointmentId ? Number(invoiceData.appointmentId) : null,
        invoiceDate: invoiceData.invoiceDate || new Date().toISOString().split('T')[0],
        dueDate: invoiceData.dueDate || null,
        // Calculate total amount from items if not provided
        totalAmount: invoiceData.totalAmount || (
          (items && Array.isArray(items) && items.length > 0) 
            ? items.reduce((total, item) => total + (Number(item.quantity || 1) * Number(item.unitPrice || 0)), 0)
            : 0
        )
      };

      console.log("Prepared invoice data:", JSON.stringify(preparedData));

      // Check if the patient exists
      const patient = await storage.getUser(preparedData.patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const invoice = await storage.createInvoice(preparedData);

      // Add invoice items if provided
      if (items && Array.isArray(items) && items.length > 0) {
        const createdItems = await Promise.all(items.map(item => 
          storage.createInvoiceItem({
            description: item.description,
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
            totalPrice: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
            invoiceId: invoice.id
          })
        ));

        const invoiceWithDetails = {
          ...invoice,
          items: createdItems,
          patient: { 
            id: patient.id, 
            fullName: patient.fullName,
            address: patient.address,
            phone: patient.phone,
            email: patient.email
          }
        };

        res.status(201).json({ invoice: invoiceWithDetails });
      } else {
        const invoiceWithDetails = {
          ...invoice,
          items: [],
          patient: { 
            id: patient.id, 
            fullName: patient.fullName,
            address: patient.address,
            phone: patient.phone,
            email: patient.email
          }
        };

        res.status(201).json({ invoice: invoiceWithDetails });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error details:", JSON.stringify(error.errors, null, 2));
        console.error("Invoice data that failed validation:", JSON.stringify(req.body, null, 2));
        return res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
      }

      console.error("Create invoice error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/invoices/:invoiceId/items", async (req, res) => {
    try {
      const invoiceId = Number(req.params.invoiceId);

      const invoice = await storage.getInvoice(invoiceId);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Manual validation and preparation
      const preparedItem = {
        invoiceId: invoiceId,
        description: req.body.description || '',
        quantity: Number(req.body.quantity) || 1,
        unitPrice: Number(req.body.unitPrice) || 0,
        totalPrice: (Number(req.body.quantity) || 1) * (Number(req.body.unitPrice) || 0)
      };

      console.log("Prepared invoice item:", JSON.stringify(preparedItem));

      const item = await storage.createInvoiceItem(preparedItem);

      // Update total amount in invoice
      const items = await storage.getInvoiceItems(invoiceId);
      const totalAmount = items.reduce((total, item) => total + item.totalPrice, 0);

      await storage.updateInvoice(invoiceId, { totalAmount });

      res.status(201).json({ item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invoice item data", errors: error.errors });
      }

      console.error("Create invoice item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}