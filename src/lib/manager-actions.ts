'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from './supabase-admin';

export async function toggleSubTask(
  eventId: string,
  subTaskId: string,
  isComplete: boolean,
) {
  if (!eventId || !subTaskId) throw new Error('Missing event or sub-task id');

  const { error } = await supabaseAdmin
    .from('sub_task_completions')
    .upsert(
      {
        event_id: eventId,
        sub_task_id: subTaskId,
        is_complete: isComplete,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'event_id,sub_task_id' },
    );

  if (error) throw new Error(error.message);
  revalidatePath('/manager');
}

export async function confirmAssignment(
  volunteerId: string,
  categoryId: string,
) {
  if (!volunteerId || !categoryId) {
    throw new Error('Missing volunteer or category id');
  }

  const { data: volunteer, error: readError } = await supabaseAdmin
    .from('volunteers')
    .select('categories')
    .eq('id', volunteerId)
    .single();
  if (readError) throw new Error(readError.message);

  const existing: string[] = ((volunteer?.categories ?? []) as string[]);
  if (existing.includes(categoryId)) {
    revalidatePath('/manager');
    return;
  }

  const { error: writeError } = await supabaseAdmin
    .from('volunteers')
    .update({
      categories: [...existing, categoryId],
      updated_at: new Date().toISOString(),
    })
    .eq('id', volunteerId);
  if (writeError) throw new Error(writeError.message);

  revalidatePath('/manager');
  revalidatePath('/helper');
}

export async function toggleCategoryAssignment(
  eventId: string,
  categoryId: string,
  volunteerId: string,
  assigned: boolean,
) {
  if (!eventId || !categoryId || !volunteerId) {
    throw new Error('Missing required identifier');
  }

  if (assigned) {
    const { error } = await supabaseAdmin
      .from('category_assignments')
      .upsert(
        { event_id: eventId, category_id: categoryId, volunteer_id: volunteerId },
        { onConflict: 'event_id,category_id,volunteer_id' },
      );
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabaseAdmin
      .from('category_assignments')
      .delete()
      .eq('event_id', eventId)
      .eq('category_id', categoryId)
      .eq('volunteer_id', volunteerId);
    if (error) throw new Error(error.message);
  }

  revalidatePath('/manager');
}
