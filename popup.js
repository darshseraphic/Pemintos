(() => {
  "use strict";

  const STORAGE_KEYS = {
    draft: "noteDraft",
    notes: "savedNotes",
    theme: "themeMode",
    updatedAt: "noteUpdatedAt"
  };

  const root = document.documentElement;
  const editor = document.getElementById("noteEditor");
  const saveState = document.getElementById("saveState");
  const saveStateText = document.getElementById("saveStateText");
  const wordCount = document.getElementById("wordCount");
  const saveSection = document.getElementById("saveSection");
  const saveNoteButton = document.getElementById("saveNoteButton");
  const suggestedFilename = document.getElementById("suggestedFilename");
  const customNameButton = document.getElementById("customNameButton");
  const customNamePanel = document.getElementById("customNamePanel");
  const customFilename = document.getElementById("customFilename");
  const cancelCustomName = document.getElementById("cancelCustomName");
  const savedSection = document.getElementById("savedSection");
  const savedList = document.getElementById("savedList");
  const savedCount = document.getElementById("savedCount");
  const themeButton = document.getElementById("themeButton");
  const themeLabel = document.getElementById("themeLabel");
  const toast = document.getElementById("toast");

  let saveQueue = Promise.resolve();
  let latestRevision = 0;
  let toastTimer = null;
  let isReady = false;
  let savedNotes = [];

  const themeModes = ["system", "light", "dark"];

  function setSaveState(message, state) {
    saveStateText.textContent = message;
    saveState.classList.remove("is-saved", "is-saving", "is-error");
    if (state) saveState.classList.add(state);
  }

  function countWords(text) {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/u).length : 0;
  }

  function cleanFirstWord(text) {
    const firstToken = text.trim().split(/\s+/u)[0] || "note";
    const clean = firstToken
      .normalize("NFKC")
      .replace(/[<>:"/\\|?*\u0000-\u001F\u007F]/g, "")
      .replace(/^[.,;!?()[\]{}'"`~]+|[.,;!?()[\]{}'"`~]+$/g, "")
      .replace(/^\.+|\.+$/g, "")
      .slice(0, 80);
    return clean || "note";
  }

  function cleanCustomName(value) {
    return value
      .trim()
      .replace(/\.txt$/i, "")
      .normalize("NFKC")
      .replace(/[<>:"/\\|?*\u0000-\u001F\u007F]/g, "-")
      .replace(/\s+/gu, " ")
      .replace(/^\.+|[. ]+$/g, "")
      .slice(0, 100) || "note";
  }

  function makeId() {
    if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
    return `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function updateEditorMeta() {
    const text = editor.value;
    const words = countWords(text);
    wordCount.textContent = `${words} ${words === 1 ? "word" : "words"}`;
    const hasNote = text.trim().length > 0;
    saveSection.hidden = !hasNote;
    suggestedFilename.textContent = `${cleanFirstWord(text)}.txt`;

    if (!hasNote) {
      customNamePanel.hidden = true;
      customNameButton.setAttribute("aria-expanded", "false");
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 3200);
  }

  function persistDraft() {
    if (!isReady) return;
    const revision = ++latestRevision;
    const text = editor.value;
    setSaveState("Saving draft…", "is-saving");

    // Serialize writes so an older save cannot overwrite more recent typing.
    saveQueue = saveQueue
      .catch(() => undefined)
      .then(() => chrome.storage.local.set({
        [STORAGE_KEYS.draft]: text,
        [STORAGE_KEYS.updatedAt]: Date.now()
      }))
      .then(() => {
        if (revision === latestRevision) {
          setSaveState(text.trim() ? "Draft saved" : "Ready when you are", text.trim() ? "is-saved" : null);
        }
      })
      .catch((error) => {
        console.error("Pemintos could not save the draft:", error);
        if (revision === latestRevision) setSaveState("Could not save draft", "is-error");
      });
  }

  function renderSavedNotes() {
    const ordered = [...savedNotes].sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    savedSection.hidden = ordered.length === 0;
    savedCount.textContent = String(ordered.length);
    savedList.replaceChildren();

    for (const note of ordered) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "saved-note";
      item.dataset.noteId = note.id;
      item.setAttribute("aria-label", `Open ${note.filename || "saved note"}`);

      const icon = document.createElement("span");
      icon.className = "saved-note-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = '<svg viewBox="0 0 20 20" fill="none"><path d="M5 2.8h6.8l3.2 3.3v10.1c0 .6-.4 1-1 1H5c-.6 0-1-.4-1-1V3.8c0-.6.4-1 1-1Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M11.5 3v3.5H15M7 10h6M7 13h6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';

      const copy = document.createElement("span");
      copy.className = "saved-note-copy";
      const title = document.createElement("strong");
      title.className = "saved-note-title";
      title.textContent = note.filename || "note.txt";
      const detail = document.createElement("span");
      detail.className = "saved-note-detail";
      detail.textContent = `${countWords(note.content || "")} ${countWords(note.content || "") === 1 ? "word" : "words"} · Edited ${formatDate(note.updatedAt || note.createdAt)}`;
      copy.append(title, detail);

      const arrow = document.createElement("span");
      arrow.className = "saved-note-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "↗";
      item.append(icon, copy, arrow);
      savedList.append(item);
    }
  }

  function formatDate(timestamp) {
    if (!timestamp) return "just now";
    try {
      return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(timestamp));
    } catch {
      return "recently";
    }
  }

  async function writeSavedNotes() {
    await chrome.storage.local.set({ [STORAGE_KEYS.notes]: savedNotes });
  }

  async function downloadText(text, filename) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    try {
      const downloadId = await chrome.downloads.download({
        url: objectUrl,
        filename,
        saveAs: false,
        conflictAction: "uniquify"
      });

      // Chrome may add a suffix if a file with this name already exists.
      // Read back the actual filename so the in-extension library matches it.
      try {
        const [download] = await chrome.downloads.search({ id: downloadId });
        const actualName = download?.filename?.split(/[\\/]/u).pop();
        if (actualName) return actualName;
      } catch (lookupError) {
        console.warn("Pemintos could not read the final download name:", lookupError);
      }
      return filename;
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    }
  }

  async function saveCurrentNote(filename) {
    const content = editor.value;
    if (!content.trim() || saveNoteButton.disabled) return;

    saveNoteButton.disabled = true;
    editor.disabled = true;
    const originalLabel = saveNoteButton.querySelector("span").textContent;
    saveNoteButton.querySelector("span").textContent = "Saving note…";

    const now = Date.now();
    const note = {
      id: makeId(),
      filename,
      content,
      createdAt: now,
      updatedAt: now
    };
    let storedInLibrary = false;

    try {
      // Store the note in the extension first. The local copy remains safe even
      // if Chrome's download manager is unavailable or the download is blocked.
      savedNotes.push(note);
      await writeSavedNotes();
      storedInLibrary = true;
      renderSavedNotes();

      // Invalidate any queued autosave of the old draft, then clear it in the
      // same write queue so the previous text cannot reappear after reopening.
      const clearRevision = ++latestRevision;
      saveQueue = saveQueue
        .catch(() => undefined)
        .then(() => chrome.storage.local.set({
          [STORAGE_KEYS.draft]: "",
          [STORAGE_KEYS.updatedAt]: Date.now()
        }))
        .then(() => {
          if (clearRevision === latestRevision) setSaveState("Saved in Pemintos", "is-saved");
        });
      await saveQueue;
      editor.value = "";
      updateEditorMeta();

      try {
        const actualFilename = await downloadText(content, filename);
        note.filename = actualFilename;
        note.updatedAt = Date.now();
        try {
          await writeSavedNotes();
        } catch (nameUpdateError) {
          // The text is already safely archived and downloaded. Keep the
          // requested filename in the library if updating the collision name fails.
          console.warn("Pemintos could not update the final filename in the library:", nameUpdateError);
        }
        renderSavedNotes();
        showToast(`Saved and downloaded as ${actualFilename}.`);
      } catch (downloadError) {
        console.error("Pemintos could not download the saved note:", downloadError);
        showToast("Your note is saved in Pemintos, but the download could not start.");
      }
    } catch (error) {
      if (!storedInLibrary) savedNotes = savedNotes.filter((item) => item.id !== note.id);
      console.error("Pemintos could not save the note:", error);
      // If the library save succeeded but clearing the draft failed, leave the
      // original text visible so nothing is lost from the user's point of view.
      editor.value = content;
      updateEditorMeta();
      setSaveState("Could not finish saving", "is-error");
      showToast("The note may be in Saved notes, but your draft was kept here too.");
    } finally {
      editor.disabled = false;
      saveNoteButton.disabled = false;
      saveNoteButton.querySelector("span").textContent = originalLabel;
      renderSavedNotes();
      editor.focus();
    }
  }

  function applyTheme(mode) {
    const normalized = themeModes.includes(mode) ? mode : "system";
    root.dataset.theme = normalized;
    themeLabel.textContent = normalized[0].toUpperCase() + normalized.slice(1);
    themeButton.title = `Theme: ${themeLabel.textContent}. Click to change.`;
    themeButton.setAttribute("aria-label", `Color theme: ${themeLabel.textContent}. Click to change.`);
  }

  async function loadSavedData() {
    try {
      const stored = await chrome.storage.local.get([
        STORAGE_KEYS.draft,
        STORAGE_KEYS.notes,
        STORAGE_KEYS.theme
      ]);
      editor.value = typeof stored[STORAGE_KEYS.draft] === "string" ? stored[STORAGE_KEYS.draft] : "";
      savedNotes = Array.isArray(stored[STORAGE_KEYS.notes])
        ? stored[STORAGE_KEYS.notes].filter((item) => item && typeof item.id === "string" && typeof item.content === "string")
        : [];
      applyTheme(stored[STORAGE_KEYS.theme] || "system");
      updateEditorMeta();
      renderSavedNotes();
      if (editor.value.trim()) setSaveState("Draft saved", "is-saved");
      else setSaveState("Ready when you are", null);
    } catch (error) {
      console.error("Pemintos could not load saved data:", error);
      setSaveState("Could not load saved data", "is-error");
      showToast("Your saved notes could not be loaded.");
    } finally {
      isReady = true;
    }
  }

  editor.addEventListener("input", () => {
    updateEditorMeta();
    persistDraft();
  });

  saveNoteButton.addEventListener("click", () => {
    saveCurrentNote(`${cleanFirstWord(editor.value)}.txt`);
  });

  customNameButton.addEventListener("click", () => {
    const willOpen = customNamePanel.hidden;
    customNamePanel.hidden = !willOpen;
    customNameButton.setAttribute("aria-expanded", String(willOpen));
    if (willOpen) {
      customFilename.value = cleanFirstWord(editor.value);
      customFilename.focus();
      customFilename.select();
    }
  });

  cancelCustomName.addEventListener("click", () => {
    customNamePanel.hidden = true;
    customNameButton.setAttribute("aria-expanded", "false");
    customNameButton.focus();
  });

  customNamePanel.addEventListener("submit", (event) => {
    event.preventDefault();
    saveCurrentNote(`${cleanCustomName(customFilename.value)}.txt`);
    customNamePanel.hidden = true;
    customNameButton.setAttribute("aria-expanded", "false");
  });

  savedList.addEventListener("click", (event) => {
    const item = event.target.closest("[data-note-id]");
    if (!item) return;
    const url = chrome.runtime.getURL(`note.html?id=${encodeURIComponent(item.dataset.noteId)}`);
    chrome.tabs.create({ url });
  });

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

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      if (editor.value.trim()) saveCurrentNote(`${cleanFirstWord(editor.value)}.txt`);
    }
  });

  loadSavedData();
})();
