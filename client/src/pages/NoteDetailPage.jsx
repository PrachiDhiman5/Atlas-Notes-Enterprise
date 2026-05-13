import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { api, getApiBaseUrl } from "../services/api.js";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { getSocket } from "../services/socket.js";
import { PageSkeleton } from "../components/Skeleton.jsx";
import {
  Bold,
  ChevronRight,
  CheckCircle2,
  History,
  Italic,
  List,
  ListOrdered,
  MessageSquare,
  Paperclip,
  Upload,
  Globe,
  Lock
} from "lucide-react";

const fetchComments = async (id) => {
  const res = await api.get(`/comments/note/${id}`);
  return res.data.data;
};

const fetchVersions = async (id) => {
  const res = await api.get(`/notes/${id}/versions`);
  return res.data.data;
};

const fetchAttachments = async (id) => {
  const res = await api.get("/uploads", { params: { note: id } });
  return res.data.data;
};

const noteIdFromPayload = (payload) => {
  if (!payload) return "";
  const raw = payload._id ?? payload.id;
  return raw != null ? String(raw) : "";
};

export default function NoteDetailPage() {
  const { id } = useParams();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const [commentBody, setCommentBody] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saveBanner, setSaveBanner] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const queryClient = useQueryClient();

  const queryEnabled = Boolean(id && accessToken);

  const { data: notePayload, isLoading } = useQuery({
    queryKey: ["note", id],
    queryFn: async () => {
      const res = await api.get(`/notes/${id}`);
      return { note: res.data.data, canEdit: Boolean(res.data.meta?.canEdit) };
    },
    enabled: queryEnabled
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", id],
    queryFn: () => fetchComments(id),
    enabled: queryEnabled
  });

  const { data: versions = [] } = useQuery({
    queryKey: ["versions", id],
    queryFn: () => fetchVersions(id),
    enabled: queryEnabled
  });

  const { data: attachments = [] } = useQuery({
    queryKey: ["attachments", id],
    queryFn: () => fetchAttachments(id),
    enabled: queryEnabled
  });

  const note = notePayload?.note;
  const canEdit = notePayload?.canEdit ?? false;

  const saveNote = useMutation({
    mutationFn: async ({ milestone }) => {
      const res = await api.patch(`/notes/${id}`, {
        title,
        content,
        isPublic,
        ...(milestone ? { milestone: true } : {})
      });
      return res.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["note", id] });
      queryClient.invalidateQueries({ queryKey: ["versions", id] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-activity"] });
      if (variables?.milestone) {
        setSaveBanner("Saved with version checkpoint.");
        setTimeout(() => setSaveBanner(""), 4000);
      }
    }
  });

  const addComment = useMutation({
    mutationFn: () => api.post(`/comments/note/${id}`, { body: commentBody }),
    onSuccess: () => {
      setCommentBody("");
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
      queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-activity"] });
    }
  });

  const restoreVersion = useMutation({
    mutationFn: (versionId) => api.post(`/notes/${id}/versions/${versionId}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note", id] });
      queryClient.invalidateQueries({ queryKey: ["versions", id] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-activity"] });
    }
  });

  const uploadFile = useMutation({
    mutationFn: (file) => {
      if (!canEdit || !note) return Promise.reject(new Error("Read-only"));
      const formData = new FormData();
      formData.append("file", file);
      formData.append("workspace", note.workspace);
      formData.append("note", id);
      return api.post("/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments", id] });
      queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-activity"] });
    }
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: content || "<p></p>",
    editable: true,
    onUpdate: ({ editor: currentEditor }) => {
      setContent(currentEditor.getHTML());
    }
  });

  useEffect(() => {
    if (editor) editor.setEditable(canEdit);
  }, [editor, canEdit]);

  const metrics = useMemo(
    () => ({
      words: content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length,
      chars: content.replace(/<[^>]*>/g, "").length
    }),
    [content]
  );

  useEffect(() => {
    if (!note) return;
    setTitle(note.title || "");
    setContent(note.content || "");
    setIsPublic(Boolean(note.isPublic));
    if (editor && editor.getHTML() !== (note.content || "<p></p>")) {
      editor.commands.setContent(note.content || "<p></p>", false);
    }
  }, [note, editor]);

  useEffect(() => {
    if (!note || !canEdit) return;
    const handle = setTimeout(() => {
      if (
        title !== note.title ||
        content !== note.content ||
        Boolean(isPublic) !== Boolean(note.isPublic)
      ) {
        saveNote.mutate({ milestone: false });
      }
    }, 2500);
    return () => clearTimeout(handle);
  }, [title, content, isPublic, note, id, canEdit]);

  useEffect(() => {
    if (!note?.workspace) return;
    const socket = getSocket();
    const wsId = String(note.workspace);
    socket.emit("workspace:join", wsId);

    const onUpdated = (payload) => {
      if (noteIdFromPayload(payload) === String(id)) {
        queryClient.invalidateQueries({ queryKey: ["note", id] });
      }
    };

    const onComment = (payload) => {
      const noteId = payload?.note != null ? String(payload.note) : "";
      if (noteId === String(id)) {
        queryClient.invalidateQueries({ queryKey: ["comments", id] });
      }
    };

    const onFileUploaded = (payload) => {
      const nid = payload?.noteId != null ? String(payload.noteId) : "";
      if (nid && nid === String(id)) {
        queryClient.invalidateQueries({ queryKey: ["attachments", id] });
      }
    };

    const onActivity = () => {
      queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-activity"] });
    };

    socket.on("note:updated", onUpdated);
    socket.on("note:restored", onUpdated);
    socket.on("comment:created", onComment);
    socket.on("file:uploaded", onFileUploaded);
    socket.on("activity:logged", onActivity);
    return () => {
      socket.off("note:updated", onUpdated);
      socket.off("note:restored", onUpdated);
      socket.off("comment:created", onComment);
      socket.off("file:uploaded", onFileUploaded);
      socket.off("activity:logged", onActivity);
    };
  }, [note?.workspace, id, queryClient]);

  if (isLoading || !note) {
    return <PageSkeleton />;
  }

  const toolbarBtn = (active, onClick) =>
    `rounded-md p-2 transition ${active ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/25 dark:text-indigo-200" : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"}`;

  const commentKey = (c) => (c._id != null ? String(c._id) : c.id);

  const attachmentHref = (f) => {
    const u = f.url || "";
    if (u.startsWith("http") && !u.includes("example.com")) return u;
    if (!accessToken || !f._id) return "#";
    const base = getApiBaseUrl();
    if (base.startsWith("http")) {
      const origin = base.replace(/\/api\/v1\/?$/, "");
      return `${origin}/api/v1/uploads/stream/${f._id}?token=${encodeURIComponent(accessToken)}`;
    }
    if (typeof window !== "undefined") {
      return `${window.location.origin}/api/v1/uploads/stream/${f._id}?token=${encodeURIComponent(accessToken)}`;
    }
    return "#";
  };

  const isBrokenPlaceholder = (f) => typeof f.url === "string" && f.url.includes("example.com");

  return (
    <section className="space-y-8">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <Link to="/notes" className="hover:text-indigo-600 dark:hover:text-indigo-400">
          Notes
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
        <span className="truncate font-medium text-slate-800 dark:text-slate-200">{title || "Untitled"}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-700">
        <div className="space-y-1">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Rich text · {canEdit ? "Autosave · Workspace sync" : "Read-only (public note)"}
          </p>
          {note.isPublic ? (
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 dark:text-sky-300">
              <Globe className="h-3.5 w-3.5" aria-hidden />
              Public — visible to any signed-in user outside this workspace (read-only for them).
            </p>
          ) : (
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Private — only members of this workspace can see it.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-600 dark:bg-slate-800/50">
              <span className="text-xs text-slate-600 dark:text-slate-400">Public</span>
              <button
                type="button"
                role="switch"
                aria-checked={isPublic}
                onClick={() => setIsPublic((v) => !v)}
                className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition ${
                  isPublic ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                    isPublic ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ) : null}
          {saveBanner ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              {saveBanner}
            </span>
          ) : null}
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            disabled={saveNote.isPending || !title.trim() || !canEdit}
            onClick={() => saveNote.mutate({ milestone: true })}
            title="Save now and add a version you can restore later"
          >
            Save &amp; done
          </button>
          {saveNote.isPending ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
              Saving…
            </span>
          ) : (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
              Saved
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr,min(22rem,100%)]">
        <div className="space-y-4">
          <input
            className="input-field text-lg font-semibold text-slate-900 dark:text-white"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            aria-label="Note title"
            readOnly={!canEdit}
          />

          {editor ? (
            <div className="flex flex-wrap gap-1 rounded-t-xl border border-b-0 border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800/50">
              <button
                type="button"
                disabled={!canEdit}
                className={toolbarBtn(editor.isActive("bold"))}
                onClick={() => editor.chain().focus().toggleBold().run()}
                aria-label="Bold"
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={!canEdit}
                className={toolbarBtn(editor.isActive("italic"))}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                aria-label="Italic"
              >
                <Italic className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={!canEdit}
                className={toolbarBtn(editor.isActive("bulletList"))}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                aria-label="Bullet list"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={!canEdit}
                className={toolbarBtn(editor.isActive("orderedList"))}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                aria-label="Numbered list"
              >
                <ListOrdered className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <div className="tiptap-editor rounded-b-xl border border-t-0 border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950/50">
            <EditorContent editor={editor} />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {metrics.words} words · {metrics.chars} characters
          </p>

          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <Paperclip className="h-4 w-4 text-indigo-500" />
              Attachments
            </h3>
            {attachments.length > 0 ? (
              <ul className="mb-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                {attachments.map((f) => (
                  <li key={String(f._id)}>
                    {isBrokenPlaceholder(f) ? (
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        {f.fileName} — old placeholder link. Re-upload to open.
                      </p>
                    ) : (
                      <a
                        className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                        href={attachmentHref(f)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {f.fileName}
                      </a>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {f.uploadedBy?.name ? `${f.uploadedBy.name} · ` : ""}
                      {f.fileType} · {(f.size / 1024).toFixed(1)} KB
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
            {canEdit ? (
            <div
              className={`rounded-xl border-2 border-dashed p-6 text-center text-sm transition ${
                isDragOver
                  ? "border-indigo-500 bg-indigo-50/80 text-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-100"
                  : "border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-400"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) uploadFile.mutate(file);
              }}
            >
              <Upload className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" strokeWidth={1.25} />
              <p className="mt-2 font-medium text-slate-800 dark:text-slate-200">Drop files here</p>
              <p className="mt-1 text-xs text-slate-500">or</p>
              <label className="mt-2 inline-flex cursor-pointer items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500">
                Browse files
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFile.mutate(file);
                  }}
                />
              </label>
            </div>
            ) : (
              <p className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
                Only workspace members can add attachments.
              </p>
            )}
            {uploadFile.isPending ? <p className="mt-2 text-xs text-slate-500">Uploading…</p> : null}
            {uploadFile.isError ? (
              <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">Upload failed. Check workspace access and try again.</p>
            ) : null}
          </div>
        </div>

        <aside className="space-y-8 xl:sticky xl:top-24 xl:self-start">
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <MessageSquare className="h-4 w-4 text-indigo-500" />
              Comments
            </h3>
            <div className="max-h-72 min-h-[4rem] space-y-2 overflow-y-auto rounded-lg border border-slate-200/80 bg-slate-50/50 p-2 dark:border-slate-700 dark:bg-slate-900/30">
              {comments.length ? (
                comments.map((c) => (
                  <div
                    key={commentKey(c)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm dark:border-slate-600 dark:bg-slate-800/80"
                  >
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {c.author?.name || "Member"}
                      {c.createdAt ? ` · ${new Date(c.createdAt).toLocaleString()}` : ""}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-slate-800 dark:text-slate-100">{c.body}</p>
                  </div>
                ))
              ) : (
                <p className="px-2 py-4 text-center text-sm text-slate-500 dark:text-slate-400">No comments yet.</p>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                className="input-field flex-1 text-sm"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder={canEdit ? "Add a comment…" : "Members only can comment"}
                readOnly={!canEdit}
                onKeyDown={(e) => {
                  if (!canEdit) return;
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (commentBody.trim()) addComment.mutate();
                  }
                }}
              />
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => commentBody.trim() && addComment.mutate()}
                className="btn-primary shrink-0 px-4"
              >
                Send
              </button>
            </div>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <History className="h-4 w-4 text-indigo-500" />
              Version history
            </h3>
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Checkpoints when you edit (throttled) or when you use Save &amp; done.</p>
            <div className="space-y-2">
              {versions.length ? (
                versions.map((v) => (
                  <div
                    key={v._id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700"
                  >
                    <time className="text-slate-600 dark:text-slate-400">{new Date(v.createdAt).toLocaleString()}</time>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => restoreVersion.mutate(v._id)}
                      className="shrink-0 font-medium text-indigo-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40 dark:text-indigo-400"
                    >
                      Restore
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Versions appear after edits or Save &amp; done.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
