import { MongoClient, Db, Collection } from 'mongodb';
import {
  users, User, InsertUser,
  patientInfo, PatientInfo, InsertPatientInfo,
  doctorSchedule, DoctorSchedule, InsertDoctorSchedule,
  appointments, Appointment, InsertAppointment,
  medicalRecords, MedicalRecord, InsertMedicalRecord,
  prescriptions, Prescription, InsertPrescription,
  prescriptionItems, PrescriptionItem, InsertPrescriptionItem,
  medicalFiles, MedicalFile, InsertMedicalFile,
  invoices, Invoice, InsertInvoice,
  invoiceItems, InvoiceItem, InsertInvoiceItem
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getUsers(role?: string): Promise<User[]>;

  // Patient information
  getPatientInfo(patientId: number): Promise<PatientInfo | undefined>;
  createPatientInfo(info: InsertPatientInfo): Promise<PatientInfo>;
  updatePatientInfo(patientId: number, info: Partial<PatientInfo>): Promise<PatientInfo | undefined>;

  // Doctor schedule
  getDoctorSchedule(doctorId: number): Promise<DoctorSchedule[]>;
  createDoctorSchedule(schedule: InsertDoctorSchedule): Promise<DoctorSchedule>;
  updateDoctorSchedule(id: number, schedule: Partial<DoctorSchedule>): Promise<DoctorSchedule | undefined>;
  deleteDoctorSchedule(id: number): Promise<boolean>;

  // Appointments
  getAppointment(id: number): Promise<Appointment | undefined>;
  getAppointmentsByDoctor(doctorId: number): Promise<Appointment[]>;
  getAppointmentsByPatient(patientId: number): Promise<Appointment[]>;
  getAppointmentsByDate(doctorId: number, date: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;

  // Medical records
  getMedicalRecord(id: number): Promise<MedicalRecord | undefined>;
  getMedicalRecordsByPatient(patientId: number): Promise<MedicalRecord[]>;
  getMedicalRecordsByAppointment(appointmentId: number): Promise<MedicalRecord | undefined>;
  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;
  updateMedicalRecord(id: number, record: Partial<MedicalRecord>): Promise<MedicalRecord | undefined>;

  // Prescriptions
  getPrescription(id: number): Promise<Prescription | undefined>;
  getPrescriptionsByPatient(patientId: number): Promise<Prescription[]>;
  getPrescriptionsByDoctor(doctorId: number): Promise<Prescription[]>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: number, prescription: Partial<Prescription>): Promise<Prescription | undefined>;

  // Prescription items
  getPrescriptionItems(prescriptionId: number): Promise<PrescriptionItem[]>;
  createPrescriptionItem(item: InsertPrescriptionItem): Promise<PrescriptionItem>;
  updatePrescriptionItem(id: number, item: Partial<PrescriptionItem>): Promise<PrescriptionItem | undefined>;
  deletePrescriptionItem(id: number): Promise<boolean>;

  // Medical files
  getMedicalFile(id: number): Promise<MedicalFile | undefined>;
  getMedicalFilesByPatient(patientId: number): Promise<MedicalFile[]>;
  getMedicalFilesByRecord(recordId: number): Promise<MedicalFile[]>;
  createMedicalFile(file: InsertMedicalFile): Promise<MedicalFile>;
  deleteMedicalFile(id: number): Promise<boolean>;

  // Invoices
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoices(): Promise<Invoice[]>;
  getInvoicesByPatient(patientId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<Invoice>): Promise<Invoice | undefined>;

  // Invoice items
  getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  updateInvoiceItem(id: number, item: Partial<InvoiceItem>): Promise<InvoiceItem | undefined>;
  deleteInvoiceItem(id: number): Promise<boolean>;
}

export class MongoStorage implements IStorage {
  private client: MongoClient;
  private db: Db;
  private collections: {
    users: Collection<User>;
    patientInfo: Collection<PatientInfo>;
    doctorSchedule: Collection<DoctorSchedule>;
    appointments: Collection<Appointment>;
    medicalRecords: Collection<MedicalRecord>;
    prescriptions: Collection<Prescription>;
    prescriptionItems: Collection<PrescriptionItem>;
    medicalFiles: Collection<MedicalFile>;
    invoices: Collection<Invoice>;
    invoiceItems: Collection<InvoiceItem>;
  };

