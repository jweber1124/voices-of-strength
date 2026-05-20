'use client';

import { useState, useTransition } from 'react';
import type { TaskCategory, SubTask } from '@/lib/task-categories';
import { toggleSubTask, toggleCategoryAssignment } from '@/lib/manager-actions';

type VolunteerSummary = {
  id: string;
  first_name: string;
  last_name: string;
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
  const [pending, startTransition] = useTransition();

  const completedSet = new Set(completedSubTaskIds);
  const assignedSet = new Set(assignedVolunteerIds);

  const incomplete = category.subTasks.filter((t) => !completedSet.has(t.id));
  const completed = category.subTasks.filter((t) => completedSet.has(t.id));

  function handleSubTaskToggle(subTaskId: string, currentChecked: boolean) {
    startTransition(async () => {
      await toggleSubTask(eventId, subTaskId, !currentChecked);
    });
  }

  function handleAssignmentToggle(volunteerId: string, currentlyAssigned: boolean) {
    startTransition(async () => {
      await toggleCategoryAssignment(
        eventId,
        category.id,
        volunteerId,
        !currentlyAssigned,
      );
    });
  }

  const assignedVolunteers = allVolunteers.filter((v) => assignedSet.has(v.id));

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold">{category.name}</h3>
          <span className="text-xs text-zinc-500 shrink-0 tabular-nums">
            {completed.length} / {category.subTasks.length} done
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
                assignedVolunteers.map((v) => (
                  <span
                    key={v.id}
                    className="text-xs rounded-full bg-zinc-100 text-zinc-900 px-2.5 py-1 font-medium"
                  >
                    {v.first_name} {v.last_name}
                  </span>
                ))
              )}
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="text-xs rounded-full border border-zinc-700 text-zinc-300 px-2.5 py-1 hover:bg-zinc-800 transition-colors"
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
                    return (
                      <label
                        key={v.id}
                        className="flex items-center gap-2 cursor-pointer text-sm py-0.5"
                      >
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => handleAssignmentToggle(v.id, isAssigned)}
                          disabled={pending}
                          className="h-4 w-4 accent-zinc-100"
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
        {incomplete.map((task) => (
          <SubTaskRow
            key={task.id}
            task={task}
            checked={false}
            disabled={pending}
            onToggle={() => handleSubTaskToggle(task.id, false)}
          />
        ))}
        {completed.length > 0 && (
          <li className="bg-zinc-950/50">
            <ul className="divide-y divide-zinc-800/60">
              {completed.map((task) => (
                <SubTaskRow
                  key={task.id}
                  task={task}
                  checked={true}
                  disabled={pending}
                  onToggle={() => handleSubTaskToggle(task.id, true)}
                />
              ))}
            </ul>
          </li>
        )}
      </ul>
    </div>
  );
}

function SubTaskRow({
  task,
  checked,
  disabled,
  onToggle,
}: {
  task: SubTask;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <label
        className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-800/40 transition-colors ${
          checked ? '' : ''
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          disabled={disabled}
          className="mt-0.5 h-4 w-4 accent-zinc-100 shrink-0"
        />
        <span
          className={`text-sm ${
            checked ? 'line-through text-zinc-500' : 'text-zinc-200'
          }`}
        >
          {task.title}
        </span>
      </label>
    </li>
  );
}
