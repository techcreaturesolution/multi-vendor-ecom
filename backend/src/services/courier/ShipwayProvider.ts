import {
  BookShipmentInput,
  BookShipmentResult,
  CourierProvider,
  Parcel,
  RateQuote,
  TrackingEvent,
} from "./CourierProvider";
import { logger } from "../../config/logger";

/**
 * Stubbed Shipway provider. Real API wiring will replace the bodies of these
 * methods once live credentials are available. The surface area (method
 * signatures and return shapes) is fixed so downstream code does not change.
 *
 * Shipway REST docs (for future wiring):
 *   https://shipway.com/Apidocs
 */
export class ShipwayProvider implements CourierProvider {
  name(): string {
    return "shipway";
  }

  async checkServiceability(fromPincode: string, toPincode: string): Promise<boolean> {
    logger.debug(`[shipway-stub] serviceability ${fromPincode} -> ${toPincode}`);
    // Stub: treat everything as serviceable for now
    return /^\d{6}$/.test(fromPincode) && /^\d{6}$/.test(toPincode);
  }

  async getRates(input: {
    fromPincode: string;
    toPincode: string;
    parcel: Parcel;
    cod?: boolean;
  }): Promise<RateQuote[]> {
    const base = 40;
    const perKg = 30;
    const kg = Math.max(0.5, input.parcel.weightGrams / 1000);
    const price = Math.round(base + perKg * kg + (input.cod ? 25 : 0));
    return [
      {
        courierName: "Delhivery (stub)",
        serviceType: "Surface",
        estimatedDeliveryDays: 4,
        chargeInr: price,
        courierCode: "delhivery_surface",
      },
      {
        courierName: "BlueDart (stub)",
        serviceType: "Air",
        estimatedDeliveryDays: 2,
        chargeInr: price + 45,
        courierCode: "bluedart_air",
      },
    ];
  }

  async bookShipment(input: BookShipmentInput): Promise<BookShipmentResult> {
    const awb = `STUB${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const charged = 80;
    logger.info(`[shipway-stub] booked AWB=${awb} for order=${input.orderNumber}`);
    return {
      awbNumber: awb,
      courierName: "Delhivery (stub)",
      labelUrl: `https://example.com/labels/${awb}.pdf`,
      chargedAmount: charged,
    };
  }

  async getLabel(awb: string): Promise<string> {
    return `https://example.com/labels/${awb}.pdf`;
  }

  async track(awb: string): Promise<TrackingEvent[]> {
    const now = new Date();
    return [
      {
        status: "booked",
        location: "Origin hub",
        message: `Shipment booked. AWB ${awb}`,
        at: new Date(now.getTime() - 1000 * 60 * 60 * 24),
      },
      {
        status: "in_transit",
        location: "Transit hub",
        message: "In transit",
        at: new Date(now.getTime() - 1000 * 60 * 60 * 6),
      },
    ];
  }

  async cancelShipment(awb: string): Promise<boolean> {
    logger.info(`[shipway-stub] cancelled AWB=${awb}`);
    return true;
  }
}
