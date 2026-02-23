import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = "https://xiadot.com/admin_maths/api";
const UPLOAD_BASE = "https://xiadot.com/admin_maths/uploads/";

const DEFAULT_IMG = "/images/phonic_placeholder_24.webp";

// Type for a raw course object from the API (may have different property names)
interface RawCourse {
  id?: number | string;
  course_name?: unknown;
  name?: unknown;
  title?: unknown;
  course_title?: unknown;
  course?: unknown;
  image_url?: unknown;
  image?: unknown;
  imagePath?: unknown;
  subcategory_id?: unknown;
  sub_cat_id?: unknown;
  subCategoryId?: unknown;
  category_id?: unknown;
  cat_id?: unknown;
  categoryId?: unknown;
}

type ApiResponse = {
  success?: boolean;
  message?: string;
  courses?: RawCourse[];
  data?: RawCourse[] | { courses?: RawCourse[] };
};

type Course = {
  id: number;
  course_name: string;
  image_url: string | null;
  subcategory_id?: number | string | null;
  category_id?: number | string | null;
};

// Helper: safely convert unknown to trimmed string
function cleanStr(v: unknown): string {
  return String(v ?? "")
    .replace(/\\/g, "")
    .replace(/^"+|"+$/g, "")
    .trim();
}

// Helper: build a valid image URL from various input formats
function normalizeImageUrl(url: unknown): string {
  const clean = cleanStr(url);
  if (!clean || clean === "null" || clean === "undefined") return DEFAULT_IMG;

  if (clean.includes("/api/uploads/")) {
    const filename = clean.split("/").pop() || clean;
    return UPLOAD_BASE + filename;
  }

  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    if (clean.includes("xiadot.com/admin_maths/uploads/")) {
      return clean;
    }
    return clean;
  }

  if (clean.includes("uploads/")) {
    const filename = clean.split("uploads/").pop();
    return filename ? UPLOAD_BASE + filename : DEFAULT_IMG;
  }

  const filename = clean.split("/").pop() || clean;
  return filename ? UPLOAD_BASE + filename : DEFAULT_IMG;
}

