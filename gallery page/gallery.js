const navbarToggle = document.getElementById("navbar_toggle");
const mobileMenu = document.querySelector(".mobile_menu_container");
const navbar = document.querySelector(".navbar"); // Grab the navbar element

// toggle mobile menu on hamburger click
navbarToggle.addEventListener("click", () => {
    mobileMenu.classList.toggle("active");
});

// close mobile menu when clicking outside of it
document.addEventListener("click", (e) => {
    if (!mobileMenu.contains(e.target) && !navbarToggle.contains(e.target)) {
        mobileMenu.classList.remove("active");
    }
});

// close mobile menu when window is resized to desktop view 
window.addEventListener("resize", () => {
    if (window.innerWidth > 960) {
        mobileMenu.classList.remove("active");
    }
});

// Handle navbar expansions and active decorations on scroll
window.addEventListener('scroll', () => {
  const targetText = document.getElementById('works_active');
  
  // Expand navbar to full screen width after scrolling down 50px
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});


// ============================================================
// API CONFIGURATION
// ============================================================

const API_BASE_URL = "https://gallery.alaminn.com";
const API_URL = `${API_BASE_URL}/api/images`;

// ============================================================
// DOM ELEMENTS
// ============================================================

const gallery = document.getElementById("gallery");
const filters = document.getElementById("filters");
const status = document.getElementById("status");

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxFilename = document.getElementById("lightboxFilename");

const closeBtn = document.getElementById("closeBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const renameBtn = document.getElementById("renameBtn");
const moveBtn = document.getElementById("moveBtn");
const deleteBtn = document.getElementById("deleteBtn");

// Others unlock modal
const othersModal = document.getElementById("othersModal");
const othersPassword = document.getElementById("othersPassword");
const othersError = document.getElementById("othersError");
const othersCancelBtn = document.getElementById("othersCancelBtn");
const othersUnlockBtn = document.getElementById("othersUnlockBtn");

// Rename modal
const renameModal = document.getElementById("renameModal");
const renameFilename = document.getElementById("renameFilename");
const renamePassword = document.getElementById("renamePassword");
const renameError = document.getElementById("renameError");
const renameCancelBtn = document.getElementById("renameCancelBtn");
const renameSaveBtn = document.getElementById("renameSaveBtn");

// Move modal
const moveModal = document.getElementById("moveModal");
const moveCategory = document.getElementById("moveCategory");
const movePassword = document.getElementById("movePassword");
const moveError = document.getElementById("moveError");
const moveCancelBtn = document.getElementById("moveCancelBtn");
const moveSaveBtn = document.getElementById("moveSaveBtn");

// Delete modal
const deleteModal = document.getElementById("deleteModal");
const deleteFilename = document.getElementById("deleteFilename");
const deletePassword = document.getElementById("deletePassword");
const deleteConfirmation = document.getElementById("deleteConfirmation");
const deleteError = document.getElementById("deleteError");
const deleteCancelBtn = document.getElementById("deleteCancelBtn");
const deleteConfirmBtn = document.getElementById("deleteConfirmBtn");

// ============================================================
// STATE
// ============================================================

let publicImages = [];
let protectedImages = [];
let visibleImages = [];

let publicCategories = [];
let protectedCategories = [];
let allCategories = [];

let currentCategory = "all";
let currentIndex = 0;

// Short-lived token issued by the server after Others password succeeds.
let othersAccessToken = null;
let othersAccessExpiresAt = 0;

// ============================================================
// HELPERS
// ============================================================

function setModalOpen(modal, open) {
    modal.classList.toggle("open", open);
    modal.setAttribute("aria-hidden", open ? "false" : "true");
}

function setLightboxOpen(open) {
    lightbox.classList.toggle("open", open);
    lightbox.setAttribute("aria-hidden", open ? "false" : "true");

    if (open) {
        document.body.style.overflow = "hidden";
    } else if (!document.querySelector(".action-modal.open")) {
        document.body.style.overflow = "";
    }
}

function currentImage() {
    return visibleImages[currentIndex] || null;
}

function isOthersUnlocked() {
    return Boolean(
        othersAccessToken &&
        Date.now() < othersAccessExpiresAt
    );
}

function showStatus(message) {
    status.textContent = message;
}

function setButtonBusy(button, busyText, busy) {
    if (!button) return;

    if (busy) {
        if (!button.dataset.originalText) {
            button.dataset.originalText = button.textContent;
        }
        button.textContent = busyText;
        button.disabled = true;
    } else {
        button.textContent = button.dataset.originalText || button.textContent;
        button.disabled = false;
    }
}

function validateFilename(name, currentName) {
    const trimmed = name.trim();

    if (!trimmed) {
        return "Please enter a filename.";
    }

    if (trimmed === currentName) {
        return "The new filename is the same as the current filename.";
    }

    if (trimmed.includes("/") || trimmed.includes("\\")) {
        return "A filename cannot contain a path separator.";
    }

    if (trimmed === "." || trimmed === "..") {
        return "That filename is not allowed.";
    }

    return "";
}

async function readJsonResponse(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

async function postAction(endpoint, payload) {
    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload),
            cache: "no-store"
        }
    );

    const data = await readJsonResponse(response);

    if (!response.ok || data.success === false) {
        throw new Error(
            data.error ||
            data.message ||
            `Request failed (HTTP ${response.status})`
        );
    }

    return data;
}

