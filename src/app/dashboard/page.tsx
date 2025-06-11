
"use client";

import { useState, useEffect, Suspense } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";

function DashboardClientPage() {
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [selectedInspectorId, setSelectedInspectorId] = useState<string | undefined>();
  const [dataEntries, setDataEntries] = useState<DataEntry[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<DeviceId | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedInspector = inspectors.find(i => i.id === selectedInspectorId);

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
        localStorage.removeItem("datafill-selectedInspectorId");
        setSelectedInspectorId(undefined); 
      }
    } else {
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
    setIsInitialDataLoaded(true);
  }, []); 

  useEffect(() => {
    const deviceFromQuery = searchParams.get('device') as DeviceId | null;
    if (deviceFromQuery && Object.keys(DEVICE_CONFIGS).includes(deviceFromQuery)) {
      if (selectedDeviceId !== deviceFromQuery) {
        setSelectedDeviceId(deviceFromQuery);
        setTimeout(() => router.replace('/dashboard', { scroll: false }), 0);
      }
    }
  }, [searchParams, selectedDeviceId, router]);


  useEffect(() => {
    if (!isInitialDataLoaded) return;
    localStorage.setItem("datafill-inspectors", JSON.stringify(inspectors));
  }, [inspectors, isInitialDataLoaded]);

  useEffect(() => {
    if (!isInitialDataLoaded) return;
    localStorage.setItem("datafill-entries", JSON.stringify(dataEntries));
  }, [dataEntries, isInitialDataLoaded]);

  useEffect(() => {
    if (!isInitialDataLoaded) return;

    if (selectedInspectorId) {
      localStorage.setItem("datafill-selectedInspectorId", selectedInspectorId);
    } else {
      localStorage.removeItem("datafill-selectedInspectorId");
    }
  }, [selectedInspectorId, inspectors, isInitialDataLoaded]);

  useEffect(() => {
    if (!isInitialDataLoaded) return;

    if (selectedDeviceId) {
        localStorage.setItem("datafill-selectedDevice", selectedDeviceId);
    } else {
        localStorage.removeItem("datafill-selectedDevice");
    }
  }, [selectedDeviceId, isInitialDataLoaded]);


  const handleSaveEntry = (entry: DataEntry) => {
    setIsLoading(true);
    setTimeout(() => {
      setDataEntries(prev => [entry, ...prev]);
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

  if (!isInitialDataLoaded) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-8 flex-grow">
          <Skeleton className="h-8 w-1/3 mb-8" />
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <Card className="lg:col-span-1 shadow-lg">
              <CardHeader>
                <Skeleton className="h-6 w-1/2 mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Skeleton className="h-5 w-1/3 mb-3" />
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
                <Separator />
                <div>
                  <Skeleton className="h-5 w-1/3 mb-3" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </CardContent>
            </Card>
            <div className="lg:col-span-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="mt-12">
            <Skeleton className="h-40 w-full" />
          </div>
        </main>
        <footer className="text-center p-6 border-t mt-auto">
          <Skeleton className="h-4 w-1/4 mx-auto" />
        </footer>
      </>
    );
  }

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
                        isAlcotest && "opacity-70 hover:opacity-80"
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

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-8 flex-grow">
          <Skeleton className="h-8 w-1/3 mb-8" />
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <Card className="lg:col-span-1 shadow-lg">
              <CardHeader>
                <Skeleton className="h-6 w-1/2 mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Skeleton className="h-5 w-1/3 mb-3" />
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
                <Separator />
                <div>
                  <Skeleton className="h-5 w-1/3 mb-3" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </CardContent>
            </Card>
            <div className="lg:col-span-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="mt-12">
            <Skeleton className="h-40 w-full" />
          </div>
        </main>
        <footer className="text-center p-6 border-t mt-auto">
          <Skeleton className="h-4 w-1/4 mx-auto" />
        </footer>
      </>
    }>
      <DashboardClientPage />
    </Suspense>
  );
}

    
