export interface Address {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface Parcel {
  weightGrams: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  declaredValue: number;
}

export interface RateQuote {
  courierName: string;
  serviceType: string;
  estimatedDeliveryDays: number;
  chargeInr: number;
  courierCode?: string;
}

export interface BookShipmentInput {
  orderNumber: string;
  pickup: Address;
  drop: Address;
  parcel: Parcel;
  courierCode?: string;
  codAmount?: number;
}

export interface BookShipmentResult {
  awbNumber: string;
  courierName: string;
  labelUrl?: string;
  chargedAmount: number;
  raw?: unknown;
}

export interface TrackingEvent {
  status: string;
  location?: string;
  message?: string;
  at: Date;
}

export interface CourierProvider {
  name(): string;
  checkServiceability(fromPincode: string, toPincode: string): Promise<boolean>;
  getRates(input: {
    fromPincode: string;
    toPincode: string;
    parcel: Parcel;
    cod?: boolean;
  }): Promise<RateQuote[]>;
  bookShipment(input: BookShipmentInput): Promise<BookShipmentResult>;
  getLabel(awb: string): Promise<string>;
  track(awb: string): Promise<TrackingEvent[]>;
  cancelShipment(awb: string): Promise<boolean>;
}