// ============================================================
// PUBLIC GALLERY LOAD
// ============================================================

async function loadPublicGallery() {
    const response = await fetch(
        `${API_URL}?t=${Date.now()}`,
        {
            cache: "no-store"
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    publicImages = Array.isArray(data.images)
        ? data.images
        : [];

    publicCategories = Array.isArray(data.categories)
        ? data.categories
        : [];

    protectedCategories = Array.isArray(data.protected_categories)
        ? data.protected_categories
        : [];

    allCategories = [
        ...publicCategories,
        ...protectedCategories.filter(
            category => !publicCategories.includes(category)
        )
    ];
}

async function loadProtectedGallery() {
    if (!isOthersUnlocked()) {
        othersAccessToken = null;
        othersAccessExpiresAt = 0;
        protectedImages = [];
        return;
    }

    const response = await fetch(
        `${API_BASE_URL}/api/others?access=${encodeURIComponent(othersAccessToken)}&t=${Date.now()}`,
        {
            cache: "no-store"
        }
    );

    if (response.status === 401) {
        othersAccessToken = null;
        othersAccessExpiresAt = 0;
        protectedImages = [];
        throw new Error("Others access has expired.");
    }

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    protectedImages = Array.isArray(data.images)
        ? data.images
        : [];
}

async function loadGallery() {
    try {
        await loadPublicGallery();

        if (currentCategory === "Others") {
            if (!isOthersUnlocked()) {
                renderFilters();
                renderGallery("all");
                openOthersModal();
                return;
            }

            await loadProtectedGallery();
        }

        renderFilters();
        renderGallery(currentCategory);

        showStatus(
            `${
                currentCategory === "Others"
                    ? protectedImages.length
                    : publicImages.length
            } image${
                (
                    currentCategory === "Others"
                        ? protectedImages.length
                        : publicImages.length
                ) === 1 ? "" : "s"
            }`
        );
    } catch (error) {
        console.error("Gallery loading failed:", error);
        showStatus("Unable to load gallery");
        gallery.innerHTML = `
            <div class="message">
                Gallery could not be loaded.
            </div>
        `;
    }
}

// ============================================================
// FILTERS
// ============================================================

function renderFilters() {
    filters.innerHTML = "";

    filters.appendChild(
        createFilterButton(
            "All",
            "all",
            currentCategory === "all",
            false
        )
    );

    publicCategories.forEach(category => {
        filters.appendChild(
            createFilterButton(
                category,
                category,
                currentCategory === category,
                false
            )
        );
    });

    protectedCategories.forEach(category => {
        filters.appendChild(
            createFilterButton(
                category,
                category,
                currentCategory === category,
                true
            )
        );
    });
}

function createFilterButton(label, value, active, protectedCategory) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "filter-btn" + (active ? " active" : "");

    if (protectedCategory) {
        button.classList.add("protected-category");
    }

    button.textContent = label;

    button.addEventListener("click", async () => {
        if (value === "Others") {
            if (!isOthersUnlocked()) {
                currentCategory = "Others";
                openOthersModal();
                return;
            }

            try {
                currentCategory = "Others";
                await loadProtectedGallery();
                renderFilters();
                renderGallery("Others");
                showStatus(`${protectedImages.length} image${protectedImages.length === 1 ? "" : "s"}`);
            } catch (error) {
                othersAccessToken = null;
                othersAccessExpiresAt = 0;
                currentCategory = "all";
                renderFilters();
                renderGallery("all");
                openOthersModal();
            }
            return;
        }

        currentCategory = value;
        renderFilters();
        renderGallery(value);
    });

    return button;
}

// ============================================================
// RENDER GALLERY
// ============================================================

function renderGallery(category) {
    gallery.innerHTML = "";

    if (category === "Others") {
        visibleImages = [...protectedImages];
    } else if (category === "all") {
        visibleImages = [...publicImages];
    } else {
        visibleImages = publicImages.filter(
            image => image.category === category
        );
    }

    if (visibleImages.length === 0) {
        gallery.innerHTML = `
            <div class="message">
                No images in this category.
            </div>
        `;
        return;
    }

    visibleImages.forEach((image, index) => {
        const card = document.createElement("article");
        card.className = "card";
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `Open ${image.name}`);

        const img = document.createElement("img");
        img.src = image.url;
        img.alt = image.name;
        img.loading = "lazy";
        img.decoding = "async";

        const overlay = document.createElement("div");
        overlay.className = "overlay";

        const filename = document.createElement("div");
        filename.className = "filename";
        filename.textContent = image.name;

        const categoryElement = document.createElement("div");
        categoryElement.className = "category";
        categoryElement.textContent = image.category;

        overlay.appendChild(filename);
        overlay.appendChild(categoryElement);
        card.appendChild(img);
        card.appendChild(overlay);

        card.addEventListener("click", () => openLightbox(index));
        card.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openLightbox(index);
            }
        });

        gallery.appendChild(card);
    });
}

