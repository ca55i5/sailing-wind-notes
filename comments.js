// 風帳のコメント欄（Firebase Firestore）
// 各ページの一番下の <section id="comments" data-page="odo"> に表示する。
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase コンソール →「プロジェクトの設定」→「マイアプリ」の値（公開して問題ない値）
const firebaseConfig = {
  apiKey: "AIzaSyC8YfT436xQYRMePdQDqxi5FXSoaMkRFRo",
  authDomain: "sailing-wind-notes.firebaseapp.com",
  projectId: "sailing-wind-notes",
  appId: "1:66078843408:web:39c8b2df4e1917d6786095",
};

const box = document.getElementById("comments");
const page = box.dataset.page;
const list = box.querySelector(".c-list");
const form = box.querySelector("form");
const msg = box.querySelector(".c-msg");
const nameIn = form.elements.name, textIn = form.elements.text;

try { nameIn.value = localStorage.getItem("windNoteName") || ""; } catch (e) {}

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = (ts) => {
  if (!ts) return "送信中…";
  const d = ts.toDate();
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

if (!firebaseConfig.apiKey) {
  list.innerHTML = '<p class="c-empty">コメント欄は準備中。</p>';
  form.querySelector("button").disabled = true;
} else {
  const db = getFirestore(initializeApp(firebaseConfig));
  const col = collection(db, "comments");

  onSnapshot(query(col, where("page", "==", page)), (snap) => {  // 並べ替えは手元で（複合インデックス不要）
    if (snap.empty) { list.innerHTML = '<p class="c-empty">まだコメントはない。最初のひとことをどうぞ。</p>'; return; }
    const docs = snap.docs.map((d) => d.data()).sort((a, b) => (b.createdAt?.toMillis?.() ?? Infinity) - (a.createdAt?.toMillis?.() ?? Infinity));
    list.innerHTML = docs.map((c) => {
      return `<article class="c-item"><div class="c-head"><b>${esc(c.name)}</b><span class="mono">${fmtDate(c.createdAt)}</span></div><p>${esc(c.text).replace(/\n/g, "<br>")}</p></article>`;
    }).join("");
  }, (err) => {
    console.error(err);
    list.innerHTML = '<p class="c-empty">コメントを読み込めなかった。時間をおいて開き直してみて。</p>';
  });

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const name = nameIn.value.trim(), text = textIn.value.trim();
    if (!name || !text) { msg.textContent = "名前とコメントを入れてね。"; return; }
    if (form.elements.website.value) return; // ボット避け（人には見えない欄）
    const btn = form.querySelector("button"); btn.disabled = true; msg.textContent = "送信中…";
    try {
      await addDoc(col, { page, name: name.slice(0, 30), text: text.slice(0, 500), createdAt: serverTimestamp() });
      try { localStorage.setItem("windNoteName", name); } catch (e) {}
      textIn.value = ""; msg.textContent = "送信した。ありがとう！";
    } catch (e) {
      console.error(e); msg.textContent = "送信できなかった。時間をおいてもう一度試してみて。";
    } finally { btn.disabled = false; }
  });
}
