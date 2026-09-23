export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'OWNER' | 'SUB_ADMIN' | 'DELIVERY_BOY';
  emailVerified: boolean;
  walletBalance?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  hindiName?: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  weightLabel?: string;
  image?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: {
    fullName: string;
    phone: string;
    flat?: string;
    street?: string;
    city: string;
    pincode: string;
    instructions?: string;
  };
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  walletDebited?: number;
  totalAmount: number;
  paymentMethod: 'COD' | 'RAZORPAY' | 'UPI' | 'WALLET';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  status: string;
  currentStep: number;
  otp: string;
  otpVerified: boolean;
  deliveryBoyId?: string;
  deliveryBoyName?: string;
  deliveryStatus: string;
  timeline: Array<{
    status: string;
    timestamp: string;
    title: string;
    description: string;
    userRole?: string;
    actorName?: string;
  }>;
  createdAt: string;
  updatedAt?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  hindiName?: string;
  price: number;
  originalPrice?: number;
  qty: number;
  weightLabel?: string;
  image?: string;
}

export interface Cart {
  [cartKey: string]: CartItem;
}
