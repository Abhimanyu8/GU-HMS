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
  getInvoicesByPatient(patientId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<Invoice>): Promise<Invoice | undefined>;

  // Invoice items
  getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  updateInvoiceItem(id: number, item: Partial<InvoiceItem>): Promise<InvoiceItem | undefined>;
  deleteInvoiceItem(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patientInfo: Map<number, PatientInfo>;
  private doctorSchedules: Map<number, DoctorSchedule>;
  private appointments: Map<number, Appointment>;
  private medicalRecords: Map<number, MedicalRecord>;
  private prescriptions: Map<number, Prescription>;
  private prescriptionItems: Map<number, PrescriptionItem>;
  private medicalFiles: Map<number, MedicalFile>;
  private invoices: Map<number, Invoice>;
  private invoiceItems: Map<number, InvoiceItem>;

  private userIdCounter: number;
  private patientInfoIdCounter: number;
  private doctorScheduleIdCounter: number;
  private appointmentIdCounter: number;
  private medicalRecordIdCounter: number;
  private prescriptionIdCounter: number;
  private prescriptionItemIdCounter: number;
  private medicalFileIdCounter: number;
  private invoiceIdCounter: number;
  private invoiceItemIdCounter: number;

  constructor() {
    this.users = new Map();
    this.patientInfo = new Map();
    this.doctorSchedules = new Map();
    this.appointments = new Map();
    this.medicalRecords = new Map();
    this.prescriptions = new Map();
    this.prescriptionItems = new Map();
    this.medicalFiles = new Map();
    this.invoices = new Map();
    this.invoiceItems = new Map();

    this.userIdCounter = 1;
    this.patientInfoIdCounter = 1;
    this.doctorScheduleIdCounter = 1;
    this.appointmentIdCounter = 1;
    this.medicalRecordIdCounter = 1;
    this.prescriptionIdCounter = 1;
    this.prescriptionItemIdCounter = 1;
    this.medicalFileIdCounter = 1;
    this.invoiceIdCounter = 1;
    this.invoiceItemIdCounter = 1;

    // Add sample data for testing
    this.initializeData();
  }

  private initializeData() {
    // Create a doctor
    this.createUser({
      username: "dr.johnson",
      password: "password",
      role: "doctor",
      email: "dr.johnson@medicare.com",
      fullName: "Dr. Sarah Johnson",
      phone: "+1 555-123-4567",
      gender: "female",
      specialization: "Cardiologist",
      languages: ["English", "Hindi"],
      profileImage: ""
    });

    // Create a patient
    this.createUser({
      username: "patient1",
      password: "password",
      role: "patient",
      email: "patient1@example.com",
      fullName: "Robert Chen",
      phone: "+1 555-987-6543",
      gender: "male",
      dateOfBirth: new Date("1980-05-15"),
      bloodGroup: "O+",
      address: "123 Main St, Anytown, USA"
    });
  }

  // User Management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...userData, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsers(role?: string): Promise<User[]> {
    const allUsers = Array.from(this.users.values());
    if (role) {
      return allUsers.filter(user => user.role === role);
    }
    return allUsers;
  }

  // Patient Information
  async getPatientInfo(patientId: number): Promise<PatientInfo | undefined> {
    return Array.from(this.patientInfo.values()).find(
      (info) => info.patientId === patientId
    );
  }

  async createPatientInfo(info: InsertPatientInfo): Promise<PatientInfo> {
    const id = this.patientInfoIdCounter++;
    const patientInfo: PatientInfo = { ...info, id };
    this.patientInfo.set(id, patientInfo);
    return patientInfo;
  }

  async updatePatientInfo(patientId: number, infoData: Partial<PatientInfo>): Promise<PatientInfo | undefined> {
    const info = Array.from(this.patientInfo.values()).find(
      info => info.patientId === patientId
    );
    
    if (!info) return undefined;

    const updatedInfo = { ...info, ...infoData };
    this.patientInfo.set(info.id, updatedInfo);
    return updatedInfo;
  }

  // Doctor Schedule
  async getDoctorSchedule(doctorId: number): Promise<DoctorSchedule[]> {
    return Array.from(this.doctorSchedules.values()).filter(
      (schedule) => schedule.doctorId === doctorId
    );
  }

  async createDoctorSchedule(scheduleData: InsertDoctorSchedule): Promise<DoctorSchedule> {
    const id = this.doctorScheduleIdCounter++;
    const schedule: DoctorSchedule = { ...scheduleData, id };
    this.doctorSchedules.set(id, schedule);
    return schedule;
  }

  async updateDoctorSchedule(id: number, scheduleData: Partial<DoctorSchedule>): Promise<DoctorSchedule | undefined> {
    const schedule = this.doctorSchedules.get(id);
    if (!schedule) return undefined;

    const updatedSchedule = { ...schedule, ...scheduleData };
    this.doctorSchedules.set(id, updatedSchedule);
    return updatedSchedule;
  }

  async deleteDoctorSchedule(id: number): Promise<boolean> {
    return this.doctorSchedules.delete(id);
  }

  // Appointments
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async getAppointmentsByDoctor(doctorId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.doctorId === doctorId
    );
  }

  async getAppointmentsByPatient(patientId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.patientId === patientId
    );
  }

  async getAppointmentsByDate(doctorId: number, date: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => 
        appointment.doctorId === doctorId && 
        appointment.date.toString() === date
    );
  }

  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentIdCounter++;
    const appointment: Appointment = { ...appointmentData, id };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async updateAppointment(id: number, appointmentData: Partial<Appointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;

    const updatedAppointment = { ...appointment, ...appointmentData };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }

  // Medical Records
  async getMedicalRecord(id: number): Promise<MedicalRecord | undefined> {
    return this.medicalRecords.get(id);
  }

  async getMedicalRecordsByPatient(patientId: number): Promise<MedicalRecord[]> {
    return Array.from(this.medicalRecords.values()).filter(
      (record) => record.patientId === patientId
    );
  }

  async getMedicalRecordsByAppointment(appointmentId: number): Promise<MedicalRecord | undefined> {
    return Array.from(this.medicalRecords.values()).find(
      (record) => record.appointmentId === appointmentId
    );
  }

  async createMedicalRecord(recordData: InsertMedicalRecord): Promise<MedicalRecord> {
    const id = this.medicalRecordIdCounter++;
    const record: MedicalRecord = { ...recordData, id };
    this.medicalRecords.set(id, record);
    return record;
  }

  async updateMedicalRecord(id: number, recordData: Partial<MedicalRecord>): Promise<MedicalRecord | undefined> {
    const record = this.medicalRecords.get(id);
    if (!record) return undefined;

    const updatedRecord = { ...record, ...recordData };
    this.medicalRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  // Prescriptions
  async getPrescription(id: number): Promise<Prescription | undefined> {
    return this.prescriptions.get(id);
  }

  async getPrescriptionsByPatient(patientId: number): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values()).filter(
      (prescription) => prescription.patientId === patientId
    );
  }

  async getPrescriptionsByDoctor(doctorId: number): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values()).filter(
      (prescription) => prescription.doctorId === doctorId
    );
  }

  async createPrescription(prescriptionData: InsertPrescription): Promise<Prescription> {
    const id = this.prescriptionIdCounter++;
    const prescription: Prescription = { ...prescriptionData, id };
    this.prescriptions.set(id, prescription);
    return prescription;
  }

  async updatePrescription(id: number, prescriptionData: Partial<Prescription>): Promise<Prescription | undefined> {
    const prescription = this.prescriptions.get(id);
    if (!prescription) return undefined;

    const updatedPrescription = { ...prescription, ...prescriptionData };
    this.prescriptions.set(id, updatedPrescription);
    return updatedPrescription;
  }

  // Prescription Items
  async getPrescriptionItems(prescriptionId: number): Promise<PrescriptionItem[]> {
    return Array.from(this.prescriptionItems.values()).filter(
      (item) => item.prescriptionId === prescriptionId
    );
  }

  async createPrescriptionItem(itemData: InsertPrescriptionItem): Promise<PrescriptionItem> {
    const id = this.prescriptionItemIdCounter++;
    const item: PrescriptionItem = { ...itemData, id };
    this.prescriptionItems.set(id, item);
    return item;
  }

  async updatePrescriptionItem(id: number, itemData: Partial<PrescriptionItem>): Promise<PrescriptionItem | undefined> {
    const item = this.prescriptionItems.get(id);
    if (!item) return undefined;

    const updatedItem = { ...item, ...itemData };
    this.prescriptionItems.set(id, updatedItem);
    return updatedItem;
  }

  async deletePrescriptionItem(id: number): Promise<boolean> {
    return this.prescriptionItems.delete(id);
  }

  // Medical Files
  async getMedicalFile(id: number): Promise<MedicalFile | undefined> {
    return this.medicalFiles.get(id);
  }

  async getMedicalFilesByPatient(patientId: number): Promise<MedicalFile[]> {
    return Array.from(this.medicalFiles.values()).filter(
      (file) => file.patientId === patientId
    );
  }

  async getMedicalFilesByRecord(recordId: number): Promise<MedicalFile[]> {
    return Array.from(this.medicalFiles.values()).filter(
      (file) => file.recordId === recordId
    );
  }

  async createMedicalFile(fileData: InsertMedicalFile): Promise<MedicalFile> {
    const id = this.medicalFileIdCounter++;
    const file: MedicalFile = { ...fileData, id };
    this.medicalFiles.set(id, file);
    return file;
  }

  async deleteMedicalFile(id: number): Promise<boolean> {
    return this.medicalFiles.delete(id);
  }

  // Invoices
  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoicesByPatient(patientId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      (invoice) => invoice.patientId === patientId
    );
  }

  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    const id = this.invoiceIdCounter++;
    const invoice: Invoice = { ...invoiceData, id };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async updateInvoice(id: number, invoiceData: Partial<Invoice>): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;

    const updatedInvoice = { ...invoice, ...invoiceData };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  // Invoice Items
  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return Array.from(this.invoiceItems.values()).filter(
      (item) => item.invoiceId === invoiceId
    );
  }

  async createInvoiceItem(itemData: InsertInvoiceItem): Promise<InvoiceItem> {
    const id = this.invoiceItemIdCounter++;
    const item: InvoiceItem = { ...itemData, id };
    this.invoiceItems.set(id, item);
    return item;
  }

  async updateInvoiceItem(id: number, itemData: Partial<InvoiceItem>): Promise<InvoiceItem | undefined> {
    const item = this.invoiceItems.get(id);
    if (!item) return undefined;

    const updatedItem = { ...item, ...itemData };
    this.invoiceItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInvoiceItem(id: number): Promise<boolean> {
    return this.invoiceItems.delete(id);
  }
}

export const storage = new MemStorage();
