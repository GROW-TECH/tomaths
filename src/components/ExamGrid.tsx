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

const API_BASE = "https://xiadot.com/admin_maths/api";
const UPLOAD_BASE = "https://xiadot.com/admin_maths/uploads/";
const FALLBACK_EXAM = "/default-exam.png"; // ✅ put inside public/

function toFullImageUrl(url: string | null) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  // supports "uploads/x.png" or "x.png"
  const cleaned = url.replace(/^\/+/, "").replace(/^uploads\//, "");
  return UPLOAD_BASE + cleaned;
}

function handleExamImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.src.includes(FALLBACK_EXAM)) return; // ✅ prevent loop
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
        const json = await res.json();

        if (!json.success) throw new Error(json.message || "API failed");

        const list: Exam[] = json.data || [];

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

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {exams.map((exam) => (
        <div
          key={exam.id}
          onClick={() => navigate(`/exams/${exam.id}`)}
          className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition"
        >
          <img
            src={exam.image_url || FALLBACK_EXAM}
            onError={handleExamImgError}
            className="w-full h-44 object-cover"
            alt={exam.exam_name}
          />

          <div className="p-5">
            <h3 className="text-xl font-bold">{exam.exam_name}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}
