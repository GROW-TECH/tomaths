import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = "https://xiadot.com/admin_maths/api";
const UPLOAD_BASE = "https://xiadot.com/admin_maths/uploads/";

// ✅ Put fallback file here: tomaths/public/images/default-unit.png
const DEFAULT_IMG = "/images/phonic_placeholder_24.webp";

type Course = {
  id: number;
  course_name: string;
  image_url: string | null;
  subcategory_id?: number | string | null;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  courses?: any[];
  data?: any;
};

function cleanStr(v: any) {
  return String(v ?? "")
    .replace(/\\/g, "")
    .replace(/^"+|"+$/g, "")
    .trim();
}
function normalizeImageUrl(url: any) {
  const clean = cleanStr(url);
  console.log("NORMALIZE IMG URL:", url, "=>", clean);

  if (!clean || clean === "null" || clean === "undefined") return DEFAULT_IMG;

  // If it's an API upload URL, extract just the filename
  if (clean.includes("/api/uploads/")) {
    // Extract just the filename from the path
    const filename = clean.split("/").pop() || clean;
    console.log("Extracted filename from API URL:", filename);
    return UPLOAD_BASE + filename;
  }

  // already full url (and not an API url)
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    // Even if it's a full URL to uploads directory, ensure it uses the correct base
    if (clean.includes("xiadot.com/admin_maths/uploads/")) {
      return clean; // Already correct
    }
    // For other full URLs, return as-is
    return clean;
  }

  // uploads/filename.png or /uploads/filename.png
  if (clean.includes("uploads/")) {
    const filename = clean.split("uploads/").pop();
    console.log("Filename from uploads path:", filename);
    return filename ? UPLOAD_BASE + filename : DEFAULT_IMG;
  }

  // only filename
  const filename = clean.split("/").pop() || clean;
  console.log("FILENAME EXTRACTED:", filename);
  return filename ? UPLOAD_BASE + filename : DEFAULT_IMG;
}
function slugify(text: string) {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function toTitle(raw: any): string {
  const t =
    raw?.course_name ??
    raw?.name ??
    raw?.title ??
    raw?.course_title ??
    raw?.course ??
    "";
  return cleanStr(t);
}

function normalizeCourses(json: ApiResponse): Course[] {
  let arr: any[] = [];

  if (Array.isArray(json.courses)) arr = json.courses;
  else if (Array.isArray(json.data)) arr = json.data;
  else if (Array.isArray(json.data?.courses)) arr = json.data.courses;

  return arr.map((r: any) => ({
    id: Number(r.id),
    course_name: toTitle(r) || "Untitled Course",
    image_url: r.image_url ?? r.image ?? r.imagePath ?? null, // ✅ extra fallback keys
    subcategory_id: r.subcategory_id ?? r.sub_cat_id ?? r.subCategoryId ?? null,
  }));
}

function titleCaseFromSlug(s: string) {
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
      setError("Invalid subcategory slug");
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
              `${API_BASE}/get_courses.php?action=list&subcategory_id=${subCatIdNum}`,
            ),
          () =>
            fetchJson(`${API_BASE}/get_courses.php`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ subcategory_id: subCatIdNum }),
            }),
          () => fetchJson(`${API_BASE}/get_courses.php?action=list`),
        ];

        let all: Course[] = [];
        let lastErr: any = null;

        for (const t of tries) {
          try {
            const { res, json } = await t();
            if (!res.ok || json.success === false) {
              lastErr = new Error(json.message || `HTTP ${res.status}`);
              continue;
            }
            all = normalizeCourses(json);
            lastErr = null;
            break;
          } catch (e) {
            lastErr = e;
          }
        }

        if (lastErr) throw lastErr;

        const filtered = all.some((c) => c.subcategory_id != null)
          ? all.filter((c) => String(c.subcategory_id) === String(subCatIdNum))
          : all;

        setCourses(filtered);
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
        <div className="bg-white px-6 py-4 rounded-2xl shadow-lg font-semibold text-[#1f2a44]">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 px-5 py-2 bg-white rounded-xl font-semibold shadow hover:shadow-md transition"
          type="button"
        >
          ← Back
        </button>

        <h1 className="text-3xl md:text-6xl font-lightbold text-center mb-10 text-black tracking-tight">
          MORE COURSES
        </h1>

        <p className="text-center font-lightbold text-xl mb-8 text-gray-500">
          {heading}
        </p>

        {error ? (
          <div className="bg-white rounded-2xl p-5 text-red-700 font-semibold text-center shadow">
            {error}
          </div>
        ) : courses.length === 0 ? (
          <p className="text-center font-semibold text-gray-200">
            No courses found
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {courses.map((c) => {
              const imgSrc = normalizeImageUrl(c.image_url);
              const courseSlug = `${c.id}-${slugify(c.course_name)}`;

              // ✅ DEBUG (keep for 1 run)
              // console.log("IMG SRC =>", c.course_name, imgSrc);

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate(`/new-courses/${courseSlug}`)}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition cursor-pointer overflow-hidden text-left"
                >
                  <div className="h-44 w-full bg-gray-100">
                    <img
                      src={imgSrc}
                      alt={c.course_name}
                      className="w-full h-full object-cover" // ✅ IMPORTANT FIX
                      loading="lazy"
                      referrerPolicy="no-referrer" // ✅ hotlink fix (if server blocks)
                    />
                  </div>

                  <div className="p-4">
                    <p className="font-lightbold text-lg text-black">
                      {c.course_name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
