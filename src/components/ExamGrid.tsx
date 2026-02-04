import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Exam = {
  id: string;
  exam_name: string;
  subject: string;
  price: string;
  duration: string;
  image_url: string | null;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  data?: Exam[];
};

const API_BASE = "https://xiadot.com/admin_maths/api";
const UPLOAD_BASE = "https://xiadot.com/admin_maths/uploads/";
const FALLBACK_EXAM = "/default-exam.png"; // ✅ put this inside public/

function toFullImageUrl(url: string | null) {
  if (!url) return null;

  const s = String(url).trim().replace(/\\/g, ""); // remove backslashes if any

  if (s.startsWith("http://") || s.startsWith("https://")) return s;

  // supports "uploads/x.png" or "/uploads/x.png" or "x.png"
  const cleaned = s.replace(/^\/+/, "").replace(/^uploads\//, "");
  return UPLOAD_BASE + cleaned;
}

function handleExamImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.src.includes(FALLBACK_EXAM)) return; // prevent loop
  img.src = FALLBACK_EXAM;
}

export default function ExamGrid() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/exam.php?action=list`);
        if (!res.ok) throw new Error("API not reachable");

        const json: ApiResponse = await res.json();
        if (!json.success) throw new Error(json.message || "API failed");

        const list: Exam[] = Array.isArray(json.data) ? json.data : [];

        // ✅ convert image_url to full URL
        const fixed = list.map((e) => ({
          ...e,
          image_url: toFullImageUrl(e.image_url),
        }));

        setExams(fixed);
      } catch (e: any) {
        setError(e.message || "Failed");
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  if (loading)
    return <div className="text-center py-10 text-gray-600">Loading…</div>;
  if (error)
    return <div className="text-center py-10 text-red-600">{error}</div>;

  return (
    <section className="bg-[#dfeeea] py-8 md:py-14">
      {/* ✅ heading like your screenshot */}
      {/* <h1 className="text-center text-5xl md:text-6xl font-extrabold text-black mb-10">
        COMPETITIVE EXAMS
      </h1> */}

      <div className="max-w-7xl mx-auto px-4">
        {/* ✅ Mobile: 2 columns | Desktop: 4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {exams.map((exam) => (
            <div
              key={exam.id}
              onClick={() => navigate(`/exams/${exam.id}`)}
              className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition"
            >
              {/* ✅ 16:9 image like courses desktop */}
              <div className="aspect-[16/9] w-full bg-gray-100 overflow-hidden">
                <img
                  src={exam.image_url || FALLBACK_EXAM}
                  onError={handleExamImgError}
                  className="w-full h-full object-cover"
                  alt={exam.exam_name}
                  loading="lazy"
                />
              </div>

              <div className="p-5">
                <h3 className="text-xl font-lightbold text-gray-900 line-clamp-2">
                  {exam.exam_name}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* empty state */}
        {exams.length === 0 && (
          <p className="text-center text-gray-600 mt-10">No exams found.</p>
        )}
      </div>
    </section>
  );
}
