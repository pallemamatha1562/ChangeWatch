
const API = "http://127.0.0.1:8000";

let websites = [];
let allChanges = [];
let websiteStatuses = {};

const dashboardSection = document.getElementById("dashboardSection");
const websitesSection = document.getElementById("websitesSection");
const historySection = document.getElementById("historySection");

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => toast.classList.remove("show"), 3000);
}

function openModal() {
    document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("modal").classList.add("hidden");
}

function showSection(section) {
    dashboardSection.classList.add("hidden");
    websitesSection.classList.add("hidden");
    historySection.classList.add("hidden");

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("active");
    });

    const titles = {
        dashboard: "Dashboard",
        websites: "Monitored Websites",
        history: "Change History"
    };

    document.getElementById("pageTitle").textContent = titles[section];

    if (section === "dashboard") dashboardSection.classList.remove("hidden");
    if (section === "websites") websitesSection.classList.remove("hidden");
    if (section === "history") historySection.classList.remove("hidden");

    document.querySelector(`[data-section="${section}"]`).classList.add("active");
}

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        showSection(link.dataset.section);
    });
});

async function fetchWebsites() {
    const response = await fetch(`${API}/websites/`);

    if (!response.ok) {
        throw new Error("Could not retrieve websites.");
    }

    const data = await response.json();
    websites = data.websites || [];
    return websites;
}

async function fetchChangesForAll() {
    allChanges = [];

    for (const website of websites) {
        try {
            const response = await fetch(`${API}/websites/${website.id}/changes`);

            if (!response.ok) continue;

            const data = await response.json();

            (data.changes || []).forEach(change => {
                allChanges.push({
                    ...change,
                    website: website.title || website.url,
                    websiteUrl: website.url,
                    websiteId: website.id
                });
            });
        } catch (error) {
            console.error(error);
        }
    }

    return allChanges;
}

function formatLastChecked(value) {
    if (!value) return "Waiting for first check";

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString();
}

/* WEBSITE SEARCH AND CATEGORY FILTER */

function filterWebsites() {
    renderWebsites("allWebsiteList");
}

/* RENDER WEBSITE CARDS */

function renderWebsites(containerId) {
    const container = document.getElementById(containerId);

    let displayWebsites = [...websites];

    // Apply search and category filters only on All Websites page
    if (containerId === "allWebsiteList") {

        const searchInput = document.getElementById("websiteSearch");
        const categoryInput = document.getElementById("categoryFilter");

        const searchText = searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

        const selectedCategory = categoryInput
            ? categoryInput.value
            : "all";

        displayWebsites = displayWebsites.filter(website => {

            const title = (website.title || "").toLowerCase();
            const url = (website.url || "").toLowerCase();
            const category = (website.category || "General").toLowerCase();

            const matchesSearch =
                title.includes(searchText) ||
                url.includes(searchText);

            const matchesCategory =
                selectedCategory === "all" ||
                category === selectedCategory.toLowerCase();

            return matchesSearch && matchesCategory;
        });
    }

    if (!displayWebsites.length) {

        if (containerId === "allWebsiteList" && websites.length > 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No matching websites found.</p>
                    <p>Try another search or category.</p>
                </div>`;
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No websites monitored yet.</p>
                    <p>Add your first website to get started.</p>
                </div>`;
        }

        return;
    }

    container.innerHTML = displayWebsites.map(website => {

        const status = websiteStatuses[website.id] || "Monitoring";

        const statusColor =
            status === "Check Failed" ? "#ef4444" : "#22c55e";

        return `
        <div class="website-card">
            <div class="website-info">
                <h3>${escapeHTML(website.title || website.url)}</h3>

                <a href="${escapeHTML(website.url)}"
                   target="_blank"
                   rel="noopener noreferrer">
                    ${escapeHTML(website.url)}
                </a>

                <div class="website-meta">
                    <span class="tag">${escapeHTML(website.category || "General")}</span>
                    <span class="tag">ID: ${website.id}</span>
                </div>

                <div style="margin-top:12px;">
                    <span style="color:${statusColor};font-weight:600;">
                        ● ${escapeHTML(status)}
                    </span>
                </div>

                <div style="margin-top:8px;font-size:13px;color:#94a3b8;">
                    Last checked:
                    ${escapeHTML(formatLastChecked(website.last_checked))}
                </div>
            </div>

            <div class="website-actions">
                <button class="secondary-btn" onclick="checkWebsite(${website.id})">
                    Check Now
                </button>

                <button class="secondary-btn" onclick="viewHistory(${website.id})">
                    History
                </button>

                <button class="secondary-btn" onclick="deleteWebsite(${website.id})">
                    Delete
                </button>
            </div>
        </div>
        `;
    }).join("");
}