// ============================================================
// LIGHTBOX
// ============================================================

function openLightbox(index) {
    if (index < 0 || index >= visibleImages.length) {
        return;
    }

    currentIndex = index;
    updateLightbox();
    setLightboxOpen(true);
}

function updateLightbox() {
    const image = currentImage();

    if (!image) return;

    lightboxImage.src = image.url;
    lightboxImage.alt = image.name;
    lightboxFilename.textContent = `${image.name} • ${image.category}`;

    prevBtn.disabled = visibleImages.length <= 1;
    nextBtn.disabled = visibleImages.length <= 1;
}

function closeLightbox() {
    closeAllActionModals();
    setLightboxOpen(false);
    lightboxImage.src = "";
    lightboxFilename.textContent = "";
}

function showPrevious() {
    if (visibleImages.length === 0) return;

    currentIndex = (
        currentIndex - 1 + visibleImages.length
    ) % visibleImages.length;

    updateLightbox();
}

function showNext() {
    if (visibleImages.length === 0) return;

    currentIndex = (
        currentIndex + 1
    ) % visibleImages.length;

    updateLightbox();
}

// ============================================================
// OTHERS UNLOCK
// ============================================================

function openOthersModal() {
    othersPassword.value = "";
    othersError.textContent = "";
    setModalOpen(othersModal, true);
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => othersPassword.focus());
}

function closeOthersModal() {
    setModalOpen(othersModal, false);
    othersPassword.value = "";
    othersError.textContent = "";

    if (!lightbox.classList.contains("open") && !document.querySelector(".action-modal.open")) {
        document.body.style.overflow = "";
    }
}

async function unlockOthers() {
    const password = othersPassword.value;

    if (!password) {
        othersError.textContent = "Please enter the gallery password.";
        return;
    }

    setButtonBusy(othersUnlockBtn, "Unlocking...", true);
    othersError.textContent = "";

    try {
        const data = await postAction(
            "/api/unlock-others",
            { password }
        );

        othersAccessToken = data.access_token;
        othersAccessExpiresAt = Date.now() + (Number(data.expires_in || 1800) * 1000);
        protectedImages = Array.isArray(data.images) ? data.images : [];

        closeOthersModal();

        currentCategory = "Others";
        renderFilters();
        renderGallery("Others");
        showStatus(`${protectedImages.length} image${protectedImages.length === 1 ? "" : "s"}`);

    } catch (error) {
        console.error("Others unlock failed:", error);
        othersError.textContent = error.message;
    } finally {
        setButtonBusy(othersUnlockBtn, "Unlock", false);
        othersPassword.value = "";
    }
}

