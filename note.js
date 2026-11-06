(() => {
  "use strict";

  const STORAGE_KEYS = { notes: "savedNotes", theme: "themeMode" };
  const root = document.documentElement;
  const params = new URLSearchParams(window.location.search);
  const noteId = params.get("id");
  const title = document.getElementById("noteTitle");
  const fileNameLabel = document.getElementById("fileNameLabel");
  const editor = document.getElementById("noteEditor");
  const saveState = document.getElementById("saveState");
  const saveStateText = document.getElementById("saveStateText");
  const wordCount = document.getElementById("wordCount");
  const updatedLabel = document.getElementById("updatedLabel");
  const saveButton = document.getElementById("saveChangesButton");
  const downloadButton = document.getElementById("downloadButton");
  const themeButton = document.getElementById("themeButton");
  const themeLabel = document.getElementById("themeLabel");
  const closeButton = document.getElementById("closeEditorButton");
  const toast = document.getElementById("toast");
  const themeModes = ["system", "light", "dark"];

  let activeNote = null;
  let savedContent = "";
  let toastTimer = null;

  function setStatus(message, state) {
    saveStateText.textContent = message;
    saveState.classList.remove("is-saved", "is-saving", "is-error");
    if (state) saveState.classList.add(state);
  }

  function countWords(text) {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/u).length : 0;
  }

  function formatDate(timestamp) {
    if (!timestamp) return "Saved locally in Pemintos";
    try {
      const formatted = new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(timestamp));
      return `Last saved ${formatted}`;
    } catch {
      return "Saved locally in Pemintos";
    }
  }

  function updateMeta() {
    const words = countWords(editor.value);
    wordCount.textContent = `${words} ${words === 1 ? "word" : "words"}`;
    const dirty = editor.value !== savedContent;
    saveButton.disabled = !activeNote || !dirty;
    setStatus(dirty ? "Unsaved changes" : "All changes saved", dirty ? "is-saving" : "is-saved");
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 3200);
  }

  function applyTheme(mode) {
    const normalized = themeModes.includes(mode) ? mode : "system";
    root.dataset.theme = normalized;
    themeLabel.textContent = normalized[0].toUpperCase() + normalized.slice(1);
    themeButton.title = `Theme: ${themeLabel.textContent}. Click to change.`;
    themeButton.setAttribute("aria-label", `Color theme: ${themeLabel.textContent}. Click to change.`);
  }

  async function loadNote() {
    try {
      const data = await chrome.storage.local.get([STORAGE_KEYS.notes, STORAGE_KEYS.theme]);
      applyTheme(data[STORAGE_KEYS.theme] || "system");
      const notes = Array.isArray(data[STORAGE_KEYS.notes]) ? data[STORAGE_KEYS.notes] : [];
      activeNote = notes.find((item) => item && item.id === noteId) || null;

      if (!activeNote) {
        title.textContent = "Note not found";
        document.title = "Note not found — Pemintos";
        fileNameLabel.textContent = "This saved note is no longer available.";
        editor.placeholder = "Return to Pemintos and open another saved note.";
        editor.disabled = true;
        setStatus("Note unavailable", "is-error");
        showToast("This note could not be found in local storage.");
        return;
      }

      const filename = activeNote.filename || "note.txt";
      title.textContent = filename;
      document.title = `${filename} — Pemintos`;
      fileNameLabel.textContent = filename;
      editor.value = activeNote.content || "";
      editor.disabled = false;
      downloadButton.disabled = false;
      savedContent = editor.value;
      updatedLabel.textContent = formatDate(activeNote.updatedAt || activeNote.createdAt);
      updateMeta();
      setStatus("All changes saved", "is-saved");
      editor.focus({ preventScroll: true });
    } catch (error) {
      console.error("Pemintos could not open this note:", error);
      title.textContent = "Unable to open note";
      setStatus("Could not load note", "is-error");
      showToast("The saved note could not be loaded.");
    }
  }

  async function saveChanges() {
    if (!activeNote || editor.disabled) return;
    const content = editor.value;
    saveButton.disabled = true;
    saveButton.querySelector("span").textContent = "Saving…";
    setStatus("Saving changes…", "is-saving");

    try {
      const data = await chrome.storage.local.get(STORAGE_KEYS.notes);
      const notes = Array.isArray(data[STORAGE_KEYS.notes]) ? data[STORAGE_KEYS.notes] : [];
      const index = notes.findIndex((item) => item && item.id === activeNote.id);
      if (index < 0) throw new Error("Saved note no longer exists.");

      const updated = { ...notes[index], content, updatedAt: Date.now() };
      notes[index] = updated;
      await chrome.storage.local.set({ [STORAGE_KEYS.notes]: notes });
      activeNote = updated;
      savedContent = content;
      updatedLabel.textContent = formatDate(updated.updatedAt);
      updateMeta();
      setStatus("All changes saved", "is-saved");
      showToast("Your changes are saved in Pemintos.");
      return true;
    } catch (error) {
      console.error("Pemintos could not save changes:", error);
      setStatus("Could not save changes", "is-error");
      showToast("Changes could not be saved. Please try again.");
      saveButton.disabled = false;
      return false;
    } finally {
      saveButton.querySelector("span").textContent = "Save changes";
    }
  }

  async function downloadCurrentNote() {
    if (!activeNote) return;
    const content = editor.value;
    const filename = activeNote.filename || "note.txt";
    const previousLabel = downloadButton.querySelector("span").textContent;
    downloadButton.disabled = true;
    downloadButton.querySelector("span").textContent = "Preparing…";

    const objectUrl = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    try {
      await chrome.downloads.download({
        url: objectUrl,
        filename,
        saveAs: false,
        conflictAction: "uniquify"
      });
      showToast(`Download started: ${filename}`);
    } catch (error) {
      console.error("Pemintos could not download this note:", error);
      showToast("The note could not be downloaded. Please try again.");
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      downloadButton.disabled = false;
      downloadButton.querySelector("span").textContent = previousLabel;
    }
  }

  editor.addEventListener("input", updateMeta);
  saveButton.addEventListener("click", saveChanges);
  downloadButton.addEventListener("click", downloadCurrentNote);

  themeButton.addEventListener("click", async () => {
    const current = themeModes.indexOf(root.dataset.theme || "system");
    const next = themeModes[(current + 1) % themeModes.length];
    applyTheme(next);
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.theme]: next });
    } catch (error) {
      console.error("Pemintos could not save the theme preference:", error);
    }
  });

  closeButton.addEventListener("click", async () => {
    if (activeNote && editor.value !== savedContent) {
      const saved = await saveChanges();
      if (!saved) return;
    }
    chrome.tabs.getCurrent((tab) => {
      if (tab?.id !== undefined) chrome.tabs.remove(tab.id);
      else window.close();
    });
  });

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      if (activeNote && editor.value !== savedContent) saveChanges();
    }
  });

  loadNote();
})();