/* DELETE WEBSITE */

async function deleteWebsite(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this monitored website?"
    );

    if (!confirmed) return;

    try {
        const response = await fetch(`${API}/websites/${id}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Could not delete website.");
        }

        delete websiteStatuses[id];

        showToast("Website deleted successfully!");

        await loadData();

    } catch (error) {
        showToast(error.message || "Delete failed.");
    }
}

/* HTML SECURITY HELPER */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[character]));
}

/* CHANGE HISTORY */

function renderHistory() {
    const container = document.getElementById("historyList");

    if (!allChanges.length) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No website changes detected yet.</p>
                <p>Changes will appear here when monitored content updates.</p>
            </div>`;
        return;
    }

    container.innerHTML = allChanges
        .sort((a, b) => b.id - a.id)
        .map(change => `
            <div class="history-item">
                <h3>${escapeHTML(change.website)}</h3>
                <p>${escapeHTML(change.summary || "Website content changed.")}</p>
                <span class="tag">${escapeHTML(change.change_type || "content_update")}</span>
                <div class="history-date">
                    ${escapeHTML(change.detected_at || "Date unavailable")}
                </div>
            </div>
        `).join("");
}

/* EXPORT CHANGE HISTORY TO CSV */

function exportChanges() {

    if (!allChanges.length) {
        showToast("No changes available to export.");
        return;
    }

    // CSV formatting helper
    function csvCell(value) {
        const text = String(value ?? "");
        return `"${text.replace(/"/g, '""')}"`;
    }

    const headers = [
        "Change ID",
        "Website Name",
        "Website URL",
        "Change Type",
        "Summary",
        "Detected At"
    ];

    const rows = [...allChanges]
        .sort((a, b) => b.id - a.id)
        .map(change => [
            change.id,
            change.website,
            change.websiteUrl || "",
            change.change_type || "content_update",
            change.summary || "Website content changed.",
            change.detected_at || "Date unavailable"
        ]);

    const csvContent = [
        headers.map(csvCell).join(","),
        ...rows.map(row => row.map(csvCell).join(","))
    ].join("\r\n");

    // BOM helps Excel display text correctly
    const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "ChangeWatch_Change_History.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    showToast("Change history exported successfully!");
}

/* NOTIFICATION PANEL */

function createNotificationPanel() {
    if (document.getElementById("notificationPanel")) return;

    const panel = document.createElement("div");
    panel.id = "notificationPanel";

    panel.style.cssText = `
        background: rgba(30, 41, 59, 0.65);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;
    `;

    panel.innerHTML = `
        <div style="display:flex;justify-content:space-between;
                    align-items:center;gap:12px;margin-bottom:16px;">
            <div>
                <h2 style="margin:0 0 6px 0;font-size:20px;">
                    Notifications
                </h2>
                <p style="margin:0;color:#94a3b8;font-size:13px;">
                    Detected website updates
                </p>
            </div>

            <div id="notificationCount"
                 style="background:#0f766e;color:white;padding:8px 14px;
                        border-radius:20px;font-weight:600;">
                0
            </div>
        </div>

        <div id="notificationList"></div>
    `;

    dashboardSection.insertBefore(panel, dashboardSection.firstChild);
}

/* DISPLAY NOTIFICATIONS */

