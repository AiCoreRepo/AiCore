import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { Loader2, MessageCircleQuestion } from "lucide-react";
import { Sidebar } from "@/components/admin/Sidebar";
import { getAdminFeedback } from "@/lib/api";

interface FeedbackRow {
  feedback_id: string;
  user_id: string;
  user_email: string | null;
  user_role: string;
  rating: number;
  comment: string | null;
  context_type: "AVATAR_CREATION" | "AVATAR_RECREATION" | "VIRTUAL_TRYON";
  context_reference_id: string | null;
  context_label: string | null;
  created_at: string;
}

const contextLabelMap: Record<FeedbackRow["context_type"], string> = {
  AVATAR_CREATION: "Avatar Creation",
  AVATAR_RECREATION: "Avatar Recreation",
  VIRTUAL_TRYON: "Virtual Try-On",
};

const AdminFeedbackPage = () => {
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [minRating, setMinRating] = useState<number | "">("");
  const [maxRating, setMaxRating] = useState<number | "">("");
  const [context, setContext] = useState<FeedbackRow["context_type"] | "">("");

  const loadFeedback = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAdminFeedback({
        context: context || undefined,
        minRating: minRating === "" ? undefined : Number(minRating),
        maxRating: maxRating === "" ? undefined : Number(maxRating),
      });
      setFeedback(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load feedback");
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, [context, minRating, maxRating]);

  const summary = useMemo(() => {
    const total = feedback.length;
    const avg = total
      ? (
          feedback.reduce((sum, item) => sum + item.rating, 0) / total
        ).toFixed(1)
      : "0.0";
    const lowCount = feedback.filter((item) => item.rating <= 3).length;
    return {
      total,
      avg,
      lowCount,
    };
  }, [feedback]);

  const handleInputChange = (setter: (value: number | "") => void) => {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value.trim();
      if (!value) {
        setter("");
        return;
      }
      setter(Number(value));
    };
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex">
      <Sidebar />

      <main className="flex-1 ml-[280px] p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <header>
            <h1 className="text-4xl font-bold text-neutral-100 mb-2">Admin Feedback</h1>
            <p className="text-sm text-neutral-400">Ratings and comments from avatar + virtual try-on usage.</p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <article className="bg-neutral-800 border border-white/10 rounded-2xl p-4">
              <p className="text-sm text-neutral-400">Total responses</p>
              <p className="text-2xl font-bold text-white mt-2">{summary.total}</p>
            </article>
            <article className="bg-neutral-800 border border-white/10 rounded-2xl p-4">
              <p className="text-sm text-neutral-400">Average rating</p>
              <p className="text-2xl font-bold text-[#D4AF37] mt-2">{summary.avg} / 5</p>
            </article>
            <article className="bg-neutral-800 border border-white/10 rounded-2xl p-4">
              <p className="text-sm text-neutral-400">Needs attention (≤ 3)</p>
              <p className="text-2xl font-bold text-amber-300 mt-2">{summary.lowCount}</p>
            </article>
          </section>

          <section className="bg-neutral-800 border border-white/10 rounded-2xl p-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
              <div className="flex flex-wrap gap-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-2">Context</label>
                  <select
                    className="rounded-lg bg-neutral-900 border border-white/10 px-3 py-2 text-sm"
                    value={context}
                    onChange={(event) => setContext(event.target.value as FeedbackRow["context_type"] | "")}
                  >
                    <option value="">All</option>
                    <option value="AVATAR_CREATION">Avatar Creation</option>
                    <option value="AVATAR_RECREATION">Avatar Recreation</option>
                    <option value="VIRTUAL_TRYON">Virtual Try-On</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-2">Min rating</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    className="w-28 rounded-lg bg-neutral-900 border border-white/10 px-3 py-2 text-sm"
                    value={minRating}
                    onChange={handleInputChange(setMinRating)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-2">Max rating</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    className="w-28 rounded-lg bg-neutral-900 border border-white/10 px-3 py-2 text-sm"
                    value={maxRating}
                    onChange={handleInputChange(setMaxRating)}
                  />
                </div>
              </div>

              <button
                onClick={loadFeedback}
                className="px-4 py-2 bg-[#D4AF37] text-[#2C2416] rounded-lg text-sm font-semibold"
              >
                Refresh
              </button>
            </div>

            <div className="mt-4 h-px bg-white/10" />

            {loading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="h-8 w-8 text-[#D4AF37] animate-spin" />
              </div>
            ) : error ? (
              <div className="py-16 text-center text-red-400">{error}</div>
            ) : feedback.length === 0 ? (
              <div className="py-16 text-center text-neutral-400">No feedback found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full mt-4 text-sm">
                  <thead>
                    <tr className="text-left text-neutral-300 border-b border-white/10">
                      <th className="py-3 pr-3 font-medium">When</th>
                      <th className="py-3 pr-3 font-medium">User</th>
                      <th className="py-3 pr-3 font-medium">Context</th>
                      <th className="py-3 pr-3 font-medium">Rating</th>
                      <th className="py-3 font-medium">Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedback.map((row) => (
                      <tr key={row.feedback_id} className="border-b border-white/5">
                        <td className="py-4 pr-3 text-neutral-200">
                          {new Date(row.created_at).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-4 pr-3 text-neutral-200">
                          <p>{row.user_email || "Unknown"}</p>
                          <p className="text-xs text-neutral-400 mt-1">{row.user_role}</p>
                        </td>
                        <td className="py-4 pr-3 text-neutral-200">
                          <p>{contextLabelMap[row.context_type]}</p>
                          {row.context_label && <p className="text-xs text-neutral-400 mt-1">{row.context_label}</p>}
                          {row.context_reference_id && (
                            <p className="text-xs text-neutral-500 mt-1 font-mono">{row.context_reference_id}</p>
                          )}
                        </td>
                        <td className="py-4 pr-3">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] font-semibold">
                            {row.rating}
                          </span>
                        </td>
                        <td className="py-4 text-neutral-200">
                          {row.comment ? row.comment : <MessageCircleQuestion className="h-4 w-4 text-neutral-500 inline-block" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminFeedbackPage;
