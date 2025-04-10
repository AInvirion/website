
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
  type: string;
  reference_id?: string;
  created_at?: string;
}
