"use client";

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertCircle, XCircle, Wallet } from 'lucide-react';

interface TradeStatusBadgeProps {
  status: 'pending' | 'funded' | 'completed' | 'disputed' | 'refunded';
}

export default function TradeStatusBadge({ status }: TradeStatusBadgeProps) {
  const config = {
    pending: {
      label: 'Pending',
      icon: Clock,
      variant: 'secondary' as const,
    },
    funded: {
      label: 'Funded',
      icon: Wallet,
      variant: 'default' as const,
    },
    completed: {
      label: 'Completed',
      icon: CheckCircle2,
      variant: 'default' as const,
      className: 'bg-green-500 hover:bg-green-600',
    },
    disputed: {
      label: 'Disputed',
      icon: AlertCircle,
      variant: 'destructive' as const,
    },
    refunded: {
      label: 'Refunded',
      icon: XCircle,
      variant: 'secondary' as const,
    },
  };

  const { label, icon: Icon, variant, className } = config[status];

  return (
    <Badge variant={variant} className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}
