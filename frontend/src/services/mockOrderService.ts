import { Order, CheckoutForm, OrderTracking } from '../types';
import { mockOrders, getMockOrdersByUserId } from '../data/mockData';
import { mockCartService } from './mockCartService';

// Simulate API delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const mockOrderService = {
  createOrder: async (checkoutData: CheckoutForm): Promise<{ order: Order; message: string }> => {
    await delay(1000);
    
    // Get current cart
    const cartResponse = await mockCartService.getCart();
    const cart = cartResponse.cart;
    
    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }
    
    // Create order from cart
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      userId: cart.userId,
      items: cart.items.map(item => ({
        productId: item.productId,
        productName: item.product?.name || 'Unknown Product',
        price: item.product?.price || 0,
        quantity: item.quantity,
      })),
      totalAmount: cartResponse.total,
      status: 'pending',
      shippingAddress: checkoutData.shippingAddress,
      paymentInfo: checkoutData.paymentInfo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockOrders.push(newOrder);
    
    // Clear cart after order creation
    await mockCartService.clearCart();
    
    return {
      order: newOrder,
      message: 'Order created successfully',
    };
  },

  getOrders: async (): Promise<{ orders: Order[] }> => {
    await delay(400);
    
    // Get current user from token (mock implementation)
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const decoded = JSON.parse(atob(token));
    const userOrders = getMockOrdersByUserId(decoded.userId);
    
    // Sort by creation date (newest first)
    const sortedOrders = userOrders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return {
      orders: sortedOrders,
    };
  },

  getOrderById: async (orderId: string): Promise<{ order: Order }> => {
    await delay(300);
    
    const order = mockOrders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    // Check if user owns the order (mock implementation)
    const token = localStorage.getItem('accessToken');
    if (token) {
      const decoded = JSON.parse(atob(token));
      if (order.userId !== decoded.userId && decoded.role !== 'admin') {
        throw new Error('Order not found');
      }
    }
    
    return {
      order,
    };
  },

  getOrderTracking: async (orderId: string): Promise<{ tracking: OrderTracking }> => {
    await delay(400);
    
    const order = mockOrders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    // Generate mock tracking timeline
    const timeline = [];
    const orderDate = new Date(order.createdAt);
    
    timeline.push({
      status: 'pending',
      title: 'Order Placed',
      description: 'Your order has been received and is being processed',
      date: order.createdAt,
      completed: true,
      estimated: false,
    });
    
    if (['processing', 'shipped', 'delivered'].includes(order.status)) {
      const processingDate = new Date(orderDate);
      processingDate.setHours(processingDate.getHours() + 2);
      
      timeline.push({
        status: 'processing',
        title: 'Order Processing',
        description: 'Your order is being prepared for shipment',
        date: processingDate.toISOString(),
        completed: true,
        estimated: false,
      });
    }
    
    if (['shipped', 'delivered'].includes(order.status)) {
      const shippedDate = new Date(orderDate);
      shippedDate.setDate(shippedDate.getDate() + 1);
      
      timeline.push({
        status: 'shipped',
        title: 'Order Shipped',
        description: 'Your order has been shipped and is on its way',
        date: shippedDate.toISOString(),
        completed: order.status !== 'shipped',
        estimated: false,
      });
    }
    
    if (order.status === 'delivered') {
      const deliveredDate = new Date(orderDate);
      deliveredDate.setDate(deliveredDate.getDate() + 3);
      
      timeline.push({
        status: 'delivered',
        title: 'Order Delivered',
        description: 'Your order has been delivered successfully',
        date: deliveredDate.toISOString(),
        completed: true,
        estimated: false,
      });
    }
    
    if (order.status === 'cancelled') {
      timeline.push({
        status: 'cancelled',
        title: 'Order Cancelled',
        description: 'Your order has been cancelled',
        date: order.updatedAt,
        completed: true,
        estimated: false,
      });
    }
    
    const tracking: OrderTracking = {
      orderId: order.id,
      currentStatus: order.status,
      timeline,
      estimatedDelivery: order.status === 'shipped' ? 
        new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      trackingInfo: {
        canCancel: order.status === 'pending' || order.status === 'processing',
        canReturn: order.status === 'delivered',
        canReorder: order.status === 'delivered' || order.status === 'cancelled',
      },
    };
    
    return {
      tracking,
    };
  },

  cancelOrder: async (orderId: string): Promise<{ order: Order; message: string }> => {
    await delay(600);
    
    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      throw new Error('Order not found');
    }
    
    const order = mockOrders[orderIndex];
    
    if (order.status !== 'pending' && order.status !== 'processing') {
      throw new Error('Order cannot be cancelled at this stage');
    }
    
    const updatedOrder = {
      ...order,
      status: 'cancelled' as const,
      updatedAt: new Date().toISOString(),
    };
    
    mockOrders[orderIndex] = updatedOrder;
    
    return {
      order: updatedOrder,
      message: 'Order cancelled successfully',
    };
  },
};