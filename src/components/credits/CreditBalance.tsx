
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserWithRole } from "@/types/auth";

interface CreditBalanceProps {
  user: UserWithRole | null;
}

export function CreditBalance({ user }: CreditBalanceProps) {
  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <CardTitle className="text-2xl">Tu Saldo de Créditos</CardTitle>
        <CardDescription className="text-white text-opacity-80">
          Utiliza tus créditos para acceder a servicios
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="text-4xl font-bold">{user?.credits || 0} créditos</div>
        <p className="text-gray-500 mt-1">
          1 crédito = $4.00 USD para servicios
        </p>
      </CardContent>
    </Card>
  );
}
