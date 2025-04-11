
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Service } from "@/types/service";
import { User } from "@/types/auth";

interface ServiceDetailsProps {
  service: Service;
  user: User | null;
  hasSufficientCredits: boolean;
}

export function ServiceDetails({ service, user, hasSufficientCredits }: ServiceDetailsProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{service?.name}</CardTitle>
        <CardDescription>{service?.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-lg font-medium">Precio:</p>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-2xl font-bold">{service?.price} créditos</p>
              <p className="text-gray-500">o</p>
              <p className="text-xl font-bold">${service ? (service.price * 4).toFixed(2) : '0.00'} USD</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Tu saldo actual:</p>
            <p className={`text-lg font-bold ${hasSufficientCredits ? 'text-green-600' : 'text-red-600'}`}>
              {user?.credits || 0} créditos
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
