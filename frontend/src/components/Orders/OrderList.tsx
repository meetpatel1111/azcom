import React from 'react';
import { Order } from '../../types';
import OrderCard from './OrderCard';

interface OrderListProps {
  orders: Order[];
  onViewOrder: (orderId: string) => void;
  onReorder: (orderId: string) => void;
}

const OrderList: React.FC<OrderListProps> = ({ orders, onViewOrder, onReorder }) => {
  // Sort orders by creation date (newest first)
  const sortedOrders = [...orders].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      {sortedOrders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onViewOrder={onViewOrder}
          onReorder={onReorder}
        />
      ))}
    </div>
  );
};

export default OrderList;