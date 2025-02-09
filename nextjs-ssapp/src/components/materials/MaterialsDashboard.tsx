"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { client } from "@/sanity/client";
import {
  Loader,
  CheckCircle,
  AlertTriangle,
  XCircle,
  History,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Тип описує кожен документ 'material' з вашої бази.
 * Тут визначте реальні поля, які є в схемі Sanity для матеріалів.
 */
interface Material {
  quantity: number;
  minQuantity?: number;
  updatedAt: string;
}

/**
 * Пропси для компонента, якщо потрібно передати метод перезавантаження ззовні.
 */
interface MaterialsDashboardProps {
  refreshMaterials?: () => void;
}

/**
 * Об'єкт зі стилями для кольорів статусу
 */
const STATUS_COLORS = {
  green: "text-green-500",
  yellow: "text-yellow-500",
  red: "text-red-500",
};

export default function MaterialsDashboard({
  refreshMaterials,
}: MaterialsDashboardProps) {
  // Масив матеріалів, типізований за допомогою інтерфейсу Material
  const [materials, setMaterials] = useState<Material[]>([]);
  // Індикатор завантаження
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Отримуємо дані про матеріали з Sanity
   */
  const fetchMaterials = async () => {
    setLoading(true);
    try {
      // Вказуємо <Material[]> щоб TypeScript знав, який тип повертає запит
      const data = await client.fetch<Material[]>(
        `*[_type == "material"]{quantity, minQuantity, updatedAt}`
      );
      setMaterials(data);
    } catch (error) {
      toast.error("Error fetching materials");
    } finally {
      setLoading(false);
    }
  };

  // Викликаємо fetchMaterials при першому завантаженні
  useEffect(() => {
    fetchMaterials();
  }, []);

  // Загальна кількість матеріалів
  const totalMaterials = materials.length;

  // Підрахунок кольорів за рівнями запасу
  const greenCount = materials.filter(
    (m) => m.quantity >= (m.minQuantity ?? 0) + 10
  ).length;
  const yellowCount = materials.filter(
    (m) =>
      m.quantity >= (m.minQuantity ?? 0) &&
      m.quantity < (m.minQuantity ?? 0) + 10
  ).length;
  const redCount = materials.filter(
    (m) => m.quantity < (m.minQuantity ?? 0)
  ).length;

  // Визначення дати останнього оновлення
  const latestUpdate =
    materials.length > 0
      ? new Date(
          Math.max(...materials.map((m) => new Date(m.updatedAt).getTime()))
        ).toLocaleDateString()
      : "No updates";

  // Визначення часу останнього оновлення
  const latestUpdateTime =
    materials.length > 0
      ? new Date(
          Math.max(...materials.map((m) => new Date(m.updatedAt).getTime()))
        ).toLocaleTimeString()
      : "No updates";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      {/* Карта з загальною кількістю матеріалів */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold">
            {loading ? <Loader className="animate-spin" /> : totalMaterials}
          </div>
        </CardContent>
      </Card>

      {/* Карта з підсумком запасів (green / yellow / red) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle className={STATUS_COLORS.green} />
            <span className="text-lg">{greenCount} Good</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className={STATUS_COLORS.yellow} />
            <span className="text-lg">{yellowCount} Low Stock</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className={STATUS_COLORS.red} />
            <span className="text-lg">{redCount} Critical</span>
          </div>
        </CardContent>
      </Card>

      {/* Карта з датою та часом останнього оновлення */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Latest Update</CardTitle>
          <History className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? <Loader className="animate-spin" /> : latestUpdate}
          </div>
          <p className="text-xs text-muted-foreground">
            {loading ? <Loader className="animate-spin" /> : latestUpdateTime}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
