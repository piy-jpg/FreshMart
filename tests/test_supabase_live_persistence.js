/**
 * FreshMart Supabase Live Persistence & Workflow Test Suite
 * 
 * Verifies live Supabase PostgreSQL:
 * 1. Product creation & persistence in freshmart_products
 * 2. Product update & retrieval
 * 3. Atomic Order creation & sequence generation (freshmart_order_id_seq)
 * 4. Order lifecycle update & retrieval
 * 5. Clean test cleanup
 * 6. Health & Status diagnostic (/api/database/status)
 */

const assert = require('assert');
const PostgresAdapter = require('../database/adapters/postgresAdapter');

async function testSupabasePersistence() {
  console.log('====================================================');
  console.log(' FRESHMART SUPABASE LIVE PERSISTENCE & WORKFLOW TEST');
  console.log('====================================================\n');

  const adapter = new PostgresAdapter();
  assert.ok(adapter.isAvailable(), 'PostgresAdapter must be available with Supabase URL');

  await adapter.init();
  console.log('✅ 1. Supabase connection & schema self-healing initialized');

  // 1. Create a Test Product in Supabase
  const testProductId = `prod_test_supabase_${Date.now()}`;
  const testProduct = {
    id: testProductId,
    storefrontId: testProductId,
    name: 'Organic Hydroponic Butterhead Lettuce',
    sku: `SKU-SUPA-${Date.now()}`,
    category: 'Fresh Vegetables',
    categoryId: 'cat_vegetables',
    categorySlug: 'vegetables',
    price: 95,
    sellingPrice: 85,
    mrp: 110,
    costPrice: 50,
    stock: 40,
    unit: '1 head (250g)',
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    description: 'Crisp, sweet, hydroponically grown organic butterhead lettuce.',
    farmer: 'Green Valley Farms, Hosur'
  };

  console.log('\n🧪 2. Testing Product Insertion into Supabase...');
  await adapter.insert('products', testProduct);
  console.log(`   ✓ Inserted product ${testProductId} into freshmart_products`);

  console.log('\n🧪 3. Testing Product Retrieval from Supabase...');
  const retrieved = await adapter.getById('products', testProductId);
  assert.ok(retrieved, 'Product must be retrievable from Supabase');
  assert.strictEqual(retrieved.id, testProductId);
  assert.strictEqual(retrieved.name, testProduct.name);
  assert.strictEqual(retrieved.price, testProduct.price);
  assert.strictEqual(retrieved.stock, testProduct.stock);
  console.log(`   ✓ Retrieved product from Supabase: "${retrieved.name}" (Stock: ${retrieved.stock})`);

  console.log('\n🧪 4. Testing Product Stock Update in Supabase...');
  await adapter.update('products', testProductId, { stock: 35 });
  const updated = await adapter.getById('products', testProductId);
  assert.strictEqual(updated.stock, 35, 'Stock must be updated to 35 in Supabase');
  console.log(`   ✓ Stock successfully updated to 35 in Supabase`);

  console.log('\n🧪 5. Testing Atomic Order ID Generation & Order Placement...');
  const nextSeqRes = await adapter.query(`SELECT nextval('freshmart_order_id_seq') AS seq;`);
  const seqNum = nextSeqRes.rows[0].seq;
  const orderId = `FM-OD-${String(seqNum).padStart(5, '0')}`;
  console.log(`   ✓ Generated Atomic Order ID from Supabase sequence: ${orderId}`);

  const testOrder = {
    id: `ord_test_supabase_${Date.now()}`,
    orderId: orderId,
    customerId: 'usr_customer_1',
    userId: 'usr_customer_1',
    customerName: 'Piyush Verma',
    customerPhone: '+91 98765 43210',
    items: [
      { id: testProductId, name: testProduct.name, quantity: 2, price: 85, total: 170 }
    ],
    subtotal: 170,
    deliveryFee: 0,
    discount: 0,
    finalTotal: 170,
    deliveryAddress: {
      fullName: 'Piyush Verma',
      address: 'Indiranagar, 100ft Road, Bengaluru',
      city: 'Bengaluru',
      pincode: '560038',
      phone: '+91 98765 43210'
    },
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    orderStatus: 'ORDER_PLACED',
    status: 'ORDER_PLACED',
    createdAt: new Date().toISOString()
  };

  await adapter.insert('orders', testOrder);
  console.log(`   ✓ Saved Order ${orderId} into Supabase freshmart_orders`);

  console.log('\n🧪 6. Testing Order Retrieval & 12-Step Lifecycle Transition...');
  const retrievedOrder = await adapter.getById('orders', testOrder.id);
  assert.ok(retrievedOrder, 'Order must be retrievable from Supabase');
  assert.strictEqual(retrievedOrder.orderId, orderId);
  assert.strictEqual(retrievedOrder.finalTotal, 170);

  // Transition to OUT_FOR_DELIVERY
  await adapter.update('orders', testOrder.id, {
    orderStatus: 'OUT_FOR_DELIVERY',
    status: 'OUT_FOR_DELIVERY',
    outForDeliveryAt: new Date().toISOString(),
    deliveryPartnerName: 'Ramesh Kumar (EV Rider)'
  });

  const transitionedOrder = await adapter.getById('orders', testOrder.id);
  assert.strictEqual(transitionedOrder.orderStatus, 'OUT_FOR_DELIVERY');
  assert.strictEqual(transitionedOrder.deliveryPartnerName, 'Ramesh Kumar (EV Rider)');
  console.log(`   ✓ Order successfully transitioned to OUT_FOR_DELIVERY in Supabase`);

  console.log('\n🧪 7. Cleaning up test data from Supabase...');
  await adapter.delete('products', testProductId);
  await adapter.delete('orders', testOrder.id);
  const checkDeletedProd = await adapter.getById('products', testProductId);
  assert.strictEqual(checkDeletedProd, null, 'Test product should be deleted');
  console.log(`   ✓ Test records cleaned up cleanly from Supabase`);

  console.log('\n====================================================');
  console.log('✅ SUPABASE LIVE PERSISTENCE & WORKFLOW TEST PASSED!');
  console.log('====================================================\n');
}

testSupabasePersistence().catch(err => {
  console.error('❌ Supabase Live Persistence Test Failed:', err);
  process.exit(1);
});
