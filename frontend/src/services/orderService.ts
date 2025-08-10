import { apiClient, handleApiError } from './api';
import { Order, CheckoutForm, OrderTracking, ApiResponse } from '../types';
import { AxiosError } from 'axios';

// Order API endpoints
export const createOrder = async (checkoutData: CheckoutForm): Promise<{ order: Order; message: string }> => {
  try {
    const response = await apiClient.post<ApiResponse<{ order: Order; message: string }>>('/orders', checkoutData);
    return response.data!;
  } catch (error) {
    const apiError = handleApiError(error as AxiosError);
    throw new Error(apiError.message);
  }
};

export const getOrders = async (): Promise<{ orders: Order[] }> => {
  try {
    const response = await apiClient.get<ApiResponse<{ orders: Order[] }>>('/orders');
    return response.data!;
  } catch (error) {
    const apiError = handleApiError(error as AxiosError);
    throw new Error(apiError.message);
  }
};

export const getOrderById = async (orderId: string): Promise<{ order: Order }> => {
  try {
    const response = await apiClient.get<ApiResponse<{ order: Order }>>(`/orders/${orderId}`);
    return response.data!;
  } catch (error) {
    const apiError = handleApiError(error as AxiosError);
    throw new Error(apiError.message);
  }
};

export const getOrderTracking = async (orderId: string): Promise<{ tracking: OrderTracking }> => {
  try {
    const response = await apiClient.get<ApiResponse<{ tracking: OrderTracking }>>(`/orders/${orderId}/tracking`);
    return response.data!;
  } catch (error) {
    const apiError = handleApiError(error as AxiosError);
    throw new Error(apiError.message);
  }
};

export const cancelOrder = async (orderId: string): Promise<{ order: Order; message: string }> => {
  try {
    const response = await apiClient.post<ApiResponse<{ order: Order; message: string }>>(`/orders/${orderId}/cancel`);
    return response.data!;
  } catch (error) {
    const apiError = handleApiError(error as AxiosError);
    throw new Error(apiError.message);
  }
};

export const reorderItems = async (orderId: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(`/orders/${orderId}/reorder`);
    return response.data!;
  } catch (error) {
    const apiError = handleApiError(error as AxiosError);
    throw new Error(apiError.message);
  }
};