  private userIdCounter: number = 1;
  private patientInfoIdCounter: number = 1;
  private doctorScheduleIdCounter: number = 1;
  private appointmentIdCounter: number = 1;
  private medicalRecordIdCounter: number = 1;
  private prescriptionIdCounter: number = 1;
  private prescriptionItemIdCounter: number = 1;
  private medicalFileIdCounter: number = 1;
  private invoiceIdCounter: number = 1;
  private invoiceItemIdCounter: number = 1;

  constructor() {
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/guhospital';
    this.client = new MongoClient(mongoUrl);
  }

  async connect() {
    await this.client.connect();
    this.db = this.client.db();

    this.collections = {
      users: this.db.collection<User>('users'),
      patientInfo: this.db.collection<PatientInfo>('patientInfo'),
      doctorSchedule: this.db.collection<DoctorSchedule>('doctorSchedule'),
      appointments: this.db.collection<Appointment>('appointments'),
      medicalRecords: this.db.collection<MedicalRecord>('medicalRecords'),
      prescriptions: this.db.collection<Prescription>('prescriptions'),
      prescriptionItems: this.db.collection<PrescriptionItem>('prescriptionItems'),
      medicalFiles: this.db.collection<MedicalFile>('medicalFiles'),
      invoices: this.db.collection<Invoice>('invoices'),
      invoiceItems: this.db.collection<InvoiceItem>('invoiceItems'),
    };

    // Initialize counters from existing data
    await this.initializeCounters();

    // Check if database is empty and initialize with sample data
    const userCount = await this.collections.users.countDocuments();
    if (userCount === 0) {
      await this.initializeData();
    }
  }

  private async initializeCounters() {
    const collections = [
      { name: 'users', counter: 'userIdCounter' },
      { name: 'patientInfo', counter: 'patientInfoIdCounter' },
      { name: 'doctorSchedule', counter: 'doctorScheduleIdCounter' },
      { name: 'appointments', counter: 'appointmentIdCounter' },
      { name: 'medicalRecords', counter: 'medicalRecordIdCounter' },
      { name: 'prescriptions', counter: 'prescriptionIdCounter' },
      { name: 'prescriptionItems', counter: 'prescriptionItemIdCounter' },
      { name: 'medicalFiles', counter: 'medicalFileIdCounter' },
      { name: 'invoices', counter: 'invoiceIdCounter' },
      { name: 'invoiceItems', counter: 'invoiceItemIdCounter' },
    ];

    for (const { name, counter } of collections) {
      const maxDoc = await this.collections[name as keyof typeof this.collections]
        .findOne({}, { sort: { id: -1 } });
      if (maxDoc && maxDoc.id) {
        (this as any)[counter] = maxDoc.id + 1;
      }
    }
  }

