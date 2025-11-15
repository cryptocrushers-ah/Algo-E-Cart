'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Send } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// -------------------------------
// Order Type (matches backend)
// -------------------------------
interface Order {
  id: number;
  product_name: string;
  amount: number;
  seller: string;
  buyer: string | null;
  status: 'INIT' | 'FUNDED' | 'RELEASED' | 'CANCELLED';
  app_id: number;
  escrow_address: string;
  // Buyer details
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_address: string | null;
}

export default function AdminPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState<number | null>(null);

  // State for the admin key modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // -------------------------------
  // Fetch Orders (only FUNDED)
  // -------------------------------
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/escrow/status`);
      if (!res.ok) throw new Error('Failed to fetch orders');

      const data = await res.json();
      const allOrders: Order[] = data.orders || [];

      // Filter FUNDED orders only
      const funded = allOrders.filter((o) => o.status === 'FUNDED');
      setOrders(funded);

    } catch (err: any) {
      toast.error(err.message || 'Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // -------------------------------
  // Release funds via Admin
  // -------------------------------
  const handleRelease = async () => {
    if (!adminKey || !selectedOrder) {
      toast.warning('Admin key is required.');
      return;
    }

    setReleasing(selectedOrder.id);
    setShowKeyModal(false);

    try {
      const res = await fetch(`${API_BASE}/api/escrow/admin/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedOrder.id,
          admin_key: adminKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to release funds');

      toast.success(`Funds released for order #${selectedOrder.id}`);
      setAdminKey(''); // Clear key
      fetchOrders(); // Refresh the list

    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setReleasing(null);
      setSelectedOrder(null);
    }
  };

  // Helper to open the modal
  const openReleaseModal = (order: Order) => {
    setSelectedOrder(order);
    setShowKeyModal(true);
  };

  // -------------------------------
  // Helpers
  // -------------------------------
  const short = (addr: string | null) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : 'N/A';

  const toAlgos = (micro: number) => (micro / 1_000_000).toFixed(3);

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <div className="max-w-6xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            Admin Panel: Fund Release
          </CardTitle>
          <CardDescription>
            Release funds only for fully funded orders.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-20 flex items-center justify-center text-lg">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-14 text-center text-muted-foreground text-md">
              💤 No funded orders are awaiting release.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Buyer Details</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell className="font-medium">
                      {order.product_name}
                    </TableCell>
                    <TableCell>{toAlgos(order.amount)} ALGO</TableCell>
                    <TableCell className="font-mono text-xs">
                      {short(order.seller)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {short(order.buyer)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {order.buyer_name} ({order.buyer_email})
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="default"
                        size="sm"
                        disabled={releasing === order.id}
                        onClick={() => openReleaseModal(order)}
                      >
                        {releasing === order.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Release Funds
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Admin Key Modal */}
      <Dialog open={showKeyModal} onOpenChange={setShowKeyModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Admin Authentication</DialogTitle>
            <DialogDescription>
              Enter the Admin Secret Key to authorize this action.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="admin-key" className="text-right">
                Secret Key
              </Label>
              <Input
                id="admin-key"
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowKeyModal(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleRelease}
              disabled={releasing === selectedOrder?.id}
            >
              {releasing === selectedOrder?.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}