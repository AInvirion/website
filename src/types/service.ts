
/**
 * Service definition
 */
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  created_at?: string;
  updated_at?: string;
}
