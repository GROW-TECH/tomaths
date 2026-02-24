import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = "https://xiadot.com/admin_maths/api";
const DEFAULT_IMG = "/logo.png";

type SubCategory = {
  id: number;
  name: string;
  image: string | null;
};

function normalizeImageUrl(url: string | null) {
  if (!url) return DEFAULT_IMG;

  const clean = String(url).replace(/\\/g, "").trim();
  if (clean.startsWith("http")) return clean;

  const trimmed = clean.replace(/^\/+/, "").replace(/^uploads\//, "");
  return `https://xiadot.com/admin_maths/uploads/subcategories/${trimmed}`;
}

export default function CoursesBySubCategoryPage() {
  const { examid } = useParams<{ examid: string }>();
  const navigate = useNavigate();

  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!examid) return;

    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${API_BASE}/get_subcategories_by_exam.php`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ exam_id: examid }),
            signal: controller.signal,
          }
        );

        const json = await res.json();

        if (!json.success) {
          setError(json.message || "API error");
          return;
        }

        setSubCategories(json.data || []);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setError("Failed to load");
        }
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [examid]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 px-5 py-2 bg-white rounded-xl shadow"
        >
          ← Back
        </button>

        <h1 className="text-3xl text-center mb-10">SUB CATEGORIES</h1>

        {error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : subCategories.length === 0 ? (
          <div className="text-center">No subcategories found</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {subCategories.map((c) => {
              const img = normalizeImageUrl(c.image);

              return (
                <div
                  key={c.id}
                  onClick={() =>
                    navigate(`/new-courses/${examid}`)
                  }
                  className="bg-white rounded-2xl shadow-lg cursor-pointer overflow-hidden"
                >
                  <div className="h-40 flex items-center justify-center bg-gray-50">
                    <img
                      src={img}
                      className="h-32 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_IMG;
                      }}
                    />
                  </div>

                  <div className="p-4">
                    <p className="text-center text-lg font-semibold">
                      {c.name}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}