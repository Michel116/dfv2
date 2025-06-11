
"use client";

import type { Inspector } from "@/types";
import { useState, type Dispatch, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { PlusCircle, Trash2, UserCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface InspectorManagerProps {
  inspectors: Inspector[];
  setInspectors: Dispatch<SetStateAction<Inspector[]>>;
  selectedInspector: string | undefined;
  setSelectedInspector: (id: string | undefined) => void;
}

export function InspectorManager({ inspectors, setInspectors, selectedInspector, setSelectedInspector }: InspectorManagerProps) {
  const [newInspectorName, setNewInspectorName] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleAddInspector = () => {
    if (newInspectorName.trim() === "") {
      toast({ title: "Ошибка", description: "Имя поверителя не может быть пустым.", variant: "destructive" });
      return;
    }
    if (inspectors.find(inspector => inspector.name.toLowerCase() === newInspectorName.trim().toLowerCase())) {
      toast({ title: "Ошибка", description: "Поверитель с таким именем уже существует.", variant: "destructive" });
      return;
    }
    const newInspector: Inspector = {
      id: crypto.randomUUID(),
      name: newInspectorName.trim(),
    };
    setInspectors(prev => [...prev, newInspector]);
    setSelectedInspector(newInspector.id);
    setNewInspectorName("");
    setIsAddDialogOpen(false);
    toast({ title: "Успешно", description: `Поверитель "${newInspector.name}" добавлен.` });
  };

  const handleDeleteInspector = (idToDelete: string) => {
    const inspectorToDelete = inspectors.find(inspector => inspector.id === idToDelete);
    setInspectors(prev => prev.filter(inspector => inspector.id !== idToDelete));
    if (selectedInspector === idToDelete) {
      setSelectedInspector(inspectors.length > 1 ? inspectors.filter(i => i.id !== idToDelete)[0]?.id : undefined);
    }
    if (inspectorToDelete) {
      toast({ title: "Успешно", description: `Поверитель "${inspectorToDelete.name}" удален.` });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="inspector-select" className="text-base font-medium">Поверитель</Label>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Добавить нового
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Добавить нового поверителя</DialogTitle>
              <DialogDescription>
                Введите фамилию нового поверителя.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Фамилия
                </Label>
                <Input
                  id="name"
                  value={newInspectorName}
                  onChange={(e) => setNewInspectorName(e.target.value)}
                  className="col-span-3"
                  placeholder="например, Иванов"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                 <Button type="button" variant="outline">Отмена</Button>
              </DialogClose>
              <Button type="button" onClick={handleAddInspector}>Добавить поверителя</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Select value={selectedInspector} onValueChange={setSelectedInspector}>
        <SelectTrigger id="inspector-select" className="w-full">
          <SelectValue placeholder="Выберите поверителя" />
        </SelectTrigger>
        <SelectContent>
          {inspectors.length === 0 && <p className="p-4 text-sm text-muted-foreground">Поверители еще не добавлены.</p>}
          {inspectors.map(inspector => (
            <SelectItem key={inspector.id} value={inspector.id}>
              <div className="flex items-center justify-between w-full">
                <span>{inspector.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {inspectors.length > 0 && (
        <div className="mt-4 border rounded-md p-2">
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">Управление поверителями:</h4>
          <ScrollArea className="h-[100px] pr-3">
            <ul className="space-y-1">
              {inspectors.map(inspector => (
                <li key={inspector.id} className="flex items-center justify-between p-1.5 hover:bg-muted/50 rounded-sm text-sm">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                    {inspector.name}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleDeleteInspector(inspector.id)}
                    aria-label={`Удалить поверителя ${inspector.name}`}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

