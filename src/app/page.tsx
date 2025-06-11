
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Zap, Download } from 'lucide-react'; // Added Download icon
import { AppLogo } from '@/components/AppLogo';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Inspector } from '@/types';

export default function HomePage() {
  const [isInspectorDialogOpen, setIsInspectorDialogOpen] = useState(false);
  const [inspectorNameInput, setInspectorNameInput] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleInspectorSubmit = () => {
    const name = inspectorNameInput.trim();
    if (!name) {
      toast({
        title: "Ошибка",
        description: "Фамилия поверителя не может быть пустой.",
        variant: "destructive",
      });
      return;
    }

    let inspectors: Inspector[] = [];
    try {
      const storedInspectors = localStorage.getItem("datafill-inspectors");
      if (storedInspectors) {
        inspectors = JSON.parse(storedInspectors);
      }
    } catch (error) {
      console.error("Failed to parse inspectors from localStorage", error);
      inspectors = [];
    }
    

    let selectedInspector: Inspector | undefined = inspectors.find(
      (i) => i.name.toLowerCase() === name.toLowerCase()
    );
    let newInspectorId: string;

    if (selectedInspector) {
      newInspectorId = selectedInspector.id;
    } else {
      selectedInspector = {
        id: crypto.randomUUID(),
        name: name,
      };
      inspectors.push(selectedInspector);
      newInspectorId = selectedInspector.id;
      localStorage.setItem("datafill-inspectors", JSON.stringify(inspectors));
      toast({
        title: "Поверитель добавлен",
        description: `Новый поверитель "${name}" успешно добавлен.`,
      });
    }
    
    localStorage.setItem("datafill-selectedInspectorId", newInspectorId);

    setIsInspectorDialogOpen(false);
    setInspectorNameInput("");
    router.push('/dashboard');
  };


  return (
    <>
      <Navbar />
      <main className="flex-grow">
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="mb-8 animation-fadeInUp flex justify-center" style={{ animationDelay: '0.1s' }}>
             <AppLogo size="lg" />
          </div>
          <h2 className="font-headline text-4xl md:text-5xl font-bold mb-6 animation-fadeInUp" style={{ animationDelay: '0.2s' }}>
            Ускорьте поверку ваших приборов.
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animation-fadeInUp" style={{ animationDelay: '0.3s' }}>
            DataFill v2 предоставляет интуитивно понятную платформу для простого сбора, хранения и экспорта показаний устройств.
          </p>
          <div className="animation-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <Dialog open={isInspectorDialogOpen} onOpenChange={setIsInspectorDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105">
                  Начать <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>Введите фамилию поверителя</DialogTitle>
                  <DialogDescription>
                    Эта информация будет использоваться для последующей идентификации записей данных.
                    Если поверитель уже существует, он будет выбран. В противном случае, будет создан новый.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                  <Label htmlFor="inspector-name-input">Фамилия поверителя</Label>
                  <Input
                    id="inspector-name-input"
                    value={inspectorNameInput}
                    onChange={(e) => setInspectorNameInput(e.target.value)}
                    placeholder="Например, Иванов"
                    autoFocus
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Отмена</Button>
                  </DialogClose>
                  <Button type="button" onClick={handleInspectorSubmit}>Продолжить</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        <section className="py-16 bg-secondary/50">
          <div className="container mx-auto px-4">
            <h3 className="font-headline text-3xl font-semibold text-center mb-12 animation-fadeInUp" style={{ animationDelay: '0.5s' }}>
              Ключевые особенности
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: <Zap className="h-8 w-8 text-accent" />, title: "Сканирование QR-кодов", description: "Автоматизируйте ввод серийных номеров путем прямого сканирования QR-кодов." },
                { icon: <CheckCircle className="h-8 w-8 text-accent" />, title: "Динамические формы", description: "Формы ввода адаптируются к выбранному вами устройству, отображая только необходимые поля данных." },
                { icon: <Download className="h-8 w-8 text-accent" />, title: "Простой экспорт", description: "Экспортируйте собранные данные в Excel (.xlsx) для отчетности и анализа." },
              ].map((feature, index) => (
                <Card key={feature.title} className="text-center shadow-md hover:shadow-xl transition-shadow duration-300 animation-fadeInUp" style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
                  <CardHeader>
                    <div className="mx-auto bg-accent/20 p-3 rounded-full w-fit mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="text-center p-6 border-t">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} DataFill v2. Все права защищены.</p>
      </footer>
    </>
  );
}