// ============================================================
// RENAME
// ============================================================

function openRenameModal() {
    const image = currentImage();
    if (!image) return;

    renameFilename.value = image.name;
    renamePassword.value = "";
    renameError.textContent = "";

    setModalOpen(renameModal, true);
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
        renameFilename.focus();
        renameFilename.select();
    });
}

function closeRenameModal() {
    setModalOpen(renameModal, false);
    renameFilename.value = "";
    renamePassword.value = "";
    renameError.textContent = "";

    if (lightbox.classList.contains("open")) {
        document.body.style.overflow = "hidden";
    } else if (!document.querySelector(".action-modal.open")) {
        document.body.style.overflow = "";
    }
}

async function submitRename() {
    const image = currentImage();
    if (!image) return;

    const newName = renameFilename.value.trim();
    const password = renamePassword.value;
    const validationError = validateFilename(newName, image.name);

    if (validationError) {
        renameError.textContent = validationError;
        return;
    }

    if (!password) {
        renameError.textContent = "Please enter the gallery password.";
        return;
    }

    setButtonBusy(renameSaveBtn, "Saving...", true);
    renameError.textContent = "";

    try {
        const data = await postAction(
            "/api/rename",
            {
                path: image.path,
                new_name: newName,
                password
            }
        );

        if (data.access_token && image.category === "Others") {
            othersAccessToken = data.access_token;
            othersAccessExpiresAt = Date.now() + (30 * 60 * 1000);
        }

        closeRenameModal();

        if (image.category === "Others") {
            await loadProtectedGallery();
            renderGallery("Others");
            showStatus("Image renamed successfully.");
        } else {
            await loadPublicGallery();
            renderFilters();
            renderGallery(currentCategory);
            showStatus("Image renamed successfully.");
        }

        // Keep lightbox closed/reopened on the renamed image.
        if (image.category === "Others") {
            const idx = visibleImages.findIndex(
                item => item.path === data.path
            );
            if (idx >= 0) {
                currentIndex = idx;
                updateLightbox();
                setLightboxOpen(true);
            }
        } else {
            const idx = visibleImages.findIndex(
                item => item.path === data.path
            );
            if (idx >= 0) {
                currentIndex = idx;
                updateLightbox();
                setLightboxOpen(true);
            }
        }

    } catch (error) {
        console.error("Rename failed:", error);
        renameError.textContent = error.message;
    } finally {
        setButtonBusy(renameSaveBtn, "Save", false);
        renamePassword.value = "";
    }
}

// ============================================================
// MOVE
// ============================================================

function openMoveModal() {
    const image = currentImage();
    if (!image) return;

    moveCategory.innerHTML = "";

    allCategories
        .filter(category => category !== image.category)
        .forEach(category => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            moveCategory.appendChild(option);
        });

    movePassword.value = "";
    moveError.textContent = "";

    if (moveCategory.options.length === 0) {
        moveError.textContent = "There are no other folders available.";
        return;
    }

    setModalOpen(moveModal, true);
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => movePassword.focus());
}

function closeMoveModal() {
    setModalOpen(moveModal, false);
    moveCategory.innerHTML = "";
    movePassword.value = "";
    moveError.textContent = "";

    if (lightbox.classList.contains("open")) {
        document.body.style.overflow = "hidden";
    } else if (!document.querySelector(".action-modal.open")) {
        document.body.style.overflow = "";
    }
}

async function submitMove() {
    const image = currentImage();
    if (!image) return;

    const destinationCategory = moveCategory.value;
    const password = movePassword.value;

    if (!destinationCategory) {
        moveError.textContent = "Please select a destination category.";
        return;
    }

    if (!password) {
        moveError.textContent = "Please enter the gallery password.";
        return;
    }

    setButtonBusy(moveSaveBtn, "Moving...", true);
    moveError.textContent = "";

    try {
        const data = await postAction(
            "/api/move",
            {
                path: image.path,
                destination_category: destinationCategory,
                password
            }
        );

        if (destinationCategory === "Others" && data.access_token) {
            othersAccessToken = data.access_token;
            othersAccessExpiresAt = Date.now() + (30 * 60 * 1000);
        }

        closeMoveModal();
        closeLightbox();

        // Re-read category metadata in case folders have changed.
        await loadPublicGallery();

        if (currentCategory === "Others" && isOthersUnlocked()) {
            await loadProtectedGallery();
        }

        renderFilters();
        renderGallery(currentCategory === "Others" ? "Others" : currentCategory);

        showStatus(`Image moved to ${destinationCategory}.`);

    } catch (error) {
        console.error("Move failed:", error);
        moveError.textContent = error.message;
    } finally {
        setButtonBusy(moveSaveBtn, "Move", false);
        movePassword.value = "";
    }
}

