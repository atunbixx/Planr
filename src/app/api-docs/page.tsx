'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the OpenAPI spec from our API
    fetch('/api/docs')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch API documentation: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setSpec(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 font-semibold">Error loading API documentation</p>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">API Documentation</h1>
          <p className="mt-2 text-lg text-gray-600">
            Explore and test the Wedding Planner API endpoints
          </p>
          <div className="mt-4 flex items-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Version 2.0.0
            </span>
            <span className="text-sm text-gray-500">
              Base URL: {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4010'}
            </span>
          </div>
        </div>
        
        {spec && (
          <div className="swagger-ui-wrapper border rounded-lg shadow-sm">
            <SwaggerUI 
              spec={spec} 
              docExpansion="list"
              deepLinking={true}
              displayOperationId={false}
              defaultModelsExpandDepth={1}
              defaultModelExpandDepth={1}
              tryItOutEnabled={true}
              supportedSubmitMethods={['get', 'post', 'put', 'delete', 'patch']}
              onComplete={() => {
                // Add custom styling after SwaggerUI loads
                const swaggerContainer = document.querySelector('.swagger-ui');
                if (swaggerContainer) {
                  swaggerContainer.classList.add('custom-swagger-ui');
                }
              }}
            />
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-swagger-ui .swagger-ui .topbar {
          display: none;
        }
        
        .custom-swagger-ui .swagger-ui .info {
          margin: 20px 0;
        }
        
        .custom-swagger-ui .swagger-ui .scheme-container {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        
        .custom-swagger-ui .swagger-ui .btn {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-weight: 500;
        }
        
        .custom-swagger-ui .swagger-ui .btn:hover {
          background: #2563eb;
        }
        
        .custom-swagger-ui .swagger-ui .btn.cancel {
          background: #ef4444;
        }
        
        .custom-swagger-ui .swagger-ui .btn.cancel:hover {
          background: #dc2626;
        }
        
        .custom-swagger-ui .swagger-ui select {
          border-radius: 6px;
          border: 1px solid #d1d5db;
          padding: 6px 12px;
        }
        
        .custom-swagger-ui .swagger-ui .opblock.opblock-get .opblock-summary {
          border-color: #10b981;
        }
        
        .custom-swagger-ui .swagger-ui .opblock.opblock-post .opblock-summary {
          border-color: #3b82f6;
        }
        
        .custom-swagger-ui .swagger-ui .opblock.opblock-put .opblock-summary {
          border-color: #f59e0b;
        }
        
        .custom-swagger-ui .swagger-ui .opblock.opblock-delete .opblock-summary {
          border-color: #ef4444;
        }
        
        .custom-swagger-ui .swagger-ui .opblock.opblock-deprecated {
          opacity: 0.6;
          border-color: #6b7280 !important;
        }
        
        .custom-swagger-ui .swagger-ui .opblock.opblock-deprecated .opblock-summary {
          border-color: #6b7280 !important;
        }
      `}</style>
    </div>
  );
}