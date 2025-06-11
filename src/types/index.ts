
import type { LucideIcon } from 'lucide-react';

export type DeviceId = 'thermometer' | 'alcotest';

export interface DeviceField {
  id: string;
  label: string;
  type: 'number' | 'text';
  step?: string;
  placeholder?: string;
  required?: boolean;
  prefilledValue?: string;
  readOnly?: boolean;
}

export interface DeviceConfig {
  id: DeviceId;
  name: string;
  fields: DeviceField[];
  description: string;
  Icon: LucideIcon;
}

export interface Inspector {
  id: string;
  name: string;
}

export interface DataEntry {
  id: string;
  serialNumber: string;
  deviceType: DeviceId;
  deviceName: string;
  measuredValues: Record<string, string | number>;
  inspectorName: string;
  timestamp: string; // ISO string for date
}

