import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { supabase } from "./supabase";

const categories = [
  "Market", "Cafe", "Sigara", "Yakıt", "Yemek", "Fatura",
  "Giyim", "Elektronik", "Sağlık", "Eğitim", "Tatil", "Diğer",
];

const categoryIcons = {
  Market: "🛒",
  Cafe: "☕",
  Sigara: "🚬",
  Yakıt: "⛽",
  Yemek: "🍔",
  Fatura: "💡",
  Giyim: "👕",
  Elektronik: "📱",
  Sağlık: "🏥",
  Eğitim: "📚",
  Tatil: "✈️",
  Diğer: "📦",
};

const smartCategoryRules = [
  { words: ["migros", "a101", "bim", "şok", "sok", "market"], category: "Market" },
  { words: ["köfteci", "kofteci", "burger", "yemek", "lahmacun", "döner", "doner", "restaurant", "restoran"], category: "Yemek" },
  { words: ["opet", "shell", "po", "bp", "yakıt", "yakit", "benzin"], category: "Yakıt" },
  { words: ["marlboro", "kent", "parliament", "sigara"], category: "Sigara" },
  { words: ["starbucks", "kahve", "cafe", "kafe"], category: "Cafe" },
  { words: ["elektrik", "su", "doğalgaz", "dogalgaz", "internet", "fatura"], category: "Fatura" },
];

const payments = ["Kart", "Nakit"];
const people = ["Mustafa", "Begüm", "Ortak"];
const installmentOptions = ["2", "3", "4", "5", "6", "7", "8", "9", "12"];

const months = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function formatTL(value) {
  return Number(value || 0).toLocaleString("tr-TR", {
    maximumFractionDigits: 2,
  }) + " TL";
}

function getMonthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthName(monthKey) {
  if (monthKey === "all") return "Tümü";
  const [year, month] = monthKey.split("-").map(Number);
  return `${months[month - 1]} ${year}`;
}

function addMonths(dateString, monthCount) {
  const date = new Date(dateString);
  date.setMonth(date.getMonth() + monthCount);
  return date.toISOString().slice(0, 10);
}

function guessCategory(title) {
  const text = title.toLocaleLowerCase("tr-TR");

  const found = smartCategoryRules.find((rule) =>
    rule.words.some((word) => text.includes(word))
  );

  return found ? found.category : null;
}

function mapFromDb(row) {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    amount: Number(row.amount),
    category: row.category,
    person: row.person,
    payment: row.payment || "Kart",
    isInstallment: row.is_installment || false,
    installmentGroupId: row.installment_group_id,
    installmentCount: String(row.installment_count || "2"),
  };
}

function mapToDb(item) {
  return {
    date: item.date,
    title: item.title,
    amount: Number(item.amount),
    category: item.category,
    person: item.person,
    payment: item.payment || "Kart",
    is_installment: item.isInstallment || false,
    installment_count: item.installmentCount ? Number(item.installmentCount) : null,
    installment_group_id: item.installmentGroupId || null,
  };
}