  private async initializeData() {
    // Create doctors
    const doctorAvimanyu = await this.createUser({
      username: "dr.avimanyu",
      password: "password",
      role: "doctor",
      email: "dr.avimanyu@medicare.com",
      fullName: "Dr. Avimanyu Dutta",
      phone: "+91 555-123-4567",
      gender: "male",
      specialization: "Cardiologist",
      languages: ["English", "Hindi", "Assamese"],
      profileImage: "/placeholder-doctor.png"
    });

    const doctorSanjana = await this.createUser({
      username: "dr.sanjana",
      password: "password",
      role: "doctor",
      email: "dr.sanjana@medicare.com",
      fullName: "Dr. Sanjana Das",
      phone: "+91 555-234-5678",
      gender: "female",
      specialization: "Neurologist",
      languages: ["English", "Hindi", "Assamese", "Bengali"],
      profileImage: "/placeholder-doctor.png"
    });

    const doctorSumit = await this.createUser({
      username: "dr.sumit",
      password: "password",
      role: "doctor",
      email: "dr.sumit@medicare.com",
      fullName: "Dr. Sumit Kumar",
      phone: "+91 555-345-6789",
      gender: "male",
      specialization: "Pediatrician",
      languages: ["English", "Hindi"],
      profileImage: "/placeholder-doctor.png"
    });

    // Create patients
    const patientAvimanyu = await this.createUser({
      username: "patient1",
      password: "password",
      role: "patient",
      email: "avimanyu.dutta@example.com",
      fullName: "Avimanyu Dutta",
      phone: "+91 555-987-6543",
      gender: "male",
      dateOfBirth: new Date("1980-05-15"),
      bloodGroup: "O+",
      address: "123 GS Road, Guwahati",
      profileImage: "/placeholder-patient.png"
    });

    const patientAbhinandita = await this.createUser({
      username: "patient2",
      password: "password",
      role: "patient",
      email: "abhinandita.kumar@example.com",
      fullName: "Abhinandita Kumar",
      phone: "+91 555-876-5432",
      gender: "female",
      dateOfBirth: new Date("1992-11-23"),
      bloodGroup: "A-",
      address: "456 Zoo Road, Guwahati",
      profileImage: "/placeholder-patient.png"
    });

    const patientDebojyoti = await this.createUser({
      username: "patient3",
      password: "password",
      role: "patient",
      email: "debojyoti.deb@example.com",
      fullName: "Debojyoti Deb",
      phone: "+91 555-765-4321",
      gender: "male",
      dateOfBirth: new Date("1975-08-07"),
      bloodGroup: "B+",
      address: "789 Maligaon, Guwahati",
      profileImage: "/placeholder-patient.png"
    });

    // Add patient information
    await this.createPatientInfo({
      patientId: 2,
      allergies: ["Penicillin", "Peanuts"],
      medicalConditions: ["Hypertension", "Type 2 Diabetes"],
      currentMedications: ["Metformin 500mg", "Lisinopril 10mg"],
      emergencyContact: "Jane Chen (Wife)",
      emergencyPhone: "+1 555-987-1234",
      height: "5'10\"",
      weight: "185 lbs"
    });

    // Add doctor schedules
    await this.createDoctorSchedule({
      doctorId: 1,
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
      isAvailable: true
    });

    // Create sample appointments
    const pastAppointment1 = await this.createAppointment({
      patientId: 2,
      doctorId: 1,
      date: new Date("2023-04-15"),
      time: "10:30",
      duration: 45,
      purpose: "Annual cardiac checkup",
      status: "completed",
      notes: "Patient reported occasional chest pain on exertion"
    });

    // Create medical records
    const medicalRecord1 = await this.createMedicalRecord({
      patientId: 2,
      appointmentId: 1,
      recordDate: new Date("2023-04-15"),
      diagnosis: "Stage 1 Hypertension",
      symptoms: ["Occasional chest pain", "Shortness of breath on exertion"],
      treatment: "Increased current medication dosage and recommended lifestyle modifications",
      notes: "Patient advised to follow a low-sodium diet and increase physical activity"
    });

    // Create prescriptions
    const prescription1 = await this.createPrescription({
      patientId: 2,
      doctorId: 1,
      appointmentId: 1,
      prescriptionDate: new Date("2023-04-15"),
      expiryDate: new Date("2023-07-15"),
      diagnosis: "Stage 1 Hypertension",
      notes: "Take medications as directed. Follow up in 3 months."
    });

    // Create prescription items
    await this.createPrescriptionItem({
      prescriptionId: 1,
      medicationName: "Lisinopril",
      dosage: "20mg",
      frequency: "Once daily",
      duration: "90 days",
      instructions: "Take in the morning with water"
    });

    // Create invoices
    const invoice1 = await this.createInvoice({
      patientId: 2,
      appointmentId: 1,
      invoiceDate: new Date("2023-04-15"),
      dueDate: new Date("2023-05-15"),
      totalAmount: 15000,
      status: "paid",
      notes: "Cardiac consultation and tests"
    });

    // Create invoice items
    await this.createInvoiceItem({
      invoiceId: 1,
      description: "Cardiac Consultation",
      quantity: 1,
      unitPrice: 10000,
      totalPrice: 10000
    });
  }