function slugify(text: string): string {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Helper: extract a course title from a raw object
function toTitle(raw: RawCourse): string {
  const t =
    raw?.course_name ??
    raw?.name ??
    raw?.title ??
    raw?.course_title ??
    raw?.course ??
    "";
  return cleanStr(t);
}

// Normalize API response into a consistent array of Course objects
function normalizeCourses(json: ApiResponse): Course[] {
  let arr: RawCourse[] = [];

  if (Array.isArray(json.courses)) arr = json.courses;
  else if (Array.isArray(json.data)) arr = json.data as RawCourse[];
  else if (Array.isArray(json.data?.courses))
    arr = json.data.courses as RawCourse[];

  return arr
    .map((r: RawCourse) => ({
      id: Number(r.id) || 0, // fallback to 0 if conversion fails (should not happen)
      course_name: toTitle(r) || "Untitled Course",
      image_url: (r.image_url ?? r.image ?? r.imagePath) as string | null,
      subcategory_id: (r.subcategory_id ?? r.sub_cat_id ?? r.subCategoryId) as
        | number
        | string
        | null,
      category_id: (r.category_id ?? r.cat_id ?? r.categoryId) as
        | number
        | string
        | null,
    }))
    .filter((c) => c.id !== 0); // remove invalid entries
}

function titleCaseFromSlug(s: string): string {
  if (!s) return "MORE COURSES";
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CourseListPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { subCatIdNum, heading } = useMemo(() => {
    const parts = (slug || "").split("-");
    const id = Number(parts[0]);
    const name = parts.slice(1).join("-");
    return {
      subCatIdNum: Number.isFinite(id) ? id : null,
      heading: titleCaseFromSlug(name) || "MORE COURSES",
    };
  }, [slug]);

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subCatIdNum === null) {
      setLoading(false);
      setError("Invalid subcategory");
      setCourses([]);
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
        throw new Error(`API did not return JSON (HTTP ${res.status})`);
      }
      return { res, json };
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const tries: Array<
          () => Promise<{ res: Response; json: ApiResponse }>
        > = [
          () =>
            fetchJson(
              `${API_BASE}/get_courses.php?subcategory_id=${subCatIdNum}`,
            ),
          () =>
            fetchJson(`${API_BASE}/get_courses.php`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                subcategory_id: subCatIdNum,
                action: "get_by_subcategory",
              }),
            }),
          () => fetchJson(`${API_BASE}/get_courses.php?action=list`),
          () => fetchJson(`${API_BASE}/d_courses.php?subcat=${subCatIdNum}`),
        ];

        let all: Course[] = [];
        let lastErr: unknown = null;

        for (let i = 0; i < tries.length; i++) {
          try {
            const { res, json } = await tries[i]();

            if (!res.ok) {
              lastErr = new Error(`HTTP ${res.status}`);
              continue;
            }

            if (json.success === false) {
              lastErr = new Error(
                json.message || "API returned success: false",
              );
              continue;
            }

            all = normalizeCourses(json);
            lastErr = null;

            if (all.length > 0) {
              break;
            }
          } catch (e) {
            lastErr = e;
          }
        }

        if (lastErr) throw lastErr;

        let filtered: Course[] = [];

        if (all.length > 0) {
          const hasSubcategoryId = all.some((c) => c.subcategory_id != null);

          if (hasSubcategoryId) {
            filtered = all.filter((c) => {
              const cId = String(c.subcategory_id).trim();
              const targetId = String(subCatIdNum).trim();
              return cId === targetId;
            });
          } else {
            filtered = all;
          }
        }

        setCourses(filtered);

        if (filtered.length === 0) {
          setError(`No courses found for ${heading || "this subcategory"}`);
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name === "AbortError") return;
        const message =
          e instanceof Error ? e.message : "Failed to load courses";
        setError(message);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [subCatIdNum, heading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-3 py-6">
        <div className="bg-white px-6 py-4 rounded-2xl shadow-lg font-semibold text-[#1f2a44]">
          Loading courses...
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 px-5 py-2 bg-white rounded-xl font-semibold shadow hover:shadow-md transition flex items-center gap-2"
          type="button"
        >
          <span>←</span> Back
        </button>

        <h1 className="text-3xl md:text-6xl font-lightbold text-center mb-6 text-black tracking-tight">
          {heading}
        </h1>

        {error ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow max-w-md mx-auto">
            <p className="text-red-600 font-semibold mb-4">{error}</p>
            <button
              onClick={() => navigate("/courses")}
              className="px-6 py-2 bg-[#1f2a44] text-white rounded-lg hover:bg-[#2a3a5a] transition"
            >
              Browse All Courses
            </button>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">
              No courses found in this category
            </p>
            <button
              onClick={() => navigate("/courses")}
              className="px-6 py-2 bg-[#1f2a44] text-white rounded-lg hover:bg-[#2a3a5a] transition"
            >
              Browse All Courses
            </button>
          </div>
        ) : (
          <>
            <p className="text-center text-gray-600 mb-8">
              {courses.length} {courses.length === 1 ? "course" : "courses"}{" "}
              available
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {courses.map((c) => {
                const imgSrc = normalizeImageUrl(c.image_url);
                const courseSlug = `${c.id}-${slugify(c.course_name)}`;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => navigate(`/new-courses/${courseSlug}`)}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition cursor-pointer overflow-hidden text-left group"
                  >
                    <div className="h-44 w-full bg-gray-100 overflow-hidden">
                      <img
                        src={imgSrc}
                        alt={c.course_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                        onError={(
                          e: React.SyntheticEvent<HTMLImageElement>,
                        ) => {
                          (e.target as HTMLImageElement).src = DEFAULT_IMG;
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-lg text-gray-800 group-hover:text-[#1f2a44] transition">
                        {c.course_name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
