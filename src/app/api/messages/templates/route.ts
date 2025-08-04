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
      .from('couples')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (coupleError || !couple) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 });
    }

    // Get system templates and couple's custom templates
    const { data: templates, error } = await supabase
      .from('message_templates')
      .select('*')
      .or(`is_system.eq.true,couple_id.eq.${couple.id}`)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    return NextResponse.json(templates || []);
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get couple ID
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (coupleError || !couple) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, type, subject, body: templateBody, variables, category } = body;

    // Validate required fields
    if (!name || !type || !templateBody) {
      return NextResponse.json(
        { error: 'Name, type, and body are required' },
        { status: 400 }
      );
    }

    // Create custom template
    const { data: template, error } = await supabase
      .from('message_templates')
      .insert({
        couple_id: couple.id,
        name,
        description,
        type,
        subject,
        body: templateBody,
        variables: variables || [],
        is_system: false,
        category
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get couple ID
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (coupleError || !couple) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 });
    }

    const body = await request.json();
    const { id, name, description, subject, body: templateBody, variables, category } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // Update template (only custom templates can be updated)
    const { data: template, error } = await supabase
      .from('message_templates')
      .update({
        name,
        description,
        subject,
        body: templateBody,
        variables,
        category,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('couple_id', couple.id)
      .eq('is_system', false)
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }

    if (!template) {
      return NextResponse.json({ error: 'Template not found or not editable' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Update template error:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get couple ID
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (coupleError || !couple) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // Delete template (only custom templates can be deleted)
    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', templateId)
      .eq('couple_id', couple.id)
      .eq('is_system', false);

    if (error) {
      console.error('Error deleting template:', error);
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete template error:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}