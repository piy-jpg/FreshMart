const { db } = require('../../database/connection');
const { getCanonicalStep, getStepNumber, SERIAL_ORDER_STEPS } = require('../../shared/enums');
const { generateNumericOTP } = require('../../shared/utilities');
const notificationService = require('./notificationService');

class OrderService {
  createOrder(orderData, customerUser) {
    const orderId = 'SJH' + Math.floor(10000 + Math.random() * 90000);
    const otp = generateNumericOTP(4);

    const items = Array.isArray(orderData.items) ? orderData.items : Object.values(orderData.items || {});
    let subtotal = 0;
    const cleanItems = items.map(item => {
      const price = Number(item.price || item.unitPrice || 0);
      const qty = Number(item.quantity || item.qty || 1);
      subtotal += (price * qty);
      return {
        id: item.id || item.productId || 'PROD-' + Math.floor(100 + Math.random() * 900),
        productId: item.productId || item.id,
        name: item.name || item.title || 'Fresh Product',
        hindiName: item.hindiName || '',
        price,
        originalPrice: Number(item.originalPrice || price),
        quantity: qty,
        unit: item.unit || item.weightLabel || '1 kg',
        image: item.image || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=150'
      };
    });

    const deliveryFee = subtotal >= 199 ? 0 : 29;
    const discount = Number(orderData.discount || 0);
    const totalAmount = Math.max(0, subtotal + deliveryFee - discount);

    const newOrder = {
      id: orderId,
      customerId: customerUser ? customerUser.id : (orderData.customerId || 'guest_' + Date.now()),
      customerName: (orderData.deliveryAddress && orderData.deliveryAddress.fullName) || (customerUser && customerUser.name) || 'Valued Customer',
      customerPhone: (orderData.deliveryAddress && orderData.deliveryAddress.phone) || (customerUser && customerUser.phone) || '9876543210',
      items: cleanItems,
      subtotal,
      deliveryFee,
      discount,
      totalAmount,
      paymentMethod: orderData.paymentMethod || 'COD',
      paymentStatus: (orderData.paymentMethod === 'ONLINE' || orderData.paymentMethod === 'RAZORPAY') ? 'PAID' : 'PENDING',
      status: 'ORDER_PLACED',
      currentStep: 1,
      otp,
      otpVerified: false,
      deliveryBoyId: null,
      deliveryBoyName: null,
      deliveryStatus: 'UNASSIGNED',
      deliveryAddress: orderData.deliveryAddress || {
        fullName: 'Customer',
        phone: '9876543210',
        city: 'Noida',
        pincode: '201301'
      },
      deliverySlot: orderData.deliverySlot || 'Standard (30 Mins)',
      timeline: [
        {
          status: 'ORDER_RECEIVED',
          timestamp: new Date().toISOString(),
          title: 'Order Placed & Received',
          description: `Order #${orderId} has been successfully received by FreshMart Hub.`,
          userRole: 'CUSTOMER',
          actorName: (customerUser && customerUser.name) || 'Customer'
        }
      ],
      createdAt: new Date().toISOString()
    };

    db.insert('orders', newOrder);
    notificationService.notifyOrderCreated(newOrder);
    return newOrder;
  }

  transitionOrderStep(orderId, targetStatusInput, actor) {
    const order = db.getById('orders', orderId);
    if (!order) throw new Error('Order not found');

    const targetStepObj = getCanonicalStep(targetStatusInput);
    if (!targetStepObj) throw new Error(`Unknown target order status: ${targetStatusInput}`);

    const targetStepNum = targetStepObj.step;
    const targetStatusKey = targetStepObj.key;

    const currentStepNum = order.currentStep || getStepNumber(order.status) || 1;

    // Strict sequential transition validation: Must be exactly currentStepNum + 1 (unless cancelling/failing)
    if (targetStatusKey === 'CANCELLED' || targetStatusKey === 'DELIVERY_FAILED') {
      // Allowed from certain states
    } else if (targetStepNum !== currentStepNum + 1) {
      const currentStepObj = SERIAL_ORDER_STEPS[currentStepNum - 1] || SERIAL_ORDER_STEPS[0];
      const requiredNextStepObj = SERIAL_ORDER_STEPS[currentStepNum] || SERIAL_ORDER_STEPS[11];
      const err = new Error(`Invalid status transition: Cannot jump from Step ${currentStepNum} (${currentStepObj.label}) to Step ${targetStepNum} (${targetStepObj.label}). Step-by-step workflow requires: Step ${requiredNextStepObj.step} (${requiredNextStepObj.label}).`);
      err.statusCode = 400;
      throw err;
    }

    // Step 12 (Delivery) requires OTP verification
    if (targetStepNum === 12 && !order.otpVerified) {
      const err = new Error('Customer OTP verification is required before marking order as delivered.');
      err.statusCode = 400;
      throw err;
    }

    const previousStatus = order.status;
    const updates = {
      status: targetStatusKey,
      currentStep: targetStepNum,
      updatedAt: new Date().toISOString()
    };

    if (targetStepNum === 6) { // HANDED_TO_DELIVERY_BOY
      updates.handedOverAt = new Date().toISOString();
      updates.deliveryStatus = 'ASSIGNED';
    } else if (targetStepNum === 7) { // DELIVERY_BOY_ACCEPTED
      updates.deliveryStatus = 'ACCEPTED';
    } else if (targetStepNum === 8) { // PICKED_UP
      updates.deliveryStatus = 'PICKED_UP';
      updates.pickedUpAt = new Date().toISOString();
    } else if (targetStepNum === 9) { // OUT_FOR_DELIVERY
      updates.deliveryStatus = 'OUT_FOR_DELIVERY';
    } else if (targetStepNum === 10) { // ARRIVED
      updates.deliveryStatus = 'ARRIVED';
      updates.arrivedAt = new Date().toISOString();
    } else if (targetStepNum === 11) { // CUSTOMER_VERIFIED
      updates.deliveryStatus = 'CUSTOMER_VERIFIED';
      updates.otpVerified = true;
    } else if (targetStepNum === 12) { // DELIVERED
      updates.deliveryStatus = 'DELIVERED';
      updates.deliveredAt = new Date().toISOString();
      if (order.paymentMethod === 'COD') {
        updates.paymentStatus = 'PAID';
      }
    }

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: targetStatusKey,
      timestamp: new Date().toISOString(),
      title: targetStepObj.label,
      description: `Order transitioned to ${targetStepObj.label}.`,
      userRole: actor ? actor.role : 'SYSTEM',
      actorName: actor ? actor.name : 'System'
    });
    updates.timeline = order.timeline;

    const updated = db.update('orders', orderId, updates);
    notificationService.notifyOrderStatusUpdated(updated, previousStatus, targetStatusKey, actor ? actor.name : 'System');
    return updated;
  }

  verifyOrderOTP(orderId, enteredOTP, actor) {
    const order = db.getById('orders', orderId);
    if (!order) throw new Error('Order not found');

    if (String(order.otp).trim() !== String(enteredOTP).trim()) {
      const err = new Error('Invalid OTP. Please ask customer for correct 4-digit code.');
      err.statusCode = 400;
      throw err;
    }

    return this.transitionOrderStep(orderId, 'CUSTOMER_VERIFIED', actor);
  }
}

module.exports = new OrderService();