function App() {
  const [activePage, setActivePage] = useState("add");
  const [editingId, setEditingId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey(new Date()));
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  const [expenses, setExpenses] = useState([]);

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    title: "",
    amount: "",
    category: "Market",
    person: "Mustafa",
    payment: "Kart",
    isInstallment: false,
    installmentCount: "2",
  });

  useEffect(() => {
    fetchExpenses();

    const interval = setInterval(() => {
      fetchExpenses(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  async function fetchExpenses(showLoading = true) {
    if (showLoading) setLoading(true);

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false })
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Veriler alınırken hata oluştu.");
    } else {
      setExpenses((data || []).map(mapFromDb));
    }

    if (showLoading) setLoading(false);
  }

  const availableMonths = useMemo(() => {
    return [...new Set(expenses.map((item) => getMonthKey(item.date)))]
      .sort()
      .reverse();
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (selectedMonth === "all") return expenses;
    return expenses.filter((item) => getMonthKey(item.date) === selectedMonth);
  }, [expenses, selectedMonth]);

  const totalExpense = filteredExpenses.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  const mustafaTotal = filteredExpenses
    .filter((item) => item.person === "Mustafa")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const begumTotal = filteredExpenses
    .filter((item) => item.person === "Begüm")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const ortakTotal = filteredExpenses
    .filter((item) => item.person === "Ortak")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const categoryTotals = useMemo(() => {
    const result = {};

    filteredExpenses.forEach((item) => {
      result[item.category] = (result[item.category] || 0) + Number(item.amount);
    });

    return result;
  }, [filteredExpenses]);

  const topCategories = useMemo(() => {
    return Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [categoryTotals]);

  const monthGroups = useMemo(() => {
    const result = {};

    expenses.forEach((item) => {
      const key = getMonthKey(item.date);
      if (!result[key]) result[key] = [];
      result[key].push(item);
    });

    return Object.keys(result)
      .sort()
      .reverse()
      .map((key) => ({
        key,
        name: getMonthName(key),
        total: result[key].reduce((sum, item) => sum + Number(item.amount), 0),
        items: result[key].sort((a, b) => new Date(b.date) - new Date(a.date)),
      }));
  }, [expenses]);

  function resetForm() {
    setEditingId(null);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      title: "",
      amount: "",
      category: "Market",
      person: "Mustafa",
      payment: "Kart",
      isInstallment: false,
      installmentCount: "2",
    });
  }

  async function saveExpense(e) {
    e.preventDefault();

    if (!form.title || !form.amount) {
      alert("Açıklama ve tutar girmen gerekiyor.");
      return;
    }

    const amountNumber = Number(form.amount);

    if (form.isInstallment && !editingId) {
      const count = Number(form.installmentCount);
      const monthlyAmount = amountNumber / count;
      const groupId = Date.now();

      const installmentExpenses = Array.from({ length: count }, (_, index) => ({
        date: addMonths(form.date, index),
        title: `${form.title} (${index + 1}/${count})`,
        amount: monthlyAmount,
        category: form.category,
        person: form.person,
        payment: form.payment,
        isInstallment: true,
        installmentGroupId: groupId,
        installmentCount: String(count),
      }));

      const { error } = await supabase
        .from("expenses")
        .insert(installmentExpenses.map(mapToDb));

      if (error) {
        console.error(error);
        alert("Taksitli harcama kaydedilirken hata oluştu.");
        return;
      }
    } else {
      const expensePayload = mapToDb({
        ...form,
        amount: amountNumber,
      });

      if (editingId) {
        const { error } = await supabase
          .from("expenses")
          .update(expensePayload)
          .eq("id", editingId);

        if (error) {
          console.error(error);
          alert("Harcama güncellenirken hata oluştu.");
          return;
        }
      } else {
        const { error } = await supabase
          .from("expenses")
          .insert([expensePayload]);

        if (error) {
          console.error(error);
          alert("Harcama kaydedilirken hata oluştu.");
          return;
        }
      }
    }

    await fetchExpenses(false);
    resetForm();
    setActivePage("list");
  }

  function editExpense(item) {
    setEditingId(item.id);
    setForm({
      date: item.date,
      title: item.title,
      amount: item.amount,
      category: item.category,
      person: item.person,
      payment: item.payment || "Kart",
      isInstallment: item.isInstallment || false,
      installmentCount: String(item.installmentCount || "2"),
    });
    setActivePage("add");
  }

  function deleteExpense(item) {
    setDeleteTarget(item);
  }

  async function deleteSingleExpense() {
    if (!deleteTarget) return;

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", deleteTarget.id);

    if (error) {
      console.error(error);
      alert("Harcama silinirken hata oluştu.");
      return;
    }

    await fetchExpenses(false);
    setDeleteTarget(null);
  }

  async function deleteInstallmentSeries() {
    if (!deleteTarget?.installmentGroupId) return;

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("installment_group_id", deleteTarget.installmentGroupId);

    if (error) {
      console.error(error);
      alert("Taksit serisi silinirken hata oluştu.");
      return;
    }

    await fetchExpenses(false);
    setDeleteTarget(null);
  }

  if (loading) {
    return (
      <div className="app">
        <section className="list-card">
          <h3>Yükleniyor...</h3>
          <p className="empty-text">Veriler Supabase'den alınıyor.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="subtitle">Mustafa & Begüm</p>
          <h1>Aile Harcama Takibi</h1>
        </div>
      </header>

      {activePage === "add" && (
        <section className="list-card">
          <h3>{editingId ? "Harcama Düzenle" : "Harcama Ekle"}</h3>

          <form onSubmit={saveExpense}>
            <label>Tarih</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />

            <label>Açıklama / Ürün</label>
            <input
              placeholder="Örn: Migros alışverişi"
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                const guessedCategory = guessCategory(title);

                setForm((prev) => ({
                  ...prev,
                  title,
                  category: guessedCategory || prev.category,
                }));
              }}
            />

            <label>Tutar</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Örn: 1000"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />

            <div className="quick-amounts">
              {[100, 250, 500, 1000].map((amount) => (
                <button
                  type="button"
                  key={amount}
                  onClick={() =>
                    setForm({
                      ...form,
                      amount: String(Number(form.amount || 0) + amount),
                    })
                  }
                >
                  +{amount}
                </button>
              ))}

              <button
                type="button"
                className="clear-btn"
                onClick={() => setForm({ ...form, amount: "" })}
              >
                Temizle
              </button>
            </div>

            <label>Kategori</label>
            <div className="category-grid">
              {categories.slice(0, 6).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  className={form.category === cat ? "choice active" : "choice"}
                  onClick={() => setForm({ ...form, category: cat })}
                >
                  {categoryIcons[cat]} {cat}
                </button>
              ))}
            </div>

            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {categories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>

            <label>Kim Yaptı?</label>
            <div className="choice-row">
              {people.map((person) => (
                <button
                  type="button"
                  key={person}
                  className={form.person === person ? "choice active" : "choice"}
                  onClick={() => setForm({ ...form, person })}
                >
                  {person}
                </button>
              ))}
            </div>

            <label>Ödeme Türü</label>
            <div className="choice-row">
              {payments.map((payment) => (
                <button
                  type="button"
                  key={payment}
                  className={form.payment === payment ? "choice active" : "choice"}
                  onClick={() => setForm({ ...form, payment })}
                >
                  {payment}
                </button>
              ))}
            </div>

            <label>Taksitli Mi?</label>
            <div className="choice-row">
              <button
                type="button"
                className={!form.isInstallment ? "choice active" : "choice"}
                onClick={() => setForm({ ...form, isInstallment: false })}
              >
                Hayır
              </button>

              <button
                type="button"
                className={form.isInstallment ? "choice active" : "choice"}
                onClick={() => setForm({ ...form, isInstallment: true })}
              >
                Evet
              </button>
            </div>

            {form.isInstallment && (
              <>
                <label>Taksit Sayısı</label>
                <select
                  value={form.installmentCount}
                  onChange={(e) => setForm({ ...form, installmentCount: e.target.value })}
                >
                  {installmentOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </>
            )}

            <div className="modal-buttons">
              {editingId && (
                <button type="button" className="cancel" onClick={resetForm}>
                  Vazgeç
                </button>
              )}
              <button type="submit">{editingId ? "Güncelle" : "Kaydet"}</button>
            </div>
          </form>
        </section>
      )}

      {activePage === "list" && (
        <>
          <section className="main-card">
            <div className="top-card-header">
              <div>
                <p>Genel Toplam</p>
                <h2>{formatTL(totalExpense)}</h2>
              </div>

              <select
                className="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="all">Tümü</option>
                {availableMonths.map((monthKey) => (
                  <option key={monthKey} value={monthKey}>
                    {getMonthName(monthKey)}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="list-card">
            <div className="owners">
              <div>
                <span>Mustafa</span>
                <strong>{formatTL(mustafaTotal)}</strong>
              </div>
              <div>
                <span>Begüm</span>
                <strong>{formatTL(begumTotal)}</strong>
              </div>
              <div>
                <span>Ortak</span>
                <strong>{formatTL(ortakTotal)}</strong>
              </div>
            </div>
          </section>

          {topCategories.length > 0 && (
            <section className="list-card">
              <div className="section-title">
                <h3>En Çok Harcananlar</h3>
              </div>

              {topCategories.map(([category, total], index) => (
                <div className="top-category-row" key={category}>
                  <span>
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"} {categoryIcons[category]} {category}
                  </span>
                  <strong>{formatTL(total)}</strong>
                </div>
              ))}
            </section>
          )}

          <section className="list-card">
            <div className="section-title">
              <h3>Kategoriler</h3>
            </div>

            {Object.keys(categoryTotals).length === 0 ? (
              <p className="empty-text">Bu ay/filtre için harcama yok.</p>
            ) : (
              Object.entries(categoryTotals).map(([category, total]) => (
                <div className="category-detail" key={category}>
                  <div className="category-row">
                    <span>{categoryIcons[category]} {category}</span>
                    <strong>{formatTL(total)}</strong>
                  </div>

                  <div className="person-breakdown">
                    {people.map((person) => {
                      const personTotal = filteredExpenses
                        .filter((item) => item.category === category && item.person === person)
                        .reduce((sum, item) => sum + Number(item.amount), 0);

                      if (personTotal === 0) return null;

                      return (
                        <span key={person}>
                          {person}: {formatTL(personTotal)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="list-card">
            <div className="section-title">
              <h3>Harcamalar</h3>
              <span>{filteredExpenses.length} kayıt</span>
            </div>

            {filteredExpenses.map((item) => (
              <div className="expense-row" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <p>
                    {item.date} • {categoryIcons[item.category]} {item.category} • {item.person} • {item.payment}
                  </p>
                </div>

                <div className="expense-right">
                  <strong>{formatTL(item.amount)}</strong>
                  <div className="mini-actions">
                    <button onClick={() => editExpense(item)}>Düzenle</button>
                    <button className="danger" onClick={() => deleteExpense(item)}>
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </>
      )}

      {activePage === "reports" && (
        <section className="list-card">
          <div className="section-title">
            <h3>Raporlar</h3>
            <span>Ay ay</span>
          </div>

          {monthGroups.length === 0 ? (
            <p className="empty-text">Henüz raporlanacak harcama yok.</p>
          ) : (
            monthGroups.map((month) => (
              <details className="month-report" key={month.key}>
                <summary>
                  <strong>{month.name}</strong>
                  <span>{formatTL(month.total)}</span>
                </summary>

                {categories.map((cat) => {
                  const items = month.items.filter((item) => item.category === cat);
                  if (items.length === 0) return null;

                  const catTotal = items.reduce(
                    (sum, item) => sum + Number(item.amount),
                    0
                  );

                  return (
                    <details className="report-category" key={cat}>
                      <summary className="report-category-summary">
                        <strong>
                          {categoryIcons[cat]} {cat}
                        </strong>
                        <span>{formatTL(catTotal)}</span>
                      </summary>

                      {people.map((person) => {
                        const personItems = items.filter(
                          (item) => item.person === person
                        );

                        if (personItems.length === 0) return null;

                        const personTotal = personItems.reduce(
                          (sum, item) => sum + Number(item.amount),
                          0
                        );

                        return (
                          <details className="report-person-detail" key={person}>
                            <summary>
                              <strong>{person}</strong>
                              <span>{formatTL(personTotal)}</span>
                            </summary>

                            {personItems.map((item) => (
                              <div className="report-item" key={item.id}>
                                <div>
                                  <strong>{item.title}</strong>
                                  <p>{item.date} • {item.payment}</p>
                                </div>

                                <span>{formatTL(item.amount)}</span>
                              </div>
                            ))}
                          </details>
                        );
                      })}
                    </details>
                  );
                })}
              </details>
            ))
          )}
        </section>
      )}

      <nav className="bottom-menu">
        <span onClick={() => setActivePage("add")}>➕<br />Ekle</span>
        <span onClick={() => setActivePage("list")}>📋<br />Harcamalar</span>
        <span onClick={() => setActivePage("reports")}>📊<br />Raporlar</span>
      </nav>

      {deleteTarget && (
        <div className="delete-modal-bg">
          <div className="delete-modal">
            <h3>Ne yapmak istiyorsun?</h3>

            <p>
              <strong>{deleteTarget.title}</strong>
            </p>

            {deleteTarget.isInstallment && deleteTarget.installmentGroupId ? (
              <>
                <button className="danger" onClick={deleteSingleExpense}>
                  Sadece Bu Taksiti Sil
                </button>

                <button className="danger" onClick={deleteInstallmentSeries}>
                  Tüm Seriyi Sil
                </button>
              </>
            ) : (
              <button className="danger" onClick={deleteSingleExpense}>
                Harcamayı Sil
              </button>
            )}

            <button className="cancel" onClick={() => setDeleteTarget(null)}>
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
