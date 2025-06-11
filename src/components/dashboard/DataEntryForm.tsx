
"use client";

import type { DataEntry, DeviceConfig, DeviceField, Inspector, DeviceId } from "@/types";
import { useState, useEffect, type FormEvent, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { QrCode, Save, AlertTriangle, ArrowRight, ArrowLeft, Info, CheckCircle, XCircle, Settings2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { DEVICE_CONFIGS } from "@/config/devices";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface DataEntryFormProps {
  selectedDevice: DeviceId | undefined;
  selectedInspector: Inspector | undefined;
  onSaveEntry: (entry: DataEntry) => void;
  isLoading: boolean;
}

const PREFILLED_VERIFICATION_POINT = 37.0;
const PREFILLED_REFERENCE_TEMP = 37.0; 
const PREFILLED_TEMP_CORRECTION = -3.7;
const TEMP_LOWER_LIMIT_37 = 36.7;
const TEMP_UPPER_LIMIT_37 = 37.3;


export function DataEntryForm({ selectedDevice, selectedInspector, onSaveEntry, isLoading: externalIsLoading }: DataEntryFormProps) {
  const [serialNumber, setSerialNumber] = useState("");
  const [formValues, setFormValues] = useState<Record<string, string>>({}); 
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [qrInput, setQrInput] = useState("");
  
  const [currentStep, setCurrentStep] = useState(0); 
  const [readings, setReadings] = useState<string[]>(["", "", ""]);
  const [currentReadingInput, setCurrentReadingInput] = useState("");
  const [isAutoSaving, setIsAutoSaving] = useState(false);


  const { toast } = useToast();
  const deviceConfig = selectedDevice ? DEVICE_CONFIGS[selectedDevice] : undefined;
  const isThermometer = deviceConfig?.id === 'thermometer';

  const resetThermometerForm = useCallback(() => {
    setSerialNumber("");
    setReadings(["", "", ""]);
    setCurrentReadingInput("");
    setCurrentStep(0);
    if (selectedDevice === 'thermometer' && DEVICE_CONFIGS.thermometer) {
      const thermometerFields = DEVICE_CONFIGS.thermometer.fields;
      const initialFormValues: Record<string, string> = {};
      thermometerFields.forEach(field => {
        if (field.prefilledValue !== undefined && field.readOnly) {
          initialFormValues[field.id] = field.prefilledValue;
        }
      });
      setFormValues(initialFormValues);
    }
  }, [selectedDevice]);

  useEffect(() => {
    // Reset form when device or inspector changes
    setSerialNumber("");
    setFormValues({});
    setCurrentStep(0);
    setReadings(["", "", ""]);
    setCurrentReadingInput("");
    setIsAutoSaving(false);

    // Pre-fill read-only fields for thermometer if it's selected
    if (selectedDevice === 'thermometer' && DEVICE_CONFIGS.thermometer) {
      const thermometerFields = DEVICE_CONFIGS.thermometer.fields;
      const initialFormValues: Record<string, string> = {};
      thermometerFields.forEach(field => {
        if (field.prefilledValue !== undefined && field.readOnly) {
          initialFormValues[field.id] = field.prefilledValue;
        }
      });
      setFormValues(initialFormValues);
    }

  }, [selectedDevice, selectedInspector]);


  const handleReadingInputChange = (newValue: string) => {
    let processedValue = newValue;
    processedValue = processedValue.replace(/[^0-9.]/g, '');
    const firstDotIndex = processedValue.indexOf('.');
    if (firstDotIndex !== -1) {
        processedValue = processedValue.substring(0, firstDotIndex + 1) + processedValue.substring(firstDotIndex + 1).replace(/\./g, '');
    }

    if (processedValue.length === 2 && /^\d\d$/.test(processedValue) && !processedValue.includes('.') && (newValue.length > currentReadingInput.length || (newValue.length === currentReadingInput.length && newValue !== currentReadingInput))) {
        processedValue += '.';
    }
    
    if (!processedValue.includes('.') && processedValue.length === 3 && /^\d\d\d$/.test(processedValue)) {
        processedValue = processedValue.slice(0, 2) + '.' + processedValue.slice(2, 3);
    }
     if (!processedValue.includes('.') && processedValue.length > 3 && /^\d+$/.test(processedValue)) {
        processedValue = processedValue.slice(0, 2) + '.' + processedValue.slice(2, 3) + processedValue.slice(3);
    }
    
    if (processedValue.includes('.')) {
        let [integerPart, decimalPart] = processedValue.split('.');
        if (integerPart.length > 2) integerPart = integerPart.slice(0, 2);
        if (decimalPart && decimalPart.length > 1) decimalPart = decimalPart.slice(0, 1);
        processedValue = integerPart + '.' + (decimalPart !== undefined ? decimalPart : '');
    } else {
        if (processedValue.length > 2) {
           processedValue = processedValue.slice(0, 2);
        }
    }
    setCurrentReadingInput(processedValue);
  };

  const handleGenericInputChange = (fieldId: string, value: string) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
  };


  const handleScanQrCode = () => {
    if (qrInput.trim()) {
      setSerialNumber(qrInput.trim());
      setIsQrDialogOpen(false);
      setQrInput("");
      toast({ title: "Серийный номер обновлен", description: `Серийный номер установлен: ${qrInput.trim()}` });
    } else {
      toast({ title: "Ошибка", description: "Серийный номер не может быть пустым.", variant: "destructive" });
    }
  };

  const handleNextSNStep = () => {
    if (!serialNumber.trim()) {
      toast({ title: "Ошибка", description: "Требуется серийный номер.", variant: "destructive" });
      return;
    }
    setCurrentStep(1); 
  };

  const handleAddReading = () => {
    if (!currentReadingInput.trim() || isNaN(parseFloat(currentReadingInput))) {
        toast({ title: "Ошибка", description: "Введите корректное значение измерения.", variant: "destructive" });
        return;
    }
    const newReadings = [...readings];
    newReadings[currentStep - 1] = currentReadingInput; 
    setReadings(newReadings);
    setCurrentReadingInput(""); 

    if (currentStep < 3) {
        setCurrentStep(currentStep + 1); 
    } else {
        setCurrentStep(4); 
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      if (currentStep >=1 && currentStep <=3 && readings[currentStep-2]) { 
         setCurrentReadingInput(readings[currentStep-2]) 
      } else if (currentStep === 1){ 
         setCurrentReadingInput(""); 
      } else if (currentStep > 1 && currentStep <=3) { 
         setCurrentReadingInput(readings[currentStep-2]); 
      } else {
        setCurrentReadingInput(""); 
      }
    }
  };
  
  const thermoCalculations = useMemo(() => {
    if (!isThermometer) return null; 
    if (currentStep !== 4 && !(currentStep === 3 && readings.every(r => r.trim() !== "" && !isNaN(parseFloat(r))) )) return null;


    const r1 = parseFloat(readings[0]);
    const r2 = parseFloat(readings[1]);
    const r3 = parseFloat(readings[2]);

    if (isNaN(r1) || isNaN(r2) || isNaN(r3)) {
      return { actual_temp_1: NaN, actual_temp_2: NaN, actual_temp_3: NaN, average_actual_temp: NaN, result_status: "Данные неполные или некорректны" };
    }
    
    const actual_temp_1 = r1 + PREFILLED_TEMP_CORRECTION;
    const actual_temp_2 = r2 + PREFILLED_TEMP_CORRECTION;
    const actual_temp_3 = r3 + PREFILLED_TEMP_CORRECTION;
    const average_actual_temp = (actual_temp_1 + actual_temp_2 + actual_temp_3) / 3;
    
    const result_status = (average_actual_temp >= TEMP_LOWER_LIMIT_37 && average_actual_temp <= TEMP_UPPER_LIMIT_37) ? "Годен" : "Брак";
    
    return {
      actual_temp_1, actual_temp_2, actual_temp_3, average_actual_temp,
      lower_limit: TEMP_LOWER_LIMIT_37, upper_limit: TEMP_UPPER_LIMIT_37, result_status,
      verification_point_display: PREFILLED_VERIFICATION_POINT
    };
  }, [readings, isThermometer, currentStep]);

  const handleSubmit = useCallback(async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!deviceConfig || !selectedInspector) {
      toast({ title: "Ошибка", description: "Пожалуйста, выберите устройство и поверителя в разделе 'Конфигурация'.", variant: "destructive" });
      return;
    }
    if (!serialNumber.trim()) {
      toast({ title: "Ошибка", description: "Требуется серийный номер.", variant: "destructive" });
      return;
    }

    setIsAutoSaving(true);

    let measuredValuesToSave: Record<string, string | number> = {};

    if (isThermometer) {
        if (currentStep !== 4 || readings.some(r => r.trim() === "" || isNaN(parseFloat(r)))) {
            toast({ title: "Ошибка", description: "Завершите ввод всех трех измерений.", variant: "destructive" });
            setIsAutoSaving(false);
            return;
        }
        measuredValuesToSave = {
            verification_point: PREFILLED_VERIFICATION_POINT,
            reference_temp_kt7: PREFILLED_REFERENCE_TEMP, 
            temp_correction: PREFILLED_TEMP_CORRECTION,
            complex_reading_1: parseFloat(readings[0]),
            complex_reading_2: parseFloat(readings[1]),
            complex_reading_3: parseFloat(readings[2]),
        };
    } else {
        for (const field of deviceConfig.fields) {
            const value = formValues[field.id];
            if (field.required && (value === undefined || String(value).trim() === "")) {
                toast({ title: "Ошибка валидации", description: `Поле "${field.label}" обязательно для заполнения.`, variant: "destructive" });
                setIsAutoSaving(false);
                return;
            }
            if (value !== undefined && value !== null && (String(value).trim() !== "" || field.readOnly)) {
                if (field.type === 'number') {
                    const num = parseFloat(String(value));
                    measuredValuesToSave[field.id] = isNaN(num) ? String(value) : num;
                } else {
                    measuredValuesToSave[field.id] = String(value);
                }
            }
        }
    }

    const newEntry: DataEntry = {
      id: crypto.randomUUID(),
      serialNumber: serialNumber.trim(),
      deviceType: deviceConfig.id,
      deviceName: deviceConfig.name,
      measuredValues: measuredValuesToSave,
      inspectorName: selectedInspector.name,
      timestamp: new Date().toISOString(),
    };

    onSaveEntry(newEntry); // This might be async in real app
    
    toast({ title: "Успешно", description: "Запись данных сохранена." });
    
    if(isThermometer) {
      resetThermometerForm();
    } else {
      setSerialNumber("");
      setFormValues({});
    }
    setIsAutoSaving(false);

  }, [deviceConfig, selectedInspector, serialNumber, isThermometer, currentStep, readings, formValues, onSaveEntry, toast, resetThermometerForm]);

  useEffect(() => {
    if (isThermometer && currentStep === 4 && thermoCalculations?.result_status && !isAutoSaving && !externalIsLoading) {
      if (thermoCalculations.result_status === "Годен" || thermoCalculations.result_status === "Брак") {
        handleSubmit();
      }
    }
  }, [isThermometer, currentStep, thermoCalculations, handleSubmit, isAutoSaving, externalIsLoading]);


  if (!selectedInspector) {
     return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Ввод данных</CardTitle>
          <CardDescription>
            Пожалуйста, укажите или добавьте поверителя в разделе "Конфигурация" слева, чтобы начать ввод данных.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Поверитель не выбран.</p>
        </CardContent>
      </Card>
    );
  }

  if (!deviceConfig) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Ввод данных</CardTitle>
          <CardDescription>Выберите тип устройства в разделе "Конфигурация" слева, чтобы начать ввод данных.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Устройство не выбрано.</p>
        </CardContent>
      </Card>
    );
  }

  if (selectedDevice === 'alcotest') {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Алкотестер E-200</CardTitle>
          <CardDescription>Поверитель: {selectedInspector.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Settings2 className="h-5 w-5" />
            <AlertTitle className="font-semibold">В разработке</AlertTitle>
            <AlertDescription>
              Функционал для устройства "Алкотестер E-200" находится в стадии активной разработки и скоро будет доступен.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }


  let cardTitle = `Введите данные для ${deviceConfig.name}`;
  let cardDescription = `Заполните данные для выбранного устройства. Поверитель: ${selectedInspector.name}`;

  if (isThermometer) {
    if (currentStep === 0) {
      cardTitle = "Сканирование QR / Ввод SN";
      cardDescription = `Введите серийный номер для устройства "${deviceConfig.name}". Поверитель: ${selectedInspector.name}`;
    } else if (currentStep >= 1 && currentStep <= 3) {
      cardTitle = `Ввод измерений для ${PREFILLED_VERIFICATION_POINT.toFixed(1)} °C (${currentStep}/3)`;
      cardDescription = `Для SN: ${serialNumber}, Точка: ${PREFILLED_VERIFICATION_POINT.toFixed(1)} °C. Введите измерение. Поверитель: ${selectedInspector.name}`;
    } else if (currentStep === 4) {
      cardTitle = `Результаты поверки для ${PREFILLED_VERIFICATION_POINT.toFixed(1)} °C`;
      cardDescription = `SN: ${serialNumber}. Поверитель: ${selectedInspector.name}.`;
       if (isAutoSaving) {
        cardDescription += " Сохранение...";
      }
    }
  }
  
  const isCurrentReadingValid = currentReadingInput.trim() !== "" && !isNaN(parseFloat(currentReadingInput));
  const isLoading = externalIsLoading || isAutoSaving;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {(!isThermometer || currentStep === 0) && (
            <div className="space-y-2">
              <Label htmlFor="serialNumber" className="text-base font-medium">Серийный номер</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="serialNumber"
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="Напр. TM10240700123"
                  className="font-code flex-grow"
                  required
                  disabled={isLoading}
                />
                <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="icon" aria-label="Сканировать QR-код" disabled={isLoading}>
                      <QrCode className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Сканировать/Ввести серийный номер</DialogTitle>
                      <DialogDescription>
                        Введите серийный номер, указанный на устройстве.
                      </DialogDescription>
                    </DialogHeader>
                    <Input
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                      placeholder="Введите серийный номер здесь"
                      className="font-code my-4"
                      autoFocus
                    />
                    <DialogFooter>
                       <DialogClose asChild>
                          <Button type="button" variant="outline">Отмена</Button>
                       </DialogClose>
                      <Button type="button" onClick={handleScanQrCode}>Установить серийный номер</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              {(isThermometer && currentStep === 0) && (
                <Alert variant="default" className="bg-yellow-100 border-yellow-400 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-600 dark:text-yellow-300 mt-2">
                    <AlertTriangle className="h-5 w-5 !text-yellow-600 dark:!text-yellow-400" />
                    <AlertTitle className="font-semibold">Внимание!</AlertTitle>
                    <AlertDescription>
                    При сканировании QR-кода убедитесь, что активна английская раскладка клавиатуры. Некоторые QR-сканеры могут некорректно передавать символы в другой раскладке.
                    </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {isThermometer && currentStep >= 1 && currentStep <= 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="currentReading" className="text-base font-medium">Значение измерения ({currentStep}/3)</Label>
                <Progress value={(currentStep / 3) * 100} className="w-full h-2" />
                 <p className="text-sm text-muted-foreground pt-1">
                    Поправка: {PREFILLED_TEMP_CORRECTION.toFixed(2)} °C, Пределы: {TEMP_LOWER_LIMIT_37.toFixed(2)} °C ... {TEMP_UPPER_LIMIT_37.toFixed(2)} °C
                </p>
              </div>
              <Input
                id="currentReading"
                type="text" 
                inputMode="decimal" 
                value={currentReadingInput}
                onChange={(e) => handleReadingInputChange(e.target.value)}
                placeholder="Напр. 36.6"
                className="font-code"
                autoFocus
                required
                disabled={isLoading}
              />
            </div>
          )}

          {isThermometer && currentStep === 4 && thermoCalculations && (
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  {thermoCalculations.result_status === "Годен" ? 
                    <CheckCircle className="h-6 w-6 mr-2 text-green-600" /> : 
                    (thermoCalculations.result_status === "Брак" ? <XCircle className="h-6 w-6 mr-2 text-red-600" /> : <Loader2 className="h-6 w-6 mr-2 animate-spin" />) }
                  Вердикт: <span className={cn(thermoCalculations.result_status === "Годен" ? "text-green-600" : thermoCalculations.result_status === "Брак" ? "text-red-600" : "", "font-semibold ml-1")}>{isAutoSaving ? "Сохранение..." : thermoCalculations.result_status}</span>
                </CardTitle>
                 <CardDescription>Точка поверки: {thermoCalculations.verification_point_display?.toFixed(1) ?? '-'}°C</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Введенные значения (скорректированные с поправкой {PREFILLED_TEMP_CORRECTION.toFixed(2)}°C):</strong></p>
                <ul className="list-disc list-inside pl-4">
                  <li>Измерение 1: {isNaN(thermoCalculations.actual_temp_1) ? '-' : thermoCalculations.actual_temp_1.toFixed(2)} °C (введено: {readings[0] || '-'})</li>
                  <li>Измерение 2: {isNaN(thermoCalculations.actual_temp_2) ? '-' : thermoCalculations.actual_temp_2.toFixed(2)} °C (введено: {readings[1] || '-'})</li>
                  <li>Измерение 3: {isNaN(thermoCalculations.actual_temp_3) ? '-' : thermoCalculations.actual_temp_3.toFixed(2)} °C (введено: {readings[2] || '-'})</li>
                </ul>
                <p><strong>Средняя фактическая температура:</strong> {isNaN(thermoCalculations.average_actual_temp) ? '-' : thermoCalculations.average_actual_temp.toFixed(2)} °C</p>
                <Separator className="my-2"/>
                <p><strong>Допустимые пределы для {thermoCalculations.verification_point_display?.toFixed(1)}°C:</strong> {thermoCalculations.lower_limit.toFixed(2)}°C - {thermoCalculations.upper_limit.toFixed(2)}°C</p>
              </CardContent>
            </Card>
          )}
          
          {!isThermometer && deviceConfig.fields.map((field: DeviceField) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id} className="text-base font-medium">
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id={field.id}
                  type={field.type} 
                  step={field.type === 'number' ? field.step : undefined}
                  value={formValues[field.id] || ""}
                  onChange={(e) => handleGenericInputChange(field.id, e.target.value)} 
                  placeholder={field.placeholder}
                  required={field.required}
                  disabled={field.readOnly || isLoading}
                  className={cn(field.readOnly && "bg-muted/50 border-muted/30 cursor-not-allowed")}
                />
              </div>
            ))}
          
          <div>
            <Label className="text-base font-medium">Поверитель</Label>
            <Input value={selectedInspector?.name || "Поверитель не выбран"} readOnly disabled className="mt-2 bg-muted/50" />
          </div>

          <div className="flex flex-col space-y-2 pt-2">
            {isThermometer ? (
              <>
                {currentStep === 0 && ( 
                  <Button type="button" onClick={handleNextSNStep} className="w-full" disabled={isLoading || !serialNumber.trim()}>
                    Далее <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                {currentStep >= 1 && currentStep <= 3 && ( 
                  <div className="flex flex-col space-y-2">
                    <Button type="button" onClick={handleAddReading} className="w-full" disabled={isLoading || !isCurrentReadingValid}>
                        Добавить измерение ({currentStep}/3) <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" onClick={handlePrevStep} className="w-full" disabled={isLoading}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Назад
                    </Button>
                  </div>
                )}
                {currentStep === 4 && ( 
                  <div className="flex gap-2">
                     {isAutoSaving ? (
                       <Button type="button" className="flex-1" disabled>
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Сохранение...
                       </Button>
                     ) : (
                       <Button type="button" variant="outline" onClick={handlePrevStep} className="flex-1" disabled={isLoading}>
                         <ArrowLeft className="mr-2 h-4 w-4" /> Назад к измерениям
                       </Button>
                       // Сохранение происходит автоматически, кнопка не нужна
                       // <Button type="submit" className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
                       //     <Save className="mr-2 h-4 w-4" /> Сохранить запись
                       // </Button>
                     )}
                  </div>
                )}
              </>
            ) : ( 
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading || !selectedInspector || !serialNumber.trim() || !deviceConfig.fields.every(f => f.required ? (formValues[f.id] && String(formValues[f.id]).trim() !== "") : true)}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isLoading ? "Сохранение..." : "Сохранить запись"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
