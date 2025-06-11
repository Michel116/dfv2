
import type { DeviceConfig, DeviceId, DeviceField } from '@/types';
import { Thermometer, Smartphone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';


export const DEVICE_CONFIGS: Record<DeviceId, DeviceConfig> = {
  thermometer: {
    id: 'thermometer',
    name: 'Термометры',
    fields: [
      { id: 'verification_point', label: 'Точка поверки (°C)', type: 'number', placeholder: 'напр. 37.0', required: true, prefilledValue: "37.0", readOnly: true },
      { id: 'reference_temp_kt7', label: 'Эталонное значение на КТ-7.АЧТ (°C)', type: 'number', placeholder: 'напр. 37.0', required: true, prefilledValue: "37.0", readOnly: true },
      { id: 'temp_correction', label: 'Температурная поправка (°C)', type: 'number', placeholder: 'напр. -3.7', required: true, prefilledValue: "-3.7", readOnly: true },
      { id: 'complex_reading_1', label: 'Измеренное комплексом значение 1 (°C)', type: 'number', step: '0.1', placeholder: 'напр. 0.0', required: true },
      { id: 'complex_reading_2', label: 'Измеренное комплексом значение 2 (°C)', type: 'number', step: '0.1', placeholder: 'напр. 0.0', required: true },
      { id: 'complex_reading_3', label: 'Измеренное комплексом значение 3 (°C)', type: 'number', step: '0.1', placeholder: 'напр. 0.0', required: true },
    ],
    description: "Ввод данных поверки для термометров (точка 37.0°C).",
    Icon: Thermometer,
  },
  alcotest: {
    id: 'alcotest',
    name: 'Алкотестер E-200',
    fields: [
      { id: 'bac_level', label: 'Уровень алкоголя в крови (мг/л)', type: 'number', step: '0.01', placeholder: 'например, 0.08', required: true },
      { id: 'test_id', label: 'ID теста', type: 'text', placeholder: 'например, TST-001', required: true },
      { id: 'ambient_temp', label: 'Температура окружающей среды (°C)', type: 'number', step: '0.1', placeholder: 'например, 22.5' },
    ],
    description: "Ввод данных для алкотестеров.",
    Icon: Smartphone,
  },
};

export const DEVICE_OPTIONS = Object.values(DEVICE_CONFIGS).map(device => ({
  value: device.id,
  label: device.name,
}));

