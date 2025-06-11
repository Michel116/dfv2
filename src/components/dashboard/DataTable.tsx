
"use client";

import type { DataEntry, DeviceId } from "@/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Info, Trash2, ChevronDown } from "lucide-react";
import { format } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import React, { useMemo, useState } from "react";
import { DEVICE_CONFIGS } from "@/config/devices";

interface DataTableProps {
  entries: DataEntry[];
  onDeleteEntry: (id: string) => void;
  onClearAllEntries: () => void;
}

const PREFILLED_TEMP_CORRECTION_DISPLAY = -3.7; // Used for display consistency

export function DataTable({ entries, onDeleteEntry, onClearAllEntries }: DataTableProps) {
  const { toast } = useToast();
  
  const groupedEntries = useMemo(() => {
    return entries.reduce((acc, entry) => {
      const device = entry.deviceType;
      if (!acc[device]) {
        acc[device] = [];
      }
      acc[device].push(entry);
      acc[device].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return acc;
    }, {} as GroupedEntries);
  }, [entries]);

  const deviceTabs = useMemo(() => {
    const uniqueDeviceTypes = [...new Set(entries.map(e => e.deviceType))];
    return uniqueDeviceTypes
      .map(deviceType => {
        const config = DEVICE_CONFIGS[deviceType];
        const count = entries.filter(e => e.deviceType === deviceType).length;
        return config ? { value: deviceType, label: config.name, count } : null;
      })
      .filter(Boolean) as { value: DeviceId; label: string; count: number }[];
  }, [entries]);
  
  const [activeTab, setActiveTab] = useState<DeviceId | undefined>(deviceTabs.length > 0 ? deviceTabs[0].value : undefined);

  React.useEffect(() => {
    if ((!activeTab || !deviceTabs.find(t => t.value === activeTab)) && deviceTabs.length > 0) {
      setActiveTab(deviceTabs[0].value);
    } else if (deviceTabs.length === 0) {
      setActiveTab(undefined);
    }
  }, [deviceTabs, activeTab]);

  const calculateThermometerDetails = (entry: DataEntry) => {
    if (entry.deviceType !== 'thermometer') return null;

    const r1 = parseFloat(String(entry.measuredValues.complex_reading_1));
    const r2 = parseFloat(String(entry.measuredValues.complex_reading_2));
    const r3 = parseFloat(String(entry.measuredValues.complex_reading_3));
    
    // Ensure temp_correction is treated as a number
    const tempCorrectionValue = entry.measuredValues.temp_correction;
    const tempCorrection = typeof tempCorrectionValue === 'string' ? parseFloat(tempCorrectionValue) : (typeof tempCorrectionValue === 'number' ? tempCorrectionValue : NaN);

    if (isNaN(r1) || isNaN(r2) || isNaN(r3) || isNaN(tempCorrection)) {
      return { 
        verification_point: parseFloat(String(entry.measuredValues.verification_point)) || 0,
        reading_1: r1, reading_2: r2, reading_3: r3,
        average_actual_temp: NaN, 
        result_status: "Ошибка данных" 
      };
    }
    
    const actual_temp_1 = r1 + tempCorrection;
    const actual_temp_2 = r2 + tempCorrection;
    const actual_temp_3 = r3 + tempCorrection;
    const average_actual_temp = (actual_temp_1 + actual_temp_2 + actual_temp_3) / 3;
    
    const verificationPoint = parseFloat(String(entry.measuredValues.verification_point));
    let lowerLimit = 0, upperLimit = 0;

    // Define limits based on verification point (assuming 37.0 for now as per form)
    if (verificationPoint === 37.0) {
        lowerLimit = 36.7;
        upperLimit = 37.3;
    }
    // Add other verification points if necessary
    // else if (verificationPoint === 41.5) { ... }


    const result_status = (average_actual_temp >= lowerLimit && average_actual_temp <= upperLimit) ? "Годен" : "Брак";
    
    return {
      verification_point: verificationPoint,
      reading_1: r1,
      reading_2: r2,
      reading_3: r3,
      actual_temp_1, // for export
      actual_temp_2, // for export
      actual_temp_3, // for export
      average_actual_temp,
      result_status,
    };
  };

  const handleExport = () => {
    if (entries.length === 0) {
      toast({ title: "Нет данных", description: "Нет данных для экспорта в Excel.", variant: "default" });
      return;
    }

    const wb = XLSX.utils.book_new();
    const uniqueDeviceTypes = [...new Set(entries.map(e => e.deviceType))];

    uniqueDeviceTypes.forEach(deviceType => {
      const deviceEntries = entries.filter(e => e.deviceType === deviceType);
      if (deviceEntries.length === 0) return;

      const deviceConfig = DEVICE_CONFIGS[deviceType];
      const sheetName = deviceConfig ? deviceConfig.name.replace(/[\[\]*?:\/\\]/g, '').substring(0, 30) : `Данные ${deviceType.substring(0,20)}`;

      let sheetData: any[] = [];

      if (deviceType === 'thermometer') {
        sheetData = deviceEntries.map(entry => {
          const details = calculateThermometerDetails(entry);
          const mv = entry.measuredValues;
          return {
            'ID Записи': entry.id,
            'Серийный номер': entry.serialNumber,
            'Имя поверителя': entry.inspectorName,
            'Время записи': format(new Date(entry.timestamp), "dd.MM.yyyy HH:mm:ss", { locale: ru }),
            'Точка поверки (°C)': mv.verification_point,
            'Эталон КТ-7 (°C)': mv.reference_temp_kt7,
            'Поправка (°C)': mv.temp_correction,
            'Изм. 1 (введено)': mv.complex_reading_1,
            'Изм. 2 (введено)': mv.complex_reading_2,
            'Изм. 3 (введено)': mv.complex_reading_3,
            'Изм. 1 (факт. °C)': details?.actual_temp_1?.toFixed(2).replace('.',','),
            'Изм. 2 (факт. °C)': details?.actual_temp_2?.toFixed(2).replace('.',','),
            'Изм. 3 (факт. °C)': details?.actual_temp_3?.toFixed(2).replace('.',','),
            'Скорр. ср. темп. (°C)': details?.average_actual_temp?.toFixed(2).replace('.',','),
            'Результат поверки': details?.result_status,
          };
        });
      } else { // For alcotest and any other future devices
        sheetData = deviceEntries.map(entry => {
          const baseData = {
            'ID Записи': entry.id,
            'Серийный номер': entry.serialNumber,
            'Имя устройства': entry.deviceName,
            'Имя поверителя': entry.inspectorName,
            'Время записи': format(new Date(entry.timestamp), "dd.MM.yyyy HH:mm:ss", { locale: ru }),
          };
          const measuredData = Object.fromEntries(
            Object.entries(entry.measuredValues).map(([key, value]) => {
              const fieldConfig = DEVICE_CONFIGS[entry.deviceType]?.fields.find(f => f.id === key);
              return [fieldConfig?.label || key, value];
            })
          );
          return { ...baseData, ...measuredData };
        });
      }
      
      if (sheetData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }
    });

    if (wb.SheetNames.length > 0) {
      XLSX.writeFile(wb, `datafill_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast({ title: "Экспорт начат", description: "Данные экспортируются в Excel (.xlsx) файл." });
    } else {
      toast({ title: "Нет данных", description: "Для выбранных фильтров нет данных для экспорта.", variant: "default" });
    }
  };
  
  const formatNumberWithComma = (num?: number | string, digits = 2) => {
    if (num === undefined || num === null) return '-';
    const parsedNum = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(parsedNum)) return String(num); // Return original string if not a number
    return parsedNum.toFixed(digits).replace('.', ',');
  };

  const currentDeviceEntries = activeTab ? groupedEntries[activeTab] || [] : [];
  const currentDeviceName = activeTab ? DEVICE_CONFIGS[activeTab]?.name : "";


  if (entries.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Собранные данные</h3>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled>
              <Download className="mr-2 h-4 w-4" /> Экспорт в Excel
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled>
                  <Trash2 className="mr-2 h-4 w-4" /> Очистить все
                </Button>
              </AlertDialogTrigger>
            </AlertDialog>
          </div>
        </div>
        <div className="rounded-md border shadow-inner p-10 flex flex-col items-center justify-center text-muted-foreground">
          <Info className="h-10 w-10 mb-2" />
          Записей данных пока нет. Начните с заполнения формы выше.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Собранные данные</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={entries.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Экспорт в Excel
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={entries.length === 0}>
                <Trash2 className="mr-2 h-4 w-4" /> Очистить все
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Вы абсолютно уверены?</AlertDialogTitle>
                <AlertDialogDescription>
                  Это действие нельзя отменить. Все собранные записи данных будут удалены безвозвратно.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={onClearAllEntries}>Продолжить</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DeviceId)}>
        <TabsList className="mb-4">
          {deviceTabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label} ({tab.count})
            </TabsTrigger>
          ))}
        </TabsList>

        {deviceTabs.map(tabInfo => (
          <TabsContent key={tabInfo.value} value={tabInfo.value}>
            {currentDeviceEntries.length > 0 ? (
              <Accordion type="multiple" className="w-full space-y-2">
                {currentDeviceEntries.map((entry) => {
                  const thermoDetails = calculateThermometerDetails(entry);
                  return (
                    <AccordionItem value={entry.id} key={entry.id} className="border rounded-md shadow-sm bg-card">
                      <AccordionTrigger className="p-3 hover:no-underline group">
                        <div className="flex justify-between items-center w-full">
                          <div className="flex-1 text-left">
                            <p className="font-semibold font-code text-primary">{entry.serialNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {entry.deviceName} / Поверитель: {entry.inspectorName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Запись: {format(new Date(entry.timestamp), "dd.MM.yy HH:mm", { locale: ru })}
                            </p>
                          </div>
                          <div className="flex items-center">
                            {thermoDetails && (
                               <Badge variant={thermoDetails.result_status === "Годен" ? "default" : "destructive"} 
                                      className={cn("mr-3 text-xs font-semibold", 
                                        thermoDetails.result_status === "Годен" ? "bg-green-100 text-green-700 border-green-300" : 
                                        thermoDetails.result_status === "Брак" ? "bg-red-100 text-red-700 border-red-300" : 
                                        "bg-yellow-100 text-yellow-700 border-yellow-300" )}>
                                {thermoDetails.result_status.toUpperCase()}
                               </Badge>
                            )}
                            <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200 text-muted-foreground group-data-[state=open]:rotate-180" />
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-0 border-t">
                        <div className="p-4 space-y-3">
                          {entry.deviceType === 'thermometer' && thermoDetails ? (
                            <div className="text-sm space-y-1">
                               <p><strong>Точка поверки:</strong> {formatNumberWithComma(thermoDetails.verification_point, 1)}°C</p>
                               <div className="grid grid-cols-3 gap-x-4">
                                 <p><strong>Изм. 1:</strong> {formatNumberWithComma(thermoDetails.reading_1)}</p>
                                 <p><strong>Изм. 2:</strong> {formatNumberWithComma(thermoDetails.reading_2)}</p>
                                 <p><strong>Изм. 3:</strong> {formatNumberWithComma(thermoDetails.reading_3)}</p>
                               </div>
                               <p><strong>Скорр. ср.:</strong> {formatNumberWithComma(thermoDetails.average_actual_temp)}°C</p>
                               <p><strong>Результат:</strong> 
                                 <Badge variant={thermoDetails.result_status === "Годен" ? "default" : "destructive"} 
                                      className={cn("ml-1 text-xs font-semibold", 
                                        thermoDetails.result_status === "Годен" ? "bg-green-100 text-green-700 border-green-300" : 
                                        thermoDetails.result_status === "Брак" ? "bg-red-100 text-red-700 border-red-300" :
                                        "bg-yellow-100 text-yellow-700 border-yellow-300")}>
                                  {thermoDetails.result_status.toUpperCase()}
                                </Badge>
                               </p>
                               <p><strong>Дата точки:</strong> {format(new Date(entry.timestamp), "dd.MM.yyyy HH:mm:ss", { locale: ru })}</p>
                            </div>
                          ) : (
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {Object.entries(entry.measuredValues).map(([key, value]) => {
                                 const fieldConfig = DEVICE_CONFIGS[entry.deviceType]?.fields.find(f => f.id === key);
                                 const label = fieldConfig?.label || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                return (
                                <li key={key}>
                                  <span className="font-medium">{label}:</span> {String(value)}
                                </li>
                                );
                              })}
                            </ul>
                          )}
                           <div className="flex justify-end pt-2">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                                      <Trash2 className="mr-1 h-4 w-4" /> Удалить эту запись
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Вы уверены, что хотите удалить эту запись для серийного номера {entry.serialNumber}? Это действие нельзя отменить.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => onDeleteEntry(entry.id)}>Удалить</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            ) : (
                 <div className="rounded-md border shadow-inner p-10 flex flex-col items-center justify-center text-muted-foreground">
                    <Info className="h-10 w-10 mb-2" />
                    Для устройства "{currentDeviceName}" записей данных пока нет.
                </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
