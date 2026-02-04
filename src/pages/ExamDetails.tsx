import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = "https://xiadot.com/admin_maths/api";
const SITE_BASE = "https://xiadot.com";
const DEFAULT_IMG = "/default-unit.png";

type RawItem = Record<string, any>;

type UiCategory = {
  id: number;
  name: string;
  image_url: string | null;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  data?: any;
};

function toNumber(val: any): number | null {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

/** ✅ convert backend image path -> full url */
function normalizeImageUrl(val: any): string | null {
  if (!val) return null;

  let s = String(val).trim();
  s = s.replace(/\\/g, "");
  s = s.replace(/^"+|"+$/g, "");

  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;

  s = s.replace(/^\.\.\//, "");

  if (s.startsWith("/uploads/")) return `${SITE_BASE}/admin_maths${s}`;
  if (s.startsWith("uploads/")) return `${SITE_BASE}/admin_maths/${s}`;
  if (s.startsWith("admin_maths/")) return `${SITE_BASE}/${s}`;

  return `${SITE_BASE}/admin_maths/uploads/${s}`;
}

function safeName(item: RawItem): string {
  return (
    item.name ||
    item.category_name ||
    item.subcategory_name ||
    item.title ||
    item.exam_name ||
    item.course_name ||
    "Unnamed"
  ).toString();
}

function safeId(item: RawItem): number {
  return (
    toNumber(item.id) ??
    toNumber(item.category_id) ??
    toNumber(item.subcategory_id) ??
    0
  );
}

function safeImage(item: RawItem): string | null {
  return normalizeImageUrl(
    item.image_url ?? item.image ?? item.img ?? item.icon ?? item.photo ?? null,
  );
}

function normalizeList(data: any): UiCategory[] {
  const arr: RawItem[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.items)
        ? data.items
        : [];

  return arr
    .map((item) => ({
      id: safeId(item),
      name: safeName(item),
      image_url: safeImage(item),
    }))
    .filter((x) => x.id !== 0);
}

export default function ExamDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const examIdNum = useMemo(() => toNumber(id), [id]);

  const [cats, setCats] = useState<UiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (examIdNum === null) {
      setLoading(false);
      setError("Exam id missing / invalid in URL");
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = `${API_BASE}/get_Category.php?action=list&category_id=${examIdNum}`;
        const res = await fetch(url, { signal: controller.signal });
        const text = await res.text();

        let json: ApiResponse;
        try {
          json = JSON.parse(text);
        } catch {
          console.log("❌ API Returned NON-JSON:", text);
          throw new Error(
            `API not JSON (HTTP ${res.status}). Check PHP warnings.`,
          );
        }

        if (!json.success) throw new Error(json.message || "API failed");

        const normalized = normalizeList(json.data);
        setCats(normalized);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message || "Failed to load categories");
        setCats([]);
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [examIdNum]);

  /* ✅ LOADING */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center px-3 py-6">
        <div className="bg-white px-6 py-4 rounded-2xl shadow-lg font-lightbold text-[#1f2a44]">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <>
      {/* =========================
          ✅ DESKTOP VIEW (md and up)
          ========================= */}
      <div className="hidden md:block min-h-screen bg-[#ffffff]">
        <div className="max-w-7xl mx-auto px-6 py-10">
          {/* back */}
          <button
            onClick={() => navigate(-1)}
            className="mb-8 px-5 py-2 bg-white rounded-xl font-semibold shadow hover:shadow-md transition"
          >
            ← Back
          </button>

          <h1 className="text-2xl font-lightbold text-center mb-10 text-black tracking-wide">
            ALL SYLLABUS PATTERN
          </h1>

          {error ? (
            <div className="bg-white rounded-2xl p-5 text-red-700 font-lightbold text-center shadow">
              {error}
            </div>
          ) : cats.length === 0 ? (
            <p className="text-center font-lightbold text-gray-800">
              No categories found
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {cats.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/courses/subcategory/${c.id}`)}
                  className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition cursor-pointer overflow-hidden"
                >
                  <div className="h-40 w-full bg-gray-100 flex items-center justify-center">
                    <img
                      src={c.image_url || DEFAULT_IMG}
                      alt={c.name}
                      className="h-32 object-contain"
                      onError={(e) => (e.currentTarget.src = DEFAULT_IMG)}
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-lightbold text-xl text-black">
                      {c.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =========================
          ✅ MOBILE VIEW (below md)
          ========================= */}
      <div className="md:hidden min-h-screen bg-[#ffffff] flex justify-center px-3 pt-6 pb-6">
        <div className="w-full max-w-[380px] bg-[#ffffff] rounded-[26px] shadow-2xl p-4">
          {/* TOP BAR */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="bg-white rounded-xl px-4 py-2 font-lightbold shadow active:scale-95 transition"
            >
              ← Back
            </button>

            <div className="text-white/90 text-sm font-lightbold">
              ID: {examIdNum}
            </div>
          </div>

          <h1 className="text-center text-3xl font-lightbold">
            ALL SYLLABUS PATTERN
          </h1>

          {/* HERO IMAGE */}
          <div className="mb-6">
            <img
              src="/books.png"
              alt="Hero"
              className="w-full h-[180px] object-cover rounded-2xl shadow-xl"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>

          {/* ERROR / EMPTY / LIST */}
          {error ? (
            <div className="bg-white rounded-2xl p-4 text-red-700 font-lightbold text-center shadow">
              {error}
            </div>
          ) : cats.length === 0 ? (
            <div className="bg-white rounded-2xl p-4 text-center font-lightbold shadow">
              No categories found
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 pb-2">
              {cats.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    navigate(`/courses/subcategory/${c.id}`);
                    window.scrollTo({
                      top: 0,
                      left: 0,
                      behavior: "instant" as ScrollBehavior,
                    });
                  }}
                  className="
    bg-[#ffffff]
    rounded-2xl
    shadow-[0_10px_20px_rgba(0,0,0,0.25)]
    border border-black/10
    p-4
    cursor-pointer
    active:scale-95
    transition
    flex flex-col items-center justify-center
    min-h-[150px]
  "
                >
                  <img
                    src={c.image_url || DEFAULT_IMG}
                    alt={c.name}
                    className="w-16 h-16 object-contain mb-3"
                    onError={(e) => (e.currentTarget.src = DEFAULT_IMG)}
                  />

                  <p className="text-center text-[18px] font-lightbold text-black leading-5">
                    {c.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
