import { BookOpen, Users, FileText, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

const API_URL = "https://xiadot.com/admin_maths/api/dashboard.php";

interface DashboardData {
  students: number;
  courses: number;
  tests: number;
  revenue: number;
}

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN").format(amount);

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="p-8 text-gray-500">Loading dashboard...</p>;
  }

  if (!data) {
    return <p className="p-8 text-red-500">Failed to load dashboard</p>;
  }

  const stats = [
    {
      label: "Total Students",
      value: data.students,
      icon: Users,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Active Courses",
      value: data.courses,
      icon: BookOpen,
      color: "from-cyan-500 to-cyan-600",
    },
    {
      label: "Total Tests",
      value: data.tests,
      icon: FileText,
      color: "from-teal-500 to-teal-600",
    },
    {
      label: "Revenue",
      value: `₹${formatINR(data.revenue)}`,
      icon: TrendingUp,
      color: "from-green-500 to-green-600",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Dashboard
        </h1>
      
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-800">
                {stat.value}
              </h3>
              <p className="text-gray-600 text-sm">{stat.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
