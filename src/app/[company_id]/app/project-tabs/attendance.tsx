 "use client";

import { useEffect, useState } from "react";
import { postRequest } from "../utils/api";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function AttendanceTab({ projectId }: any) {
  const [members, setMembers] = useState<any[]>([]);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    postRequest({
      token: "getProjectMembers",
      data: { project_id: projectId },
    }).then((res) => {
      if (res.success) setMembers(res.data);
    });
  }, []);

  const mark = async (member_id: number, status: string) => {
    try {
      await postRequest({
        token: "markAttendance",
        data: { project_id: projectId, member_id, date: today, status },
      });
      toast.success("Marked");
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <table className="table-default w-full">
      <thead>
        <tr>
          <th>Member</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {members.map((m) => (
          <tr key={m.id}>
            <td>{m.full_name}</td>
            <td className="flex gap-2">
              <Button size="sm" onClick={() => mark(m.id, "present")}>
                Present
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => mark(m.id, "absent")}
              >
                Absent
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
