import React, { useState } from 'react';
import { useCart } from '../../hooks/useCart';
import { orderService } from '../../services/orderService';
import { AddressSelector } from '../../components/checkout/AddressSelector';
import { DeliveryOptions } from '../../components/checkout/DeliveryOptions';
import { PaymentMethod } from '../../components/checkout/PaymentMethod';
import { OrderSummary } from '../../components/checkout/OrderSummary';
import { useNavigate } from 'react-router-dom';

export function CheckoutPage() {
  const { cart, subtotal, clearCart } = useCart();
  const [selectedAddr, setSelectedAddr] = useState('addr_1');
  const [slot, setSlot] = useState('EXPRESS');
  const [method, setMethod] = useState('UPI (Google Pay)');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const order = await orderService.create({
        items: Object.values(cart),
        deliverySlot: slot,
        paymentMethod: method,
        totalAmount: subtotal + 30
      });
      clearCart();
      navigate('/orders');
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h2 className="text-xl font-black text-stone-900">1. Delivery Address</h2>
        <AddressSelector selectedId={selectedAddr} onSelect={setSelectedAddr} />
        <h2 className="text-xl font-black text-stone-900">2. Delivery Slot</h2>
        <DeliveryOptions selectedSlot={slot} onSelect={setSlot} />
        <h2 className="text-xl font-black text-stone-900">3. Payment Option</h2>
        <PaymentMethod method={method} onSelect={setMethod} />
      </div>
      <div>
        <OrderSummary items={Object.values(cart)} total={subtotal + 30} />
        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md mt-6 cursor-pointer"
        >
          {loading ? 'Processing Order...' : 'Place Order & Pay →'}
        </button>
      </div>
    </div>
  );
}
