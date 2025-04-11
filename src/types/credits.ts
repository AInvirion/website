
/**
 * Credit package definition
 */
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Credit transaction definition
 */
export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  reference_id?: string;
  created_at?: string;
}

/**
 * Transaction types
 */
export type TransactionType = 
  | 'purchase'      // Compra de créditos
  | 'usage'         // Uso de créditos
  | 'consumption'   // Consumo de créditos en un servicio
  | 'service_payment' // Pago por servicio con créditos
  | 'payment_failed'  // Fallo en el pago
  | 'addition'        // Adición manual de créditos (ej. por admin)
  | 'session_expired'; // Sesión de pago expirada

