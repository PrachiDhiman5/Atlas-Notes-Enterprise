import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api.js";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FileText, Plus, Search } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";

function stripHtml(html) {
  if (!html) return "";
  const text = String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 180 ? `${text.slice(0, 180)}…` : text;
}

const fetchNotes = async (search, workspaceId, listScope) => {
  const params = { search, limit: 25 };
  if (listScope === "workspace" && workspaceId) params.workspace = workspaceId;
  const res = await api.get("/notes", { params });
  return res.data.data;
};

export default function NotesPage() {
  const [newNotePublic, setNewNotePublic] = useState(false);
  const [search, setSearch] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  /** workspace = notes in selected team; explore = all public notes app-wide */
  const [listScope, setListScope] = useState("workspace");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const scope = location.state?.listScope;
    if (scope === "explore" || scope === "workspace") setListScope(scope);
  }, [location.state]);

  const { data: workspaces = [] } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => (await api.get("/workspaces")).data.data
  });

  const effectiveWorkspace = workspaceId || workspaces[0]?._id || "";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["notes", search, effectiveWorkspace, listScope],
    queryFn: () => fetchNotes(search, effectiveWorkspace, listScope),
    enabled: listScope === "explore" || Boolean(effectiveWorkspace)
  });

  const createNote = useMutation({
    mutationFn: () =>
      api.post("/notes", {
        title: "Untitled note",
        content: "<p></p>",
        workspace: effectiveWorkspace,
        isPublic: newNotePublic
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["notes", "recent"] });
      navigate(`/notes/${res.data.data._id}`);
    }
  });

  return (
    <section>
      <PageHeader
        title="Notes"
        description="My workspace lists every note in that team. Public library shows published notes from everyone (read-only unless you’re a member)."
        actions={
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            disabled={!effectiveWorkspace || createNote.isPending}
            onClick={() => createNote.mutate()}
            title={!effectiveWorkspace ? "Create a workspace first" : "New note in selected workspace"}
          >
            <Plus className="h-4 w-4" />
            {createNote.isPending ? "Creating…" : "New note"}
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setListScope("workspace")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            listScope === "workspace"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          My workspace
        </button>
        <button
          type="button"
          onClick={() => setListScope("explore")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            listScope === "explore"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          Public library
        </button>
      </div>

      {workspaces.length ? (
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-md flex-1">
            <label htmlFor="ws" className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Workspace for notes
            </label>
            <select
              id="ws"
              className="input-field"
              value={effectiveWorkspace}
              onChange={(e) => setWorkspaceId(e.target.value)}
            >
              {workspaces.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-600">
            <span className="text-sm text-slate-700 dark:text-slate-300">New notes default to</span>
            <button
              type="button"
              role="switch"
              aria-checked={newNotePublic}
              onClick={() => setNewNotePublic((v) => !v)}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
                newNotePublic ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  newNotePublic ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-slate-900 dark:text-white">{newNotePublic ? "Public" : "Private"}</span>
          </div>
        </div>
      ) : (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          Create a workspace first to add notes.{" "}
          <Link to="/workspaces" className="font-medium underline">
            Go to Workspaces
          </Link>
        </div>
      )}

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="input-field pl-10"
          placeholder="Search by title or content…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search notes"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          Could not load notes. Check your connection and try again.
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <div className="space-y-3">
          {data?.length ? (
            data.map((note) => (
              <article
                key={note._id}
                className="card-surface group flex flex-col gap-2 p-5 transition hover:border-indigo-200/80 dark:hover:border-indigo-500/30 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/notes/${note._id}`}
                    className="font-semibold text-slate-900 transition group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400"
                  >
                    {note.title || "Untitled"}
                  </Link>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {stripHtml(note.content) || "No content yet—open to start writing."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {note.isPublic ? (
                      <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-800 dark:bg-sky-500/15 dark:text-sky-200">
                        Public
                      </span>
                    ) : (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Private
                      </span>
                    )}
                    {note.isPinned ? (
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
                        Pinned
                      </span>
                    ) : null}
                    {note.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <Link
                  to={`/notes/${note._id}`}
                  className="shrink-0 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  Open →
                </Link>
              </article>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
              <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600" strokeWidth={1} />
              <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">No notes match your search</p>
              <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                {listScope === "explore"
                  ? "No public notes yet, or nothing matches your search. Ask a teammate to publish a note, or switch to My workspace."
                  : "Create a note with New note or adjust your search."}
              </p>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
