import {
  Search,
  UserPlus,
  Mail,
  MoreVertical,
  BookOpen,
  Award,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const API_URL =
  "https://xiadot.com/admin_maths/api/users_with_enrollment.php";

/* ================= TYPES ================= */
interface User {
  id: number;
  name: string;
  email: string;
  enrolledCourses: number;
  completedCourses: number;
  avgScore: number;
  joinDate: string;
  status: "active";
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  /* ================= LOAD USERS ================= */
  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUsers(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* ================= FILTER ================= */
  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  /* ================= STATS ================= */
  const totalStudents = users.length;
  const activeStudents = users.length;
  const newThisMonth = users.filter((u) => {
    const d = new Date(u.joinDate);
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }).length;

  if (loading) return <p className="p-8">Loading users...</p>;

  return (
    <div className="p-8">
      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-gray-600">Manage your Students</p>
        </div>
       
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Stat label="Total Students" value={totalStudents} />
        <Stat label="Active Students" value={activeStudents} />
        <Stat label="New This Month" value={newThisMonth} />
      </div>

      {/* SEARCH */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search students by name or email..."
          className="w-full pl-12 pr-4 py-3 border rounded-lg"
        />
      </div>

      {/* USERS */}
      <div className="space-y-4">
        {filteredUsers.map((u) => (
          <div
            key={u.id}
            className="bg-white border rounded-xl p-6 flex justify-between"
          >
            <div className="flex gap-4">
              <div className="w-14 h-14 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                {u.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-bold">{u.name}</h3>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                    active
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <Mail className="w-4 h-4" /> {u.email}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                  <Info
                    icon={BookOpen}
                    label="Enrolled"
                    value={`${u.enrolledCourses} courses`}
                  />
                 
                  <Info label="Joined" value={u.joinDate} />
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

      <div className="mt-6 text-sm text-gray-600">
        Showing {filteredUsers.length} of {users.length} students
      </div>
    </div>
  );
};

export default Users;

/* ================= SMALL COMPONENTS ================= */

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="bg-white border rounded-xl p-6">
    <h3 className="text-3xl font-bold">{value}</h3>
    <p className="text-gray-600">{label}</p>
  </div>
);

const Info = ({
  icon: Icon,
  label,
  value,
}: {
  icon?: any;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-2">
    {Icon && <Icon className="w-4 h-4 text-gray-400" />}
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  </div>
);
