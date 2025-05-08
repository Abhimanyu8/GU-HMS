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
    // Create doctors
    const doctorAvimanyu = this.createUser({
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

    const doctorSanjana = this.createUser({
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

    const doctorSumit = this.createUser({
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
    const patientAvimanyu = this.createUser({
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

    const patientAbhinandita = this.createUser({
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

    const patientDebojyoti = this.createUser({
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
    this.createPatientInfo({
      patientId: 2, // patientChen
      allergies: ["Penicillin", "Peanuts"],
      medicalConditions: ["Hypertension", "Type 2 Diabetes"],
      currentMedications: ["Metformin 500mg", "Lisinopril 10mg"],
      emergencyContact: "Jane Chen (Wife)",
      emergencyPhone: "+1 555-987-1234",
      height: "5'10\"",
      weight: "185 lbs"
    });

    this.createPatientInfo({
      patientId: 3, // patientSmith
      allergies: ["Sulfa drugs"],
      medicalConditions: ["Asthma"],
      currentMedications: ["Albuterol Inhaler"],
      emergencyContact: "Mark Smith (Brother)",
      emergencyPhone: "+1 555-876-1098",
      height: "5'6\"",
      weight: "135 lbs"
    });

    this.createPatientInfo({
      patientId: 4, // patientGarcia
      allergies: ["Latex", "Shellfish"],
      medicalConditions: ["Arthritis", "GERD"],
      currentMedications: ["Omeprazole 20mg", "Ibuprofen 800mg"],
      emergencyContact: "Elena Garcia (Wife)",
      emergencyPhone: "+1 555-765-9876",
      height: "5'8\"",
      weight: "175 lbs"
    });

    this.createPatientInfo({
      patientId: 5, // patientWong
      allergies: [],
      medicalConditions: ["Migraine"],
      currentMedications: ["Sumatriptan 50mg"],
      emergencyContact: "William Wong (Husband)",
      emergencyPhone: "+1 555-654-7890",
      height: "5'4\"",
      weight: "128 lbs"
    });

    this.createPatientInfo({
      patientId: 6, // patientJohnson
      allergies: ["Codeine"],
      medicalConditions: ["Coronary Artery Disease", "Hyperlipidemia"],
      currentMedications: ["Atorvastatin 40mg", "Aspirin 81mg"],
      emergencyContact: "Susan Johnson (Daughter)",
      emergencyPhone: "+1 555-543-7654",
      height: "6'0\"",
      weight: "210 lbs"
    });

    // Add doctor schedules
    // Dr. Johnson's Schedule (Cardiologist)
    this.createDoctorSchedule({
      doctorId: 1,
      dayOfWeek: 1, // Monday
      startTime: "09:00",
      endTime: "17:00",
      isAvailable: true
    });

    this.createDoctorSchedule({
      doctorId: 1,
      dayOfWeek: 3, // Wednesday
      startTime: "09:00",
      endTime: "17:00",
      isAvailable: true
    });

    this.createDoctorSchedule({
      doctorId: 1,
      dayOfWeek: 5, // Friday
      startTime: "09:00",
      endTime: "13:00",
      isAvailable: true
    });

    // Dr. Patel's Schedule (Neurologist)
    this.createDoctorSchedule({
      doctorId: 2,
      dayOfWeek: 2, // Tuesday
      startTime: "10:00",
      endTime: "18:00",
      isAvailable: true
    });

    this.createDoctorSchedule({
      doctorId: 2,
      dayOfWeek: 4, // Thursday
      startTime: "10:00",
      endTime: "18:00",
      isAvailable: true
    });

    this.createDoctorSchedule({
      doctorId: 2,
      dayOfWeek: 6, // Saturday
      startTime: "10:00",
      endTime: "15:00",
      isAvailable: true
    });

    // Dr. Williams's Schedule (Pediatrician)
    this.createDoctorSchedule({
      doctorId: 3,
      dayOfWeek: 1, // Monday
      startTime: "08:00",
      endTime: "16:00",
      isAvailable: true
    });

    this.createDoctorSchedule({
      doctorId: 3,
      dayOfWeek: 2, // Tuesday
      startTime: "08:00",
      endTime: "16:00",
      isAvailable: true
    });

    this.createDoctorSchedule({
      doctorId: 3,
      dayOfWeek: 4, // Thursday
      startTime: "08:00",
      endTime: "16:00",
      isAvailable: true
    });

    this.createDoctorSchedule({
      doctorId: 3,
      dayOfWeek: 5, // Friday
      startTime: "08:00",
      endTime: "16:00",
      isAvailable: true
    });

    // Create appointments
    // Past appointments
    const pastAppointment1 = this.createAppointment({
      patientId: 2, // Robert Chen
      doctorId: 1, // Dr. Johnson (Cardiologist)
      date: new Date("2023-04-15"),
      time: "10:30",
      duration: 45,
      purpose: "Annual cardiac checkup",
      status: "completed",
      notes: "Patient reported occasional chest pain on exertion"
    });

    const pastAppointment2 = this.createAppointment({
      patientId: 3, // Lisa Smith
      doctorId: 3, // Dr. Williams (Pediatrician)
      date: new Date("2023-04-20"),
      time: "09:15",
      duration: 30,
      purpose: "Asthma follow-up",
      status: "completed",
      notes: "Patient's asthma symptoms have improved with current medication"
    });

    const pastAppointment3 = this.createAppointment({
      patientId: 4, // Miguel Garcia
      doctorId: 2, // Dr. Patel (Neurologist)
      date: new Date("2023-05-05"),
      time: "14:00",
      duration: 60,
      purpose: "Headache evaluation",
      status: "completed",
      notes: "Patient has been experiencing severe migraines"
    });

    const pastAppointment4 = this.createAppointment({
      patientId: 5, // Sophia Wong
      doctorId: 1, // Dr. Johnson (Cardiologist)
      date: new Date("2023-05-12"),
      time: "11:30",
      duration: 45,
      purpose: "Heart palpitations",
      status: "completed",
      notes: "Patient reported occasional heart palpitations in the evening"
    });

    // Current/Upcoming appointments
    const upcomingAppointment1 = this.createAppointment({
      patientId: 2, // Robert Chen
      doctorId: 1, // Dr. Johnson (Cardiologist)
      date: new Date(new Date().setDate(new Date().getDate() + 2)), // 2 days from now
      time: "10:00",
      duration: 30,
      purpose: "Follow-up on cardiac medication",
      status: "pending",
      notes: ""
    });

    const upcomingAppointment2 = this.createAppointment({
      patientId: 6, // David Johnson
      doctorId: 2, // Dr. Patel (Neurologist)
      date: new Date(new Date().setDate(new Date().getDate() + 3)), // 3 days from now
      time: "15:30",
      duration: 45,
      purpose: "Persistent headaches",
      status: "pending",
      notes: ""
    });

    const upcomingAppointment3 = this.createAppointment({
      patientId: 3, // Lisa Smith
      doctorId: 3, // Dr. Williams (Pediatrician)
      date: new Date(new Date().setDate(new Date().getDate() + 5)), // 5 days from now
      time: "09:30",
      duration: 30,
      purpose: "Annual checkup",
      status: "pending",
      notes: ""
    });

    const cancelledAppointment = this.createAppointment({
      patientId: 4, // Miguel Garcia
      doctorId: 1, // Dr. Johnson (Cardiologist)
      date: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
      time: "14:30",
      duration: 45,
      purpose: "Chest pain evaluation",
      status: "cancelled",
      notes: "Patient had to cancel due to work conflict"
    });

    // Create medical records for completed appointments
    const medicalRecord1 = this.createMedicalRecord({
      patientId: 2, // Robert Chen
      appointmentId: 1, // pastAppointment1
      recordDate: new Date("2023-04-15"),
      diagnosis: "Stage 1 Hypertension",
      symptoms: ["Occasional chest pain", "Shortness of breath on exertion"],
      treatment: "Increased current medication dosage and recommended lifestyle modifications",
      notes: "Patient advised to follow a low-sodium diet and increase physical activity"
    });

    const medicalRecord2 = this.createMedicalRecord({
      patientId: 3, // Lisa Smith
      appointmentId: 2, // pastAppointment2
      recordDate: new Date("2023-04-20"),
      diagnosis: "Well-controlled Asthma",
      symptoms: ["Mild wheezing", "Occasional night cough"],
      treatment: "Continue current inhaler usage",
      notes: "Patient shows good response to current medication regimen"
    });

    const medicalRecord3 = this.createMedicalRecord({
      patientId: 4, // Miguel Garcia
      appointmentId: 3, // pastAppointment3
      recordDate: new Date("2023-05-05"),
      diagnosis: "Tension Headaches",
      symptoms: ["Persistent headache", "Neck stiffness", "Fatigue"],
      treatment: "Prescribed pain relievers and muscle relaxants",
      notes: "Recommended stress management techniques and physical therapy"
    });

    const medicalRecord4 = this.createMedicalRecord({
      patientId: 5, // Sophia Wong
      appointmentId: 4, // pastAppointment4
      recordDate: new Date("2023-05-12"),
      diagnosis: "Mild Arrhythmia",
      symptoms: ["Heart palpitations", "Occasional dizziness"],
      treatment: "Prescribed beta-blocker medication",
      notes: "Patient advised to avoid caffeine and monitor symptoms"
    });

    // Create medical files
    this.createMedicalFile({
      patientId: 2, // Robert Chen
      recordId: 1, // medicalRecord1
      fileType: "pdf",
      fileName: "ECG_Results_Chen.pdf",
      fileData: "data:application/pdf;base64,JVBERi0xLjMNCiXi48/TDQoNCjEgMCBvYmoNCjw8DQovVHlwZSAvQ2F0YWxvZw0KL091dGxpbmVzIDIgMCBSDQovUGFnZXMgMyAwIFINCj4+DQplbmRvYmoNCg0KMiAwIG9iag0KPDwNCi9UeXBlIC9PdXRsaW5lcw0KL0NvdW50IDANCj4+DQplbmRvYmoNCg0KMyAwIG9iag0KPDwNCi9UeXBlIC9QYWdlcw0KL0NvdW50IDINCi9LaWRzIFsgNCAwIFIgNiAwIFIgXSANCj4+DQplbmRvYmoNCg0KNCAwIG9iag0KPDwNCi9UeXBlIC9QYWdlDQovUGFyZW50IDMgMCBSDQovUmVzb3VyY2VzIDw8DQovRm9udCA8PA0KL0YxIDkgMCBSIA0KPj4NCi9Qcm9jU2V0IDggMCBSDQo+Pg0KL01lZGlhQm94IFswIDAgNjEyLjAwMDAgNzkyLjAwMDBdDQovQ29udGVudHMgNSAwIFINCj4+DQplbmRvYmoNCg0KNSAwIG9iag0KPDwgDQovTGVuZ3RoIDEwNzQgDQo+Pg0Kc3RyZWFtDQoyIDAgMCAyIDE1MCAzOTYgY20NCkJUDQovRjEgMTIgVGYNCjAgVGMNCjAgVHcNCihIZWxsbywgd29ybGQhIFRoaXMgaXMgYSBwbGFjZWhvbGRlciBmb3IgRUNHIHJlcG9ydCBkYXRhLikgVGoNCkVUDQplbmRzdHJlYW0NCmVuZG9iag0KDQo2IDAgb2JqDQo8PA0KL1R5cGUgL1BhZ2UNCi9QYXJlbnQgMyAwIFINCi9SZXNvdXJjZXMgPDwNCi9Gb250IDw8DQovRjEgOSAwIFIgDQo+Pg0KL1Byb2NTZXQgOCAwIFINCj4+DQovTWVkaWFCb3ggWzAgMCA2MTIuMDAwMCA3OTIuMDAwMF0NCi9Db250ZW50cyA3IDAgUg0KPj4NCmVuZG9iag0KDQo3IDAgb2JqDQo8PCAvTGVuZ3RoIDY3NiA+Pg0Kc3RyZWFtDQpCVA0KL0YxIDEyIFRmDQowIFRjDQowIFR3DQooU2Vjb25kIHBhZ2UgaXMgaGVyZSEpIFRqDQpFVA0KZW5kc3RyZWFtDQplbmRvYmoNCg0KOCAwIG9iag0KWyAvUERGIC9UZXh0IF0NCmVuZG9iag0KDQo5IDAgb2JqDQo8PA0KL1R5cGUgL0ZvbnQNCi9TdWJ0eXBlIC9UeXBlMQ0KL05hbWUgL0YxDQovQmFzZUZvbnQgL0hlbHZldGljYQ0KL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcNCj4+DQplbmRvYmoNCg0KMTAgMCBvYmoNCjw8DQovQ3JlYXRvciAoUmF2ZSBcKGh0dHA6Ly93d3cubmV2cm9uYS5jb20vcmF2ZVwpKQ0KL1Byb2R1Y2VyIChOZXZyb25hIERlc2lnbnMpDQovQ3JlYXRpb25EYXRlIChEOjIwMDYwMzAxMDcyODI2KQ0KPj4NCmVuZG9iag0KDQp4cmVmDQowIDExDQowMDAwMDAwMDAwIDY1NTM1IGYNCjAwMDAwMDAwMTkgMDAwMDAgbg0KMDAwMDAwMDA5MyAwMDAwMCBuDQowMDAwMDAwMTQ3IDAwMDAwIG4NCjAwMDAwMDAyMjIgMDAwMDAgbg0KMDAwMDAwMDM5MCAwMDAwMCBuDQowMDAwMDAxNTMzIDAwMDAwIG4NCjAwMDAwMDE3MDEgMDAwMDAgbg0KMDAwMDAwMjQzNCAwMDAwMCBuDQowMDAwMDAyNDY0IDAwMDAwIG4NCjAwMDAwMDI1NjcgMDAwMDAgbg0KDQp0cmFpbGVyDQo8PA0KL1NpemUgMTENCi9Sb290IDEgMCBSDQovSW5mbyAxMCAwIFINCj4+DQoNCnN0YXJ0eHJlZg0KMDI3NDINDCVFT0YNCg==",
      uploadDate: new Date("2023-04-15"),
      description: "ECG results showing mild irregularities"
    });

    this.createMedicalFile({
      patientId: 2, // Robert Chen
      recordId: 1, // medicalRecord1
      fileType: "image",
      fileName: "Chest_Xray_Chen.jpg",
      fileData: "data:image/jpeg;base64,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",
      uploadDate: new Date("2023-04-15"),
      description: "Chest X-ray showing normal cardiac size"
    });

    this.createMedicalFile({
      patientId: 4, // Miguel Garcia
      recordId: 3, // medicalRecord3
      fileType: "pdf",
      fileName: "MRI_Report_Garcia.pdf",
      fileData: "data:application/pdf;base64,JVBERi0xLjMNCiXi48/TDQoNCjEgMCBvYmoNCjw8DQovVHlwZSAvQ2F0YWxvZw0KL091dGxpbmVzIDIgMCBSDQovUGFnZXMgMyAwIFINCj4+DQplbmRvYmoNCg0KMiAwIG9iag0KPDwNCi9UeXBlIC9PdXRsaW5lcw0KL0NvdW50IDANCj4+DQplbmRvYmoNCg0KMyAwIG9iag0KPDwNCi9UeXBlIC9QYWdlcw0KL0NvdW50IDINCi9LaWRzIFsgNCAwIFIgNiAwIFIgXSANCj4+DQplbmRvYmoNCg0KNCAwIG9iag0KPDwNCi9UeXBlIC9QYWdlDQovUGFyZW50IDMgMCBSDQovUmVzb3VyY2VzIDw8DQovRm9udCA8PA0KL0YxIDkgMCBSIA0KPj4NCi9Qcm9jU2V0IDggMCBSDQo+Pg0KL01lZGlhQm94IFswIDAgNjEyLjAwMDAgNzkyLjAwMDBdDQovQ29udGVudHMgNSAwIFINCj4+DQplbmRvYmoNCg0KNSAwIG9iag0KPDwgDQovTGVuZ3RoIDEwNzQgDQo+Pg0Kc3RyZWFtDQoyIDAgMCAyIDE1MCAzOTYgY20NCkJUDQovRjEgMTIgVGYNCjAgVGMNCjAgVHcNCihIZWxsbywgd29ybGQhIFRoaXMgaXMgYSBwbGFjZWhvbGRlciBmb3IgTVJJIHJlcG9ydCBkYXRhLikgVGoNCkVUDQplbmRzdHJlYW0NCmVuZG9iag0KDQo2IDAgb2JqDQo8PA0KL1R5cGUgL1BhZ2UNCi9QYXJlbnQgMyAwIFINCi9SZXNvdXJjZXMgPDwNCi9Gb250IDw8DQovRjEgOSAwIFIgDQo+Pg0KL1Byb2NTZXQgOCAwIFINCj4+DQovTWVkaWFCb3ggWzAgMCA2MTIuMDAwMCA3OTIuMDAwMF0NCi9Db250ZW50cyA3IDAgUg0KPj4NCmVuZG9iag0KDQo3IDAgb2JqDQo8PCAvTGVuZ3RoIDY3NiA+Pg0Kc3RyZWFtDQpCVA0KL0YxIDEyIFRmDQowIFRjDQowIFR3DQooU2Vjb25kIHBhZ2UgaXMgaGVyZSEpIFRqDQpFVA0KZW5kc3RyZWFtDQplbmRvYmoNCg0KOCAwIG9iag0KWyAvUERGIC9UZXh0IF0NCmVuZG9iag0KDQo5IDAgb2JqDQo8PA0KL1R5cGUgL0ZvbnQNCi9TdWJ0eXBlIC9UeXBlMQ0KL05hbWUgL0YxDQovQmFzZUZvbnQgL0hlbHZldGljYQ0KL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcNCj4+DQplbmRvYmoNCg0KMTAgMCBvYmoNCjw8DQovQ3JlYXRvciAoUmF2ZSBcKGh0dHA6Ly93d3cubmV2cm9uYS5jb20vcmF2ZVwpKQ0KL1Byb2R1Y2VyIChOZXZyb25hIERlc2lnbnMpDQovQ3JlYXRpb25EYXRlIChEOjIwMDYwMzAxMDcyODI2KQ0KPj4NCmVuZG9iag0KDQp4cmVmDQowIDExDQowMDAwMDAwMDAwIDY1NTM1IGYNCjAwMDAwMDAwMTkgMDAwMDAgbg0KMDAwMDAwMDA5MyAwMDAwMCBuDQowMDAwMDAwMTQ3IDAwMDAwIG4NCjAwMDAwMDAyMjIgMDAwMDAgbg0KMDAwMDAwMDM5MCAwMDAwMCBuDQowMDAwMDAxNTMzIDAwMDAwIG4NCjAwMDAwMDE3MDEgMDAwMDAgbg0KMDAwMDAwMjQzNCAwMDAwMCBuDQowMDAwMDAyNDY0IDAwMDAwIG4NCjAwMDAwMDI1NjcgMDAwMDAgbg0KDQp0cmFpbGVyDQo8PA0KL1NpemUgMTENCi9Sb290IDEgMCBSDQovSW5mbyAxMCAwIFINCj4+DQoNCnN0YXJ0eHJlZg0KMDI3NDINDCVFT0YNCg==",
      uploadDate: new Date("2023-05-05"),
      description: "MRI of the brain showing no abnormalities"
    });

    // Create prescriptions
    const prescription1 = this.createPrescription({
      patientId: 2, // Robert Chen
      doctorId: 1, // Dr. Johnson (Cardiologist)
      appointmentId: 1, // pastAppointment1
      prescriptionDate: new Date("2023-04-15"),
      expiryDate: new Date("2023-07-15"),
      diagnosis: "Stage 1 Hypertension",
      notes: "Take medications as directed. Follow up in 3 months."
    });

    const prescription2 = this.createPrescription({
      patientId: 3, // Lisa Smith
      doctorId: 3, // Dr. Williams (Pediatrician)
      appointmentId: 2, // pastAppointment2
      prescriptionDate: new Date("2023-04-20"),
      expiryDate: new Date("2023-07-20"),
      diagnosis: "Asthma",
      notes: "Use inhaler as needed for symptoms. Avoid triggers."
    });

    const prescription3 = this.createPrescription({
      patientId: 4, // Miguel Garcia
      doctorId: 2, // Dr. Patel (Neurologist)
      appointmentId: 3, // pastAppointment3
      prescriptionDate: new Date("2023-05-05"),
      expiryDate: new Date("2023-08-05"),
      diagnosis: "Tension Headaches",
      notes: "Take medication at onset of headache. Follow stress reduction techniques."
    });

    // Create prescription items
    this.createPrescriptionItem({
      prescriptionId: 1, // prescription1
      medicationName: "Lisinopril",
      dosage: "20mg",
      frequency: "Once daily",
      duration: "90 days",
      instructions: "Take in the morning with water"
    });

    this.createPrescriptionItem({
      prescriptionId: 1, // prescription1
      medicationName: "Aspirin",
      dosage: "81mg",
      frequency: "Once daily",
      duration: "90 days",
      instructions: "Take with food"
    });

    this.createPrescriptionItem({
      prescriptionId: 2, // prescription2
      medicationName: "Albuterol Sulfate",
      dosage: "2 puffs",
      frequency: "As needed",
      duration: "As needed",
      instructions: "Inhale 2 puffs every 4-6 hours as needed for asthma symptoms"
    });

    this.createPrescriptionItem({
      prescriptionId: 3, // prescription3
      medicationName: "Ibuprofen",
      dosage: "600mg",
      frequency: "Every 6 hours as needed",
      duration: "10 days",
      instructions: "Take with food for headache pain"
    });

    this.createPrescriptionItem({
      prescriptionId: 3, // prescription3
      medicationName: "Cyclobenzaprine",
      dosage: "10mg",
      frequency: "Once daily at bedtime",
      duration: "7 days",
      instructions: "May cause drowsiness. Do not drive after taking."
    });

    // Create invoices
    const invoice1 = this.createInvoice({
      patientId: 2, // Robert Chen
      appointmentId: 1, // pastAppointment1
      invoiceDate: new Date("2023-04-15"),
      dueDate: new Date("2023-05-15"),
      totalAmount: 15000, // $150.00
      status: "paid",
      notes: "Cardiac consultation and tests"
    });

    const invoice2 = this.createInvoice({
      patientId: 3, // Lisa Smith
      appointmentId: 2, // pastAppointment2
      invoiceDate: new Date("2023-04-20"),
      dueDate: new Date("2023-05-20"),
      totalAmount: 7500, // $75.00
      status: "paid",
      notes: "Pediatric follow-up visit"
    });

    const invoice3 = this.createInvoice({
      patientId: 4, // Miguel Garcia
      appointmentId: 3, // pastAppointment3
      invoiceDate: new Date("2023-05-05"),
      dueDate: new Date("2023-06-05"),
      totalAmount: 20000, // $200.00
      status: "unpaid",
      notes: "Neurological consultation and tests"
    });

    const invoice4 = this.createInvoice({
      patientId: 5, // Sophia Wong
      appointmentId: 4, // pastAppointment4
      invoiceDate: new Date("2023-05-12"),
      dueDate: new Date("2023-06-12"),
      totalAmount: 12500, // $125.00
      status: "cancelled",
      notes: "Cancelled due to insurance coverage"
    });

    // Create invoice items
    this.createInvoiceItem({
      invoiceId: 1, // invoice1
      description: "Cardiac Consultation",
      quantity: 1,
      unitPrice: 10000, // $100.00
      totalPrice: 10000 // $100.00
    });

    this.createInvoiceItem({
      invoiceId: 1, // invoice1
      description: "ECG",
      quantity: 1,
      unitPrice: 5000, // $50.00
      totalPrice: 5000 // $50.00
    });

    this.createInvoiceItem({
      invoiceId: 2, // invoice2
      description: "Pediatric Follow-up",
      quantity: 1,
      unitPrice: 7500, // $75.00
      totalPrice: 7500 // $75.00
    });

    this.createInvoiceItem({
      invoiceId: 3, // invoice3
      description: "Neurological Consultation",
      quantity: 1,
      unitPrice: 12500, // $125.00
      totalPrice: 12500 // $125.00
    });

    this.createInvoiceItem({
      invoiceId: 3, // invoice3
      description: "MRI Brain Scan",
      quantity: 1,
      unitPrice: 7500, // $75.00
      totalPrice: 7500 // $75.00
    });

    this.createInvoiceItem({
      invoiceId: 4, // invoice4
      description: "Cardiac Consultation",
      quantity: 1,
      unitPrice: 12500, // $125.00
      totalPrice: 12500 // $125.00
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

  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
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