// ============================================================
// DELETE
// ============================================================

function openDeleteModal() {
    const image = currentImage();
    if (!image) return;

    deleteFilename.textContent = image.name;
    deletePassword.value = "";
    deleteConfirmation.value = "";
    deleteError.textContent = "";

    setModalOpen(deleteModal, true);
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => deletePassword.focus());
}

function closeDeleteModal() {
    setModalOpen(deleteModal, false);
    deletePassword.value = "";
    deleteConfirmation.value = "";
    deleteError.textContent = "";

    if (lightbox.classList.contains("open")) {
        document.body.style.overflow = "hidden";
    } else if (!document.querySelector(".action-modal.open")) {
        document.body.style.overflow = "";
    }
}

async function submitDelete() {
    const image = currentImage();
    if (!image) return;

    const password = deletePassword.value;
    const confirmation = deleteConfirmation.value.trim();

    if (!password) {
        deleteError.textContent = "Please enter the gallery password.";
        return;
    }

    if (confirmation !== "DELETE") {
        deleteError.textContent = "Type DELETE exactly to confirm deletion.";
        return;
    }

    setButtonBusy(deleteConfirmBtn, "Deleting...", true);
    deleteError.textContent = "";

    try {
        await postAction(
            "/api/delete",
            {
                path: image.path,
                password,
                confirmation: "DELETE"
            }
        );

        closeDeleteModal();
        closeLightbox();

        if (image.category === "Others") {
            await loadProtectedGallery();
            renderGallery("Others");
            showStatus("Image deleted successfully.");
        } else {
            await loadPublicGallery();
            renderFilters();
            renderGallery(currentCategory);
            showStatus("Image deleted successfully.");
        }

    } catch (error) {
        console.error("Delete failed:", error);
        deleteError.textContent = error.message;
    } finally {
        setButtonBusy(deleteConfirmBtn, "Delete permanently", false);
        deletePassword.value = "";
    }
}

// ============================================================
// MODAL CLOSE / EVENTS
// ============================================================

function closeAllActionModals() {
    closeOthersModal();
    closeRenameModal();
    closeMoveModal();
    closeDeleteModal();
}

closeBtn.addEventListener("click", closeLightbox);
prevBtn.addEventListener("click", showPrevious);
nextBtn.addEventListener("click", showNext);
renameBtn.addEventListener("click", openRenameModal);
moveBtn.addEventListener("click", openMoveModal);
deleteBtn.addEventListener("click", openDeleteModal);

othersCancelBtn.addEventListener("click", closeOthersModal);
othersUnlockBtn.addEventListener("click", unlockOthers);

renameCancelBtn.addEventListener("click", closeRenameModal);
renameSaveBtn.addEventListener("click", submitRename);

moveCancelBtn.addEventListener("click", closeMoveModal);
moveSaveBtn.addEventListener("click", submitMove);

deleteCancelBtn.addEventListener("click", closeDeleteModal);
deleteConfirmBtn.addEventListener("click", submitDelete);

lightbox.addEventListener("click", event => {
    if (event.target === lightbox) {
        closeLightbox();
    }
});

for (const modal of [othersModal, renameModal, moveModal, deleteModal]) {
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            setModalOpen(modal, false);
        }
    });
}

othersPassword.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        unlockOthers();
    }
});

renameFilename.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        renamePassword.focus();
    }
});

renamePassword.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        submitRename();
    }
});

movePassword.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        submitMove();
    }
});

deleteConfirmation.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        submitDelete();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        if (document.querySelector(".action-modal.open")) {
            closeAllActionModals();
            return;
        }

        if (lightbox.classList.contains("open")) {
            closeLightbox();
        }

        return;
    }

    if (!lightbox.classList.contains("open")) {
        return;
    }

    if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrevious();
    } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
    }
});

// ============================================================
// START
// ============================================================

loadGallery();
