
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreditPackage } from "@/types/credits";

export function useCreditPackages() {
  return useQuery({
    queryKey: ["credit-packages"],
    queryFn: async () => {
      // Use any type for data to avoid TypeScript errors with Supabase schema
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('credits', { ascending: true });

      if (error) throw error;
      
      // Cast to CreditPackage[] after fetching
      return data as unknown as CreditPackage[];
    },
  });
}
