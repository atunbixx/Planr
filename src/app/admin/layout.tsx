import React, { useState } from 'react';
import Header from '@/Layouts/header';
import Sidebar from '@/Layouts/sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Although the sidebar state is managed internally by its context,
  // we might need a top-level state if other components need to interact with it.
  // For now, we'll let the Sidebar component manage its own state.

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* <!-- ===== Sidebar Start ===== --> */}
      <Sidebar />
      {/* <!-- ===== Sidebar End ===== --> */}

      {/* <!-- ===== Content Area Start ===== --> */}
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        {/* <!-- ===== Header Start ===== --> */}
        <Header />
        {/* <!-- ===== Header End ===== --> */}

        {/* <!-- ===== Main Content Start ===== --> */}
        <main>
          <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {children}
          </div>
        </main>
        {/* <!-- ===== Main Content End ===== --> */}
      </div>
      {/* <!-- ===== Content Area End ===== --> */}
    </div>
  );
}
