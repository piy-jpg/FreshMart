import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/orderService';
import { OrderCard } from '../../components/orders/OrderCard';
import { DeliveryTracker } from '../../components/orders/DeliveryTracker';
import { Loader } from '../../components/common/Loader';

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [activeTracking, setActiveTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getUserOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  const handleTrack = async (orderId) => {
    const data = await orderService.track(orderId);
    setActiveTracking(data);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-stone-900">My Fresh Orders</h1>
      {activeTracking && <DeliveryTracker order={activeTracking} />}
      {loading ? <Loader /> : (
        <div className="space-y-3">
          {orders.map(o => <OrderCard key={o.id} order={o} onTrack={handleTrack} />)}
        </div>
      )}
    </div>
  );
}
