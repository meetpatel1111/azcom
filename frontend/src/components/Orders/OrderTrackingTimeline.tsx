import React from 'react';
import { OrderTracking } from '../../types';

interface OrderTrackingTimelineProps {
  tracking: OrderTracking;
}

const OrderTrackingTimeline: React.FC<OrderTrackingTimelineProps> = ({ tracking }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-blue-900">
              {tracking.currentStatus}
            </h3>
            {tracking.estimatedDelivery && (
              <p className="text-sm text-blue-700">
                Estimated delivery: {formatDate(tracking.estimatedDelivery)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="flow-root">
        <ul className="-mb-8">
          {tracking.timeline.map((event, eventIdx) => (
            <li key={eventIdx}>
              <div className="relative pb-8">
                {eventIdx !== tracking.timeline.length - 1 ? (
                  <span
                    className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${
                      event.completed ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                        event.completed
                          ? 'bg-green-500'
                          : event.estimated
                          ? 'bg-gray-300'
                          : 'bg-blue-500'
                      }`}
                    >
                      {event.completed ? (
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : event.estimated ? (
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          event.completed
                            ? 'text-gray-900'
                            : event.estimated
                            ? 'text-gray-500'
                            : 'text-blue-600'
                        }`}
                      >
                        {event.title}
                        {event.estimated && (
                          <span className="ml-2 text-xs text-gray-400">(Estimated)</span>
                        )}
                      </p>
                      <p
                        className={`text-sm ${
                          event.completed
                            ? 'text-gray-600'
                            : event.estimated
                            ? 'text-gray-400'
                            : 'text-blue-500'
                        }`}
                      >
                        {event.description}
                      </p>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap">
                      <time
                        className={
                          event.completed
                            ? 'text-gray-500'
                            : event.estimated
                            ? 'text-gray-400'
                            : 'text-blue-500'
                        }
                      >
                        {formatDate(event.date)}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Tracking Actions */}
      {(tracking.trackingInfo.canCancel || tracking.trackingInfo.canReturn) && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex space-x-3">
            {tracking.trackingInfo.canCancel && (
              <button className="flex-1 bg-red-100 text-red-800 py-2 px-4 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 font-medium transition-colors">
                Cancel Order
              </button>
            )}
            {tracking.trackingInfo.canReturn && (
              <button className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium transition-colors">
                Return Items
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTrackingTimeline;