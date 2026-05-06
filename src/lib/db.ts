

export interface Customer {
  id: string; // CUS001
  name: string;
  phone: string;
  place?: string;
  createdAt: string;
}

export interface MediaItem {
  id: string;
  type: "image" | "video" | "audio";
  dataUrl: string;
  name?: string;
}

export type BookingStatus = "Pending" | "Confirmed" | "Delivered" | "Returned" | "Completed";
export type PaymentMode = "Pending" | "Paid";

export interface Booking {
  id: string; // 6-char alphanumeric
  customerId: string;
  customerName: string;
  customerPhone: string;
  place?: string;
  createdAt: string;
  deliveryDate?: string; // yyyy-mm-dd
  deliveryTime?: string; // HH:mm
  returnDate?: string;
  returnTime?: string;
  functionType?: string;
  status: BookingStatus;
  paymentMode: PaymentMode;
  amount?: number | null;
  paidAmount?: number | null;
  voiceNotes: MediaItem[];
  billMedia: MediaItem[];
}

export interface Expense {
  id: string;
  date: string; // ISO
  type: string;
  bookingId?: string;
  amount?: number | null;
  description?: string;
  voiceNotes: MediaItem[];
  media: MediaItem[];
}

export interface BusinessInfo {
  name: string;
  logo?: string;
  contact: string;
  altContact?: string;
  address?: string;
  websiteUrl?: string;
}

export interface WATemplate {
  id: string;
  name: string;
  body: string;
}

export type PermKey =
  | "module.dashboard" | "module.bookings" | "module.expenses" | "module.customers" | "module.settings"
  | "bookings.create" | "bookings.edit" | "bookings.delete" | "bookings.whatsapp"
  | "expenses.create" | "expenses.edit" | "expenses.delete"
  | "customers.edit" | "customers.delete"
  | "settings.manageUsers" | "settings.manageTypes" | "settings.theme" | "settings.fields" | "settings.calendar" | "settings.backup" | "settings.restore" | "settings.deleteAll";

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  isAdmin: boolean;
  permissions: PermKey[];
}


export interface AppData {
  customers: Customer[];
  bookings: Booking[];
  expenses: Expense[];
  functionTypes: string[];
  expenseTypes: string[];
  customerCounter: number;
  business: BusinessInfo;
  waTemplates: WATemplate[];
  users: User[];
}



const DEFAULT: AppData = {
  customers: [],
  bookings: [],
  expenses: [],
  functionTypes: ["Wedding", "Birthday", "Corporate", "Engagement", "Housewarming"],
  expenseTypes: ["Transport", "Labour", "Food", "Maintenance"],
  customerCounter: 0,
  business: {
    name: "Shiva Shakti Shamiyana",
    contact: "",
  },
  waTemplates: [
    { id: "def-1", name: "Booking Confirmation", body: "Dear {customerName}, your booking {bookingId} is confirmed for {deliveryDate}. Thank you!" },
    { id: "def-2", name: "Payment Reminder", body: "Dear {customerName}, a payment for booking {bookingId} is pending. Amount: {amount}. Please clear it soon." }
  ],
  users: [],
};

const API_URL = import.meta.env.VITE_API_URL || "";

export async function loadData(): Promise<AppData> {
  try {
    const res = await fetch(`${API_URL}/api/data`);
    const data = await res.json();
    return { ...DEFAULT, ...(data || {}) };
  } catch (err) {
    console.error("Failed to load data from API:", err);
    return DEFAULT;
  }
}

export async function saveData(data: AppData): Promise<void> {
  try {
    await fetch(`${API_URL}/api/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error("Failed to save data to API:", err);
  }
}

export function genBookingId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export function nextCustomerId(counter: number): string {
  return `CUS${String(counter + 1).padStart(3, "0")}`;
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export async function exportAll(): Promise<string> {
  const data = await loadData();
  return JSON.stringify(data, null, 2);
}

export async function importAll(json: string): Promise<void> {
  const parsed = JSON.parse(json);
  await saveData({ ...DEFAULT, ...parsed });
}

export async function deleteAll(): Promise<void> {
  try {
    await fetch(`${API_URL}/api/data`, { method: "DELETE" });
  } catch (err) {
    console.error("Failed to delete all data from API:", err);
  }
}

// Auto status update logic
export function applyAutoStatus(b: Booking): Booking {
  const now = new Date();
  let status = b.status;
  const order: BookingStatus[] = ["Pending", "Confirmed", "Delivered", "Returned", "Completed"];
  const idx = (s: BookingStatus) => order.indexOf(s);

  if (b.deliveryDate) {
    const dt = new Date(`${b.deliveryDate}T${b.deliveryTime || "00:00"}`);
    if (dt < now && idx(status) < idx("Delivered")) status = "Delivered";
  }
  if (b.returnDate) {
    const dt = new Date(`${b.returnDate}T${b.returnTime || "23:59"}`);
    if (dt < now && idx(status) < idx("Returned")) status = "Returned";
  }
  return status === b.status ? b : { ...b, status };
}
