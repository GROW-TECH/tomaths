import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = "https://xiadot.com/admin_maths/api";
const DEFAULT_IMG = "/default-unit.png";

type Course = {
  id: number;
  course_name: string; // ✅ we will ensure this is filled
  image_url: string | null;
  price?: string;
  duration?: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  courses?: any[];
  data?: any;
};

/* ================= HELPERS ================= */

function normalizeImageUrl(url: string | null) {
  if (!url) return DEFAULT_IMG;

  const clean = String(url).replace(/\\/g, "").trim();
  if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;

  const trimmed = clean.replace(/^\/+/, "").replace(/^uploads\//, "");
  return `https://xiadot.com/admin_maths/uploads/${trimmed}`;
}

function toTitle(raw: any): string {
  // ✅ try all possible backend keys
  const t =
    raw?.course_name ??
    raw?.name ??
    raw?.title ??
    raw?.course_title ??
    raw?.course ??
    "";
  return String(t).trim();
}

function normalizeCourses(json: ApiResponse): Course[] {
  let arr: any[] = [];

  if (Array.isArray(json.courses)) arr = json.courses;
  else if (Array.isArray(json.data)) arr = json.data;
  else if (Array.isArray(json.data?.courses)) arr = json.data.courses;

  // ✅ force course_name for UI
  return arr.map((r: any) => ({
    id: Number(r.id),
    course_name: toTitle(r) || "Untitled Course",
    image_url: r.image_url ?? r.image ?? null,
    price: r.price ?? "",
    duration: r.duration ?? "",
  }));
}

function slugify(text: string) {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/* ================= COMPONENT ================= */

export default function CoursesBySubCategoryPage() {
  const { subCategoryId } = useParams<{ subCategoryId: string }>();
  const navigate = useNavigate();

  const subCatIdNum = useMemo(() => {
    const n = Number(subCategoryId);
    return Number.isFinite(n) ? n : null;
  }, [subCategoryId]);

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subCatIdNum === null) {
      setLoading(false);
      setCourses([]);
      setError("SubCategoryId is missing / invalid in URL");
      return;
    }

    const controller = new AbortController();

    async function fetchJson(url: string, options?: RequestInit) {
      const res = await fetch(url, { ...options, signal: controller.signal });
      const text = await res.text();

      let json: ApiResponse;
      try {
        json = JSON.parse(text);
      } catch {
        console.log("❌ NON-JSON RESPONSE:", text);
        throw new Error(`API did not return JSON (HTTP ${res.status})`);
      }

      return { res, json };
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const attempts: Array<
          () => Promise<{ res: Response; json: ApiResponse }>
        > = [
          // POST subcategory_id
          () =>
            fetchJson(`${API_BASE}/get_subCategory.php`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "list",
                subcategory_id: subCatIdNum,
              }),
            }),

          // POST category_id
          () =>
            fetchJson(`${API_BASE}/get_subCategory.php`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "list",
                category_id: subCatIdNum,
              }),
            }),

          // GET subcategory_id
          () =>
            fetchJson(
              `${API_BASE}/get_subCategory.php?action=list&subcategory_id=${subCatIdNum}`,
            ),

          // GET category_id
          () =>
            fetchJson(
              `${API_BASE}/get_subCategory.php?action=list&category_id=${subCatIdNum}`,
            ),
        ];

        let lastErr: any = null;

        for (const tryOnce of attempts) {
          try {
            const { res, json } = await tryOnce();

            if (!res.ok || json.success === false) {
              lastErr = new Error(json.message || `HTTP ${res.status}`);
              continue;
            }

            const list = normalizeCourses(json);
            setCourses(list);
            lastErr = null;
            break;
          } catch (e) {
            lastErr = e;
          }
        }

        if (lastErr) throw lastErr;
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message || "Failed to load courses");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [subCatIdNum]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-3 py-6">
        <div className="bg-white px-6 py-4 rounded-2xl shadow-lg font-lightbold text-[#1f2a44]">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
        {/* BACK */}
        <button
          onClick={() => navigate(-1)}
          className="mb-8 px-5 py-2 bg-white rounded-xl font-lightbold shadow hover:shadow-md transition"
        >
          ← Back
        </button>

        {/* TITLE */}
        <h1 className="text-3xl md:text-4xl font-lightbold text-center mb-10 text-black tracking-tight">
          SUBCATEGORY
        </h1>

        {error ? (
          <div className="bg-white rounded-2xl p-5 text-red-700 font-lightbold text-center shadow">
            {error}
          </div>
        ) : courses.length === 0 ? (
          <p className="text-center font-lightbold  text-gray-800">
            No courses found
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {courses.map((c) => {
              const imgSrc = normalizeImageUrl(c.image_url);
              const slug = `${c.id}-${slugify(c.course_name)}`;

              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/courses/${slug}`)}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition cursor-pointer overflow-hidden"
                >
                  {/* IMAGE */}
                  <div className="h-40 md:h-44 w-full bg-gray-50 flex items-center justify-center">
                    <img
                      src={imgSrc}
                      alt={c.course_name}
                      className="h-32 md:h-36 object-contain"
                      onError={(e) => (e.currentTarget.src = DEFAULT_IMG)}
                    />
                  </div>

                  {/* ✅ NAME BELOW IMAGE - ALWAYS SHOW */}
                  <div className="p-4">
                    <p className="text-center font-lightbold text-lg md:text-xl text-black">
                      {c.course_name}
                    </p>

                    {(c.price || c.duration) && (
                      <p className="text-center text-sm text-gray-600 mt-1">
                        {c.price ? `₹${c.price}` : ""}
                        {c.price && c.duration ? " • " : ""}
                        {c.duration || ""}
                      </p>
                    )}
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
