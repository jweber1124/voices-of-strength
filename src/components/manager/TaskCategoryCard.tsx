'use client';

import { useState, useTransition, useOptimistic } from 'react';
import { motion } from 'motion/react';
import type { TaskCategory, SubTask } from '@/lib/task-categories';
import { toggleSubTask, toggleCategoryAssignment } from '@/lib/manager-actions';
import { needsConfirmation } from '@/lib/category-rules';
import { Checkbox } from '@/components/Checkbox';
import { useHelperFocus } from './HelperFocusContext';

type VolunteerSummary = {
  id: string;
  first_name: string;
  last_name: string;
  categories: string[];
};

type Props = {
  eventId: string;
  category: TaskCategory;
  completedSubTaskIds: string[];
  assignedVolunteerIds: string[];
  allVolunteers: VolunteerSummary[];
};

export function TaskCategoryCard({
  eventId,
  category,
  completedSubTaskIds,
  assignedVolunteerIds,
  allVolunteers,
}: Props) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const { setFocused } = useHelperFocus();

  // Optimistic state for instant tap feedback. The actual server-truth comes
  // back via revalidatePath; useOptimistic resets back to it on reconcile.
  const [optimisticCompleted, applyCompletion] = useOptimistic<string[], string>(
    completedSubTaskIds,
    (state, taskId) =>
      state.includes(taskId)
        ? state.filter((id) => id !== taskId)
        : [...state, taskId],
  );

  const [optimisticAssigned, applyAssignment] = useOptimistic<string[], string>(
    assignedVolunteerIds,
    (state, volunteerId) =>
      state.includes(volunteerId)
        ? state.filter((id) => id !== volunteerId)
        : [...state, volunteerId],
  );

  const completedSet = new Set(optimisticCompleted);
  const assignedSet = new Set(optimisticAssigned);

  function handleSubTaskToggle(subTaskId: string, currentChecked: boolean) {
    startTransition(async () => {
      applyCompletion(subTaskId);
      await toggleSubTask(eventId, subTaskId, !currentChecked);
    });
  }

  function handleAssignmentToggle(
    volunteerId: string,
    currentlyAssigned: boolean,
  ) {
    startTransition(async () => {
      applyAssignment(volunteerId);
      await toggleCategoryAssignment(
        eventId,
        category.id,
        volunteerId,
        !currentlyAssigned,
      );
    });
  }

  const assignedVolunteers = allVolunteers.filter((v) => assignedSet.has(v.id));

  // Sub-tasks sorted with incomplete first, completed at bottom. Motion's
  // layout prop animates the position change smoothly.
  const sortedSubTasks = [
    ...category.subTasks.filter((t) => !completedSet.has(t.id)),
    ...category.subTasks.filter((t) => completedSet.has(t.id)),
  ];

  const completedCount = category.subTasks.filter((t) =>
    completedSet.has(t.id),
  ).length;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold">{category.name}</h3>
          <span className="text-xs text-zinc-500 shrink-0 tabular-nums">
            {completedCount} / {category.subTasks.length} done
          </span>
        </div>

        {category.acceptsAssignments && (
          <div className="mt-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {assignedVolunteers.length === 0 ? (
                <span className="text-sm text-zinc-500">
                  No helpers assigned yet
                </span>
              ) : (
                assignedVolunteers.map((v) => {
                  const isUnconfirmed = needsConfirmation(
                    category.id,
                    v.categories,
                  );
                  const pillClass = isUnconfirmed
                    ? 'bg-red-500/15 border border-red-500/40 text-red-100 hover:bg-red-500/25'
                    : 'bg-zinc-100 text-zinc-900 hover:bg-white';
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setFocused(v.id)}
                      title={
                        isUnconfirmed
                          ? `${v.first_name} ${v.last_name} — availability not confirmed`
                          : 'Show helper details'
                      }
                      className={`text-xs rounded-full px-2.5 py-1 font-medium transition-all active:scale-95 ${pillClass}`}
                    >
                      {v.first_name} {v.last_name}
                    </button>
                  );
                })
              )}
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="text-xs rounded-full border border-zinc-700 text-zinc-300 px-2.5 py-1 hover:bg-zinc-800 active:scale-95 transition-all"
              >
                {open ? 'Close' : 'Manage'}
              </button>
            </div>

            {open && (
              <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-2">
                {allVolunteers.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    No helpers signed up yet.
                  </p>
                ) : (
                  allVolunteers.map((v) => {
                    const isAssigned = assignedSet.has(v.id);
                    const isPreferredFit = !needsConfirmation(
                      category.id,
                      v.categories,
                    );
                    return (
                      <label
                        key={v.id}
                        className={`flex items-center gap-2 cursor-pointer text-sm py-0.5 ${
                          isPreferredFit ? '' : 'opacity-50'
                        }`}
                        title={
                          isPreferredFit
                            ? undefined
                            : `${v.first_name} did not sign up for this role — assigning will flag for confirmation`
                        }
                      >
                        <Checkbox
                          checked={isAssigned}
                          onChange={() =>
                            handleAssignmentToggle(v.id, isAssigned)
                          }
                          size="sm"
                        />
                        <span>
                          {v.first_name} {v.last_name}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <ul className="divide-y divide-zinc-800">
        {sortedSubTasks.map((task) => {
          const checked = completedSet.has(task.id);
          return (
            <motion.li
              key={task.id}
              layout
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={checked ? 'bg-zinc-950/50' : ''}
            >
              <label className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-800/40 active:bg-zinc-800/70 transition-colors">
                <Checkbox
                  checked={checked}
                  onChange={() => handleSubTaskToggle(task.id, checked)}
                  className="mt-0.5"
                />
                <span
                  className={`text-sm ${
                    checked ? 'line-through text-zinc-500' : 'text-zinc-200'
                  }`}
                >
                  {task.title}
                </span>
              </label>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

// Note: SubTask type re-imported just for the layout above; not used elsewhere.
export type { SubTask };
