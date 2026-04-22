import { CourierProvider } from "./CourierProvider";
import { ShipwayProvider } from "./ShipwayProvider";

let _provider: CourierProvider | null = null;

export function getCourierProvider(): CourierProvider {
  if (!_provider) {
    _provider = new ShipwayProvider();
  }
  return _provider;
}

export * from "./CourierProvider";
