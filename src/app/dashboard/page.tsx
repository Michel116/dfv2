
"use client";

import { useState, useEffect } from "react";
import type { Inspector, DataEntry, DeviceId } from "@/types";
import { DEVICE_OPTIONS, DEVICE_CONFIGS } from "@/config/devices";
import { Navbar } from "@/components/layout/Navbar";
import { DataEntryForm } from "@/components/dashboard/DataEntryForm";
import { DataTable } from "@/components/dashboard/DataTable";
import { InspectorManager } from "@/components/dashboard/InspectorManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [selectedInspectorId, setSelectedInspectorId] = useState<string | undefined>();
  const [dataEntries, setDataEntries] = useState<DataEntry[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<DeviceId | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false); // New state
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedInspector = inspectors.find(i => i.id === selectedInspectorId);

  // Load data from localStorage on mount
  useEffect(() => {
    let loadedInspectors: Inspector[] = [];
    const storedInspectors = localStorage.getItem("datafill-inspectors");
    if (storedInspectors) {
      try {
        loadedInspectors = JSON.parse(storedInspectors);
        setInspectors(loadedInspectors);
      } catch (e) {
        console.error("Failed to parse inspectors from localStorage", e);
        setInspectors([]);
      }
    }

    const storedSelectedInspectorId = localStorage.getItem("datafill-selectedInspectorId");
    if (storedSelectedInspectorId) {
      if (loadedInspectors.find(i => i.id === storedSelectedInspectorId)) {
        setSelectedInspectorId(storedSelectedInspectorId);
      } else {
        // Stored ID is stale or invalid
        localStorage.removeItem("datafill-selectedInspectorId");
        setSelectedInspectorId(undefined); 
      }
    } else {
      // No stored selected inspector ID
      setSelectedInspectorId(undefined); 
    }

    const storedEntries = localStorage.getItem("datafill-entries");
    if (storedEntries) {
      try {
        setDataEntries(JSON.parse(storedEntries));
      } catch (e) {
        console.error("Failed to parse entries from localStorage", e);
        setDataEntries([]);
      }
    }
    
    const deviceFromQuery = searchParams.get('device') as DeviceId | null;
    if (deviceFromQuery && Object.keys(DEVICE_CONFIGS).includes(deviceFromQuery)) {
      setSelectedDeviceId(deviceFromQuery);
    } else {
      const storedSelectedDevice = localStorage.getItem("datafill-selectedDevice") as DeviceId | null;
      if (storedSelectedDevice && Object.keys(DEVICE_CONFIGS).includes(storedSelectedDevice)) {
          setSelectedDeviceId(storedSelectedDevice);
      }
    }
    setIsInitialDataLoaded(true); // Signal that initial load is complete
  }, []); 

  // Handle device selection from query parameter if it changes after mount
  useEffect(() => {
    const deviceFromQuery = searchParams.get('device') as DeviceId | null;
    if (deviceFromQuery && Object.keys(DEVICE_CONFIGS).includes(deviceFromQuery)) {
      if (selectedDeviceId !== deviceFromQuery) {
        setSelectedDeviceId(deviceFromQuery);
        // Remove the query param from URL after processing to keep URL clean
        // Use a timeout to ensure state update has a chance to propagate before router.replace
        setTimeout(() => router.replace('/dashboard', { scroll: false }), 0);
      }
    }
  }, [searchParams, selectedDeviceId, router]);


  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!isInitialDataLoaded) return; // Guard against premature save
    localStorage.setItem("datafill-inspectors", JSON.stringify(inspectors));
  }, [inspectors, isInitialDataLoaded]);

  useEffect(() => {
    if (!isInitialDataLoaded) return; // Guard against premature save
    localStorage.setItem("datafill-entries", JSON.stringify(dataEntries));
  }, [dataEntries, isInitialDataLoaded]);

  useEffect(() => {
    if (!isInitialDataLoaded) return; // Guard against premature save

    if (selectedInspectorId) {
      localStorage.setItem("datafill-selectedInspectorId", selectedInspectorId);
    } else {
      // If selectedInspectorId is undefined (after initial load), remove it.
      // This handles cases like deleting the selected inspector or no valid initial selection.
      localStorage.removeItem("datafill-selectedInspectorId");
    }
  }, [selectedInspectorId, inspectors, isInitialDataLoaded]); // `inspectors` kept in dep array for cases where selectedId becomes invalid due to inspector list change

  useEffect(() => {
    if (!isInitialDataLoaded) return; // Guard against premature save

    if (selectedDeviceId) {
        localStorage.setItem("datafill-selectedDevice", selectedDeviceId);
    } else {
        localStorage.removeItem("datafill-selectedDevice");
    }
  }, [selectedDeviceId, isInitialDataLoaded]);


  const handleSaveEntry = (entry: DataEntry) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setDataEntries(prev => [entry, ...prev]); // Add new entries to the beginning
      setIsLoading(false);
    }, 500);
  };

  const handleDeleteEntry = (id: string) => {
    const entryToDelete = dataEntries.find(entry => entry.id === id);
    setDataEntries(prev => prev.filter(entry => entry.id !== id));
    if (entryToDelete) {
      toast({ title: "Запись удалена", description: `Запись для S/N ${entryToDelete.serialNumber} удалена.`});
    }
  };
  
  const handleClearAllEntries = () => {
    setDataEntries([]);
    toast({ title: "Все записи очищены", description: "Все собранные данные были удалены."});
  };

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <h2 className="font-headline text-3xl font-semibold mb-8">Панель управления данными</h2>
        
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <Card className="lg:col-span-1 shadow-lg">
            <CardHeader>
              <CardTitle>Конфигурация</CardTitle>
              <CardDescription>Выберите тип устройства и укажите поверителя для ввода данных.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-lg font-medium mb-3">Тип устройства</h4>
                <div className="space-y-4">
                {DEVICE_OPTIONS.map(option => {
                  const deviceConfig = DEVICE_CONFIGS[option.value as DeviceId];
                  const IconComponent = deviceConfig.Icon;
                  const isSelected = selectedDeviceId === deviceConfig.id;
                  const isAlcotest = deviceConfig.id === 'alcotest';

                  return (
                    <Card
                      key={deviceConfig.id}
                      className={cn(
                        "cursor-pointer hover:shadow-md transition-all duration-200 ease-in-out relative",
                        isSelected ? "border-primary ring-2 ring-primary shadow-md scale-105" : "border-border hover:border-primary/50",
                        isAlcotest && "opacity-70 hover:opacity-80" // Slightly dim if alcotest
                      )}
                      onClick={() => setSelectedDeviceId(deviceConfig.id)}
                    >
                      <CardContent className="p-3 flex items-center space-x-3">
                        <div className={cn(
                          "p-3 rounded-md transition-colors",
                          isSelected ? "bg-primary/10" : "bg-accent/10 group-hover:bg-primary/10"
                        )}>
                          <IconComponent
                            className={cn("h-8 w-8 transition-colors", isSelected ? "text-primary" : "text-accent group-hover:text-primary")}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{deviceConfig.name}</p>
                          <p className="text-xs text-muted-foreground">{deviceConfig.description}</p>
                        </div>
                        {isAlcotest && (
                          <Badge variant="outline" className="text-xs absolute top-2 right-2">
                            в разработке
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="text-lg font-medium mb-3">Поверитель</h4>
                 <InspectorManager
                  inspectors={inspectors}
                  setInspectors={setInspectors}
                  selectedInspector={selectedInspectorId}
                  setSelectedInspector={setSelectedInspectorId}
                />
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <DataEntryForm
              selectedDevice={selectedDeviceId}
              selectedInspector={selectedInspector}
              onSaveEntry={handleSaveEntry}
              isLoading={isLoading}
            />
          </div>
        </div>

        <div className="mt-12">
          <DataTable entries={dataEntries} onDeleteEntry={handleDeleteEntry} onClearAllEntries={handleClearAllEntries} />
        </div>
      </main>
      <footer className="text-center p-6 border-t mt-auto">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} DataFill v2. Панель управления.</p>
      </footer>
    </>
  );
}

