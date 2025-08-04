import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get couple ID
    const { data: couple, error: coupleError } = await supabase
      .from('wedding_couples')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (coupleError || !couple) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const messageType = searchParams.get('type');
    const status = searchParams.get('status');

    // Build query
    let query = supabase
      .from('message_logs')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (messageType) {
      query = query.eq('message_type', messageType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Error fetching message logs:', error);
      return NextResponse.json({ error: 'Failed to fetch message logs' }, { status: 500 });
    }

    return NextResponse.json(logs || []);
  } catch (error) {
    console.error('Get message logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message logs' },
      { status: 500 }
    );
  }
}