import { Search, TrendingUp, Download, Filter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const API_URL = "https://xiadot.com/admin_maths/api/payments.php";

/* ================= TYPES ================= */
interface Payment {
  id: number;
  student: string;
  email: string;
  course: string;
  amount: number;
  currency: string;
  status: "completed" | "pending" | "failed" | "success";
  created_at: string;
}
const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN").format(amount);

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ================= LOAD PAYMENTS ================= */
  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("API not reachable");
        return res.json();
      })
      .then((data) => {
        if (!data.success) throw new Error(data.message || "Failed to load");

        // ✅ NORMALIZE STATUS (success → completed)
        const normalizedPayments = data.data.map((p: Payment) => ({
          ...p,
          status: p.status === "success" ? "completed" : p.status,
        }));

        setPayments(normalizedPayments);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load payments");
        setLoading(false);
      });
  }, []);

  /* ================= SEARCH FILTER ================= */
  const filteredPayments = useMemo(() => {
    return payments.filter(
      (p) =>
        p.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.course.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [payments, searchQuery]);

  /* ================= STATS ================= */

  // ✅ TOTAL OF ALL PAYMENTS
  const totalRevenue = payments.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  // ✅ PENDING AMOUNT
  const pendingAmount = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

 const stats = [
  {
    label: "Total Payments",
    value: `₹${formatINR(totalRevenue)}`,
    icon: TrendingUp,
  },
  {
    label: "Transactions",
    value: payments.length,
    icon: TrendingUp,
  },
];


  /* ================= UI ================= */
  if (loading) {
    return <p className="p-8 text-gray-500">Loading payments...</p>;
  }

  if (error) {
    return <p className="p-8 text-red-500">{error}</p>;
  }

  return (
    <div className="p-8">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Payments</h1>
        <p className="text-gray-600">
          Track and manage all payment transactions
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
              <p className="text-gray-600 text-sm">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* TABLE CARD */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* SEARCH BAR */}
        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by student or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            

            
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Student", "Course", "Amount", "Date", "Status"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium">{p.student}</p>
                    <p className="text-sm text-gray-500">{p.email}</p>
                  </td>

                  <td className="px-6 py-4">{p.course}</td>

                  <td className="px-6 py-4 font-semibold">₹{p.amount}</td>

                  <td className="px-6 py-4 text-gray-600">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        p.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : p.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>

                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t text-sm text-gray-600">
          Showing {filteredPayments.length} results
        </div>
      </div>
    </div>
  );
};

export default Payments;
