 "use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { postRequest } from "../utils/api";
import toast from "react-hot-toast";

export default function TasksTab({ projectId }: any) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState("");

  const fetchTasks = async () => {
    const res = await postRequest({
      token: "getTasks",
      data: { project_id: projectId },
    });
    if (res.success) setTasks(res.data);
  };

  const addTask = async () => {
    if (!title) return;
    await postRequest({
      token: "addTask",
      data: {
        project_id: projectId,
        task_title: title,
        assigned_to: null,
        due_date: null,
      },
    });
    setTitle("");
    fetchTasks();
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          placeholder="New task"
        />
        <Button onClick={addTask}>Add</Button>
      </div>

      <table className="table-default w-full">
        <thead>
          <tr>
            <th>Task</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id}>
              <td>{t.task_title}</td>
              <td className="capitalize">{t.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
