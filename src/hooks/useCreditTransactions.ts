
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreditTransaction } from "@/types/credits";

export function useCreditTransactions(userId: string | undefined) {
  return useQuery({
    queryKey: ["credit-transactions", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Cast to CreditTransaction[] after fetching
      return data as unknown as CreditTransaction[];
    },
    enabled: !!userId,
  });
}
