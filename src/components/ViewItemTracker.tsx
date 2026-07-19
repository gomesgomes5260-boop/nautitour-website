'use client';

import { useEffect, useRef } from 'react';
import { analytics } from '@/lib/analytics';

// Dispara view_item do GA4 no mount da página de um tour. Renderiza nada —
// mesmo pattern do PurchaseTracker (client invisível montado por server page).
export default function ViewItemTracker({
  itemId,
  itemName,
  valueBRL,
}: {
  itemId: string;
  itemName: string;
  valueBRL: number | null;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    analytics.viewItem(itemId, itemName, valueBRL);
  }, [itemId, itemName, valueBRL]);

  return null;
}