  // User Management
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.collections.users.findOne({ id });
    return result || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.collections.users.findOne({ username });
    return result || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...userData, id };
    await this.collections.users.insertOne(user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await this.collections.users.findOneAndUpdate(
      { id },
      { $set: userData },
      { returnDocument: 'after' }
    );
    return result || undefined;
  }

  async getUsers(role?: string): Promise<User[]> {
    const filter = role ? { role } : {};
    return await this.collections.users.find(filter).toArray();
  }

  // Patient Information
  async getPatientInfo(patientId: number): Promise<PatientInfo | undefined> {
    const result = await this.collections.patientInfo.findOne({ patientId });
    return result || undefined;
  }

  async createPatientInfo(info: InsertPatientInfo): Promise<PatientInfo> {
    const id = this.patientInfoIdCounter++;
    const patientInfo: PatientInfo = { ...info, id };
    await this.collections.patientInfo.insertOne(patientInfo);
    return patientInfo;
  }

  async updatePatientInfo(patientId: number, infoData: Partial<PatientInfo>): Promise<PatientInfo | undefined> {
    const result = await this.collections.patientInfo.findOneAndUpdate(
      { patientId },
      { $set: infoData },
      { returnDocument: 'after' }
    );
    return result || undefined;
  }

  // Doctor Schedule
  async getDoctorSchedule(doctorId: number): Promise<DoctorSchedule[]> {
    return await this.collections.doctorSchedule.find({ doctorId }).toArray();
  }

  async createDoctorSchedule(scheduleData: InsertDoctorSchedule): Promise<DoctorSchedule> {
    const id = this.doctorScheduleIdCounter++;
    const schedule: DoctorSchedule = { ...scheduleData, id };
    await this.collections.doctorSchedule.insertOne(schedule);
    return schedule;
  }

  async updateDoctorSchedule(id: number, scheduleData: Partial<DoctorSchedule>): Promise<DoctorSchedule | undefined> {
    const result = await this.collections.doctorSchedule.findOneAndUpdate(
      { id },
      { $set: scheduleData },
      { returnDocument: 'after' }
    );
    return result || undefined;
  }

  async deleteDoctorSchedule(id: number): Promise<boolean> {
    const result = await this.collections.doctorSchedule.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Appointments
  async getAppointment(id: number): Promise<Appointment | undefined> {
    const result = await this.collections.appointments.findOne({ id });
    return result || undefined;
  }

  async getAppointmentsByDoctor(doctorId: number): Promise<Appointment[]> {
    return await this.collections.appointments.find({ doctorId }).toArray();
  }

  async getAppointmentsByPatient(patientId: number): Promise<Appointment[]> {
    return await this.collections.appointments.find({ patientId }).toArray();
  }

  async getAppointmentsByDate(doctorId: number, date: string): Promise<Appointment[]> {
    return await this.collections.appointments.find({
      doctorId,
      date: new Date(date)
    }).toArray();
  }

  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentIdCounter++;
    const appointment: Appointment = { ...appointmentData, id };
    await this.collections.appointments.insertOne(appointment);
    return appointment;
  }

  async updateAppointment(id: number, appointmentData: Partial<Appointment>): Promise<Appointment | undefined> {
    const result = await this.collections.appointments.findOneAndUpdate(
      { id },
      { $set: appointmentData },
      { returnDocument: 'after' }
    );
    return result || undefined;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    const result = await this.collections.appointments.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Medical Records
  async getMedicalRecord(id: number): Promise<MedicalRecord | undefined> {
    const result = await this.collections.medicalRecords.findOne({ id });
    return result || undefined;
  }

  async getMedicalRecordsByPatient(patientId: number): Promise<MedicalRecord[]> {
    return await this.collections.medicalRecords.find({ patientId }).toArray();
  }

  async getMedicalRecordsByAppointment(appointmentId: number): Promise<MedicalRecord | undefined> {
    const result = await this.collections.medicalRecords.findOne({ appointmentId });
    return result || undefined;
  }

  async createMedicalRecord(recordData: InsertMedicalRecord): Promise<MedicalRecord> {
    const id = this.medicalRecordIdCounter++;
    const record: MedicalRecord = { ...recordData, id };
    await this.collections.medicalRecords.insertOne(record);
    return record;
  }

  async updateMedicalRecord(id: number, recordData: Partial<MedicalRecord>): Promise<MedicalRecord | undefined> {
    const result = await this.collections.medicalRecords.findOneAndUpdate(
      { id },
      { $set: recordData },
      { returnDocument: 'after' }
    );
    return result || undefined;
  }

  // Prescriptions
  async getPrescription(id: number): Promise<Prescription | undefined> {
    const result = await this.collections.prescriptions.findOne({ id });
    return result || undefined;
  }

  async getPrescriptionsByPatient(patientId: number): Promise<Prescription[]> {
    return await this.collections.prescriptions.find({ patientId }).toArray();
  }

  async getPrescriptionsByDoctor(doctorId: number): Promise<Prescription[]> {
    return await this.collections.prescriptions.find({ doctorId }).toArray();
  }

  async createPrescription(prescriptionData: InsertPrescription): Promise<Prescription> {
    const id = this.prescriptionIdCounter++;
    const prescription: Prescription = { ...prescriptionData, id };
    await this.collections.prescriptions.insertOne(prescription);
    return prescription;
  }

  async updatePrescription(id: number, prescriptionData: Partial<Prescription>): Promise<Prescription | undefined> {
    const result = await this.collections.prescriptions.findOneAndUpdate(
      { id },
      { $set: prescriptionData },
      { returnDocument: 'after' }
    );
    return result || undefined;
  }

  // Prescription Items
  async getPrescriptionItems(prescriptionId: number): Promise<PrescriptionItem[]> {
    return await this.collections.prescriptionItems.find({ prescriptionId }).toArray();
  }

  async createPrescriptionItem(itemData: InsertPrescriptionItem): Promise<PrescriptionItem> {
    const id = this.prescriptionItemIdCounter++;
    const item: PrescriptionItem = { ...itemData, id };
    await this.collections.prescriptionItems.insertOne(item);
    return item;
  }

  async updatePrescriptionItem(id: number, itemData: Partial<PrescriptionItem>): Promise<PrescriptionItem | undefined> {
    const result = await this.collections.prescriptionItems.findOneAndUpdate(
      { id },
      { $set: itemData },
      { returnDocument: 'after' }
    );
    return result || undefined;
  }

  async deletePrescriptionItem(id: number): Promise<boolean> {
    const result = await this.collections.prescriptionItems.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Medical Files
  async getMedicalFile(id: number): Promise<MedicalFile | undefined> {
    const result = await this.collections.medicalFiles.findOne({ id });
    return result || undefined;
  }

  async getMedicalFilesByPatient(patientId: number): Promise<MedicalFile[]> {
    return await this.collections.medicalFiles.find({ patientId }).toArray();
  }

  async getMedicalFilesByRecord(recordId: number): Promise<MedicalFile[]> {
    return await this.collections.medicalFiles.find({ recordId }).toArray();
  }

  async createMedicalFile(fileData: InsertMedicalFile): Promise<MedicalFile> {
    const id = this.medicalFileIdCounter++;
    const file: MedicalFile = { ...fileData, id };
    await this.collections.medicalFiles.insertOne(file);
    return file;
  }

  async deleteMedicalFile(id: number): Promise<boolean> {
    const result = await this.collections.medicalFiles.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Invoices
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const result = await this.collections.invoices.findOne({ id });
    return result || undefined;
  }

  async getInvoices(): Promise<Invoice[]> {
    return await this.collections.invoices.find().toArray();
  }

  async getInvoicesByPatient(patientId: number): Promise<Invoice[]> {
    return await this.collections.invoices.find({ patientId }).toArray();
  }

  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    const id = this.invoiceIdCounter++;
    const invoice: Invoice = { ...invoiceData, id };
    await this.collections.invoices.insertOne(invoice);
    return invoice;
  }

  async updateInvoice(id: number, invoiceData: Partial<Invoice>): Promise<Invoice | undefined> {
    const result = await this.collections.invoices.findOneAndUpdate(
      { id },
      { $set: invoiceData },
      { returnDocument: 'after' }
    );
    return result || undefined;
  }

  // Invoice Items
  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return await this.collections.invoiceItems.find({ invoiceId }).toArray();
  }

  async createInvoiceItem(itemData: InsertInvoiceItem): Promise<InvoiceItem> {
    const id = this.invoiceItemIdCounter++;
    const item: InvoiceItem = { ...itemData, id };
    await this.collections.invoiceItems.insertOne(item);
    return item;
  }

  async updateInvoiceItem(id: number, itemData: Partial<InvoiceItem>): Promise<InvoiceItem | undefined> {
    const result = await this.collections.invoiceItems.findOneAndUpdate(
      { id },
      { $set: itemData },
      { returnDocument: 'after' }
    );
    return result || undefined;
  }

  async deleteInvoiceItem(id: number): Promise<boolean> {
    const result = await this.collections.invoiceItems.deleteOne({ id });
    return result.deletedCount > 0;
  }
}

// Create and export storage instance
const mongoStorage = new MongoStorage();

// Initialize the connection
mongoStorage.connect().then(() => {
  console.log('Connected to MongoDB successfully');
}).catch((error) => {
  console.error('Failed to connect to MongoDB:', error);
});

export const storage = mongoStorage;