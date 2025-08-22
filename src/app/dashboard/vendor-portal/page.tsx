'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import AuthClient from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function VendorPortalPage() {
  const { user, isLoading } = useAuth();
  const { themeMode } = useCustomTheme();
  const router = useRouter();
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', category: '', city: '', region: '', priceBand: '', shortDescription: '' });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: '', category: '', city: '', region: '', priceBand: '', shortDescription: '', tags: '' });

  useEffect(() => { if (!isLoading && !user) router.push('/signin'); }, [isLoading, user, router]);

  async function load() {
    const token = AuthClient.getToken();
    const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch('/api/vendor-portal/vendors', { headers });
    const json = await res.json();
    setList(json?.data?.vendors || []);
  }

  useEffect(() => { if (!isLoading && user) load(); }, [isLoading, user]);

  async function create() {
    const token = AuthClient.getToken();
    const headers: any = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    setSaving(true);
    try {
      const res = await fetch('/api/vendor-portal/vendors', { method: 'POST', headers, body: JSON.stringify(form) });
      if (res.ok) { setForm({ name: '', category: '', city: '', region: '', priceBand: '', shortDescription: '' }); await load(); }
    } finally { setSaving(false); }
  }

  async function update() {
    if (!editing) return;
    const token = AuthClient.getToken();
    const headers: any = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    setSaving(true);
    try {
      const payload: any = { ...editForm };
      if (payload.tags) payload.tags = payload.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      const res = await fetch(`/api/vendor-portal/vendors/${editing.id}`, { method: 'PUT', headers, body: JSON.stringify(payload) });
      if (res.ok) { await load(); setEditing(null); }
    } finally { setSaving(false); }
  }

  if (isLoading) return null;

  const Layout = themeMode === 'premium' ? PremiumDashboardLayout : DashboardLayout;

  return (
    <Layout>
      <div className="p-3">
        <h1 className="text-2xl font-bold mb-2">Vendor Portal</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Your Directory Vendors</CardTitle>
              </CardHeader>
              <CardContent>
                {list.length > 0 ? (
                  <ul>
                    {list.map(v => (
                      <li key={v.id} onClick={() => { setEditing(v); setEditForm({ name: v.name || '', category: v.category || '', city: v.city || '', region: v.region || '', priceBand: v.priceBand || '', shortDescription: v.shortDescription || '', tags: Array.isArray(v.tags) ? v.tags.join(', ') : '' }); }} className="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{`${v.name} (${v.category})`}</p>
                          <p className="text-sm text-gray-500">{[v.city, v.region].filter(Boolean).join(', ')}</p>
                        </div>
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/vendors/${v.id}`); }}>View</Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No vendors yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Create New Vendor</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                <Input placeholder="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
                <Input placeholder="Price Band ($, $$, $$$)" value={form.priceBand} onChange={(e) => setForm({ ...form, priceBand: e.target.value })} />
                <Textarea placeholder="Short Description" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
                <Button disabled={saving || !form.name.trim() || !form.category.trim()} onClick={create}>Create</Button>
              </CardContent>
            </Card>
          </div>

          {editing && (
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Vendor</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Input placeholder="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  <Input placeholder="Category" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
                  <Input placeholder="City" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                  <Input placeholder="Region" value={editForm.region} onChange={(e) => setEditForm({ ...editForm, region: e.target.value })} />
                  <Input placeholder="Price Band ($, $$, $$$)" value={editForm.priceBand} onChange={(e) => setEditForm({ ...editForm, priceBand: e.target.value })} />
                  <Textarea placeholder="Short Description" value={editForm.shortDescription} onChange={(e) => setEditForm({ ...editForm, shortDescription: e.target.value })} />
                  <Input placeholder="Tags (comma-separated)" value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} />
                  <div className="flex gap-2">
                    <Button disabled={saving} onClick={update}>Save Changes</Button>
                    <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