function renderNotifications() {
    createNotificationPanel();

    const list = document.getElementById("notificationList");
    const count = document.getElementById("notificationCount");

    count.textContent = allChanges.length;

    if (!allChanges.length) {
        list.innerHTML = `
            <div style="padding:14px;color:#94a3b8;">
                <p style="margin:0;">
                    No changes detected yet. Your monitored websites
                    will appear here when updates are detected.
                </p>
            </div>
        `;
        return;
    }

    const recentChanges = [...allChanges]
        .sort((a, b) => b.id - a.id)
        .slice(0, 5);

    list.innerHTML = recentChanges.map(change => `
        <div style="padding:14px;margin-bottom:10px;
                    border-left:3px solid #14b8a6;
                    background:rgba(15,23,42,0.5);
                    border-radius:8px;">
            <div style="font-weight:600;margin-bottom:6px;">
                ${escapeHTML(change.website)}
            </div>

            <div style="font-size:14px;color:#cbd5e1;margin-bottom:8px;">
                ${escapeHTML(change.summary || "Website content changed.")}
            </div>

            <div style="font-size:12px;color:#94a3b8;">
                ${escapeHTML(change.detected_at || "Date unavailable")}
            </div>
        </div>
    `).join("");
}

/* LOAD EVERYTHING */

async function loadData() {
    try {
        await fetchWebsites();
        await fetchChangesForAll();

        document.getElementById("apiStatus").textContent = "Connected";

        document.getElementById("totalWebsites").textContent = websites.length;
        document.getElementById("totalChanges").textContent = allChanges.length;

        renderWebsites("dashboardWebsiteList");
        renderWebsites("allWebsiteList");
        renderHistory();
        renderNotifications();

    } catch (error) {
        document.getElementById("apiStatus").textContent = "Disconnected";
        console.error(error);
        showToast("Could not connect to ChangeWatch API.");
    }
}

/* MANUAL WEBSITE CHECK */

async function checkWebsite(id) {
    try {
        const response = await fetch(`${API}/websites/${id}/check`, {
            method: "POST"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Check failed.");
        }

        websiteStatuses[id] = "Monitoring";

        showToast(data.message || "Check completed.");
        await loadData();

    } catch (error) {
        websiteStatuses[id] = "Check Failed";

        renderWebsites("dashboardWebsiteList");
        renderWebsites("allWebsiteList");

        showToast(error.message || "Website check failed.");
    }
}

/* VIEW WEBSITE HISTORY */

async function viewHistory(id) {
    showSection("history");

    try {
        const response = await fetch(`${API}/websites/${id}/changes`);
        const data = await response.json();

        const container = document.getElementById("historyList");

        if (!data.changes || data.changes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No changes recorded for this website yet.</p>
                </div>`;
            return;
        }

        container.innerHTML = data.changes.map(change => `
            <div class="history-item">
                <h3>${escapeHTML(data.website || "Website")}</h3>
                <p>${escapeHTML(change.summary || "Website content changed.")}</p>
                <span class="tag">${escapeHTML(change.change_type || "content_update")}</span>
                <div class="history-date">
                    ${escapeHTML(change.detected_at || "Date unavailable")}
                </div>
            </div>
        `).join("");

    } catch (error) {
        showToast("Could not retrieve change history.");
    }
}

/* ADD WEBSITE FORM */

document.getElementById("websiteForm").addEventListener("submit", async event => {
    event.preventDefault();

    const formMessage = document.getElementById("formMessage");
    formMessage.textContent = "Adding website...";

    const payload = {
        url: document.getElementById("url").value.trim(),
        category: document.getElementById("category").value,
        description: document.getElementById("description").value.trim() || null
    };

    try {
        const response = await fetch(`${API}/websites/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Could not add website.");
        }

        formMessage.textContent = "Website added successfully!";
        showToast("Website added successfully!");

        document.getElementById("websiteForm").reset();

        setTimeout(() => {
            closeModal();
            formMessage.textContent = "";
        }, 1000);

        await loadData();

    } catch (error) {
        formMessage.textContent = error.message;
    }
});

/* CHECK API */

async function checkAPI() {
    try {
        const response = await fetch(`${API}/health`);
        if (response.ok) {
            document.getElementById("apiStatus").textContent = "Connected";
        }
    } catch {
        document.getElementById("apiStatus").textContent = "Disconnected";
    }
}

/* INITIAL STARTUP */

loadData();
checkAPI();
