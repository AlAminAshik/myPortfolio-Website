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

//    API CONFIGURATION

const API_URL = "https://gallery.alaminn.com/api/images";
const API_BASE_URL = "https://gallery.alaminn.com";

// ============================================================
// DOM ELEMENTS
// ============================================================

const gallery = document.getElementById("gallery");
const filters = document.getElementById("filters");
const status = document.getElementById("status");

const lightbox = document.getElementById("lightbox");
const lightboxPanel = document.querySelector(".lightbox-panel");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxFilename = document.getElementById("lightboxFilename");

const closeBtn = document.getElementById("closeBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const renameBtn = document.getElementById("renameBtn");
const deleteBtn = document.getElementById("deleteBtn");

const renameModal = document.getElementById("renameModal");
const renameFilename = document.getElementById("renameFilename");
const renamePassword = document.getElementById("renamePassword");
const renameError = document.getElementById("renameError");
const renameCancelBtn = document.getElementById("renameCancelBtn");
const renameSaveBtn = document.getElementById("renameSaveBtn");

const deleteModal = document.getElementById("deleteModal");
const deleteFilename = document.getElementById("deleteFilename");
const deletePassword = document.getElementById("deletePassword");
const deleteConfirmation = document.getElementById("deleteConfirmation");
const deleteError = document.getElementById("deleteError");
const deleteCancelBtn = document.getElementById("deleteCancelBtn");
const deleteConfirmBtn = document.getElementById("deleteConfirmBtn");

// ============================================================
// GLOBAL STATE
// ============================================================

let images = [];
let visibleImages = [];
let currentIndex = 0;
let currentCategory = "all";

// ============================================================
// SMALL HELPERS
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
    } else if (!renameModal.classList.contains("open") && !deleteModal.classList.contains("open")) {
        document.body.style.overflow = "";
    }
}

function getCurrentImage() {
    return visibleImages[currentIndex] || null;
}

function clearActionFields() {
    renameFilename.value = "";
    renamePassword.value = "";
    renameError.textContent = "";

    deletePassword.value = "";
    deleteConfirmation.value = "";
    deleteError.textContent = "";
}

function setActionBusy(button, busyText, busy) {
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

function showStatus(message) {
    status.textContent = message;
}

function validateNewFilename(name, currentName) {
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

async function postAction(endpoint, payload) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        cache: "no-store"
    });

    let data = {};

    try {
        data = await response.json();
    } catch (error) {
        data = {};
    }

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
// LOAD GALLERY
// ============================================================

async function loadGallery(targetPath = null, reopenLightbox = false) {
    try {
        const selectedCategory = currentCategory;

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

        images = Array.isArray(data.images) ? data.images : [];

        const categories = Array.isArray(data.categories)
            ? data.categories
            : [];

        if (selectedCategory !== "all" && !categories.includes(selectedCategory)) {
            currentCategory = "all";
        }

        createFilters(categories, currentCategory);
        renderGallery(currentCategory);

        showStatus(
            `${images.length} image${images.length === 1 ? "" : "s"}`
        );

        if (reopenLightbox && targetPath) {
            const newIndex = visibleImages.findIndex(
                image => image.path === targetPath
            );

            if (newIndex >= 0) {
                currentIndex = newIndex;
                updateLightbox();
                setLightboxOpen(true);
            }
        }
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
// CATEGORY FILTERS
// ============================================================

function createFilters(categories, activeCategory) {
    filters.innerHTML = "";

    const allButton = createFilterButton(
        "All",
        "all",
        activeCategory === "all"
    );

    filters.appendChild(allButton);

    categories.forEach(category => {
        filters.appendChild(
            createFilterButton(
                category,
                category,
                activeCategory === category
            )
        );
    });
}

function createFilterButton(label, value, active) {
    const button = document.createElement("button");

    button.className = "filter-btn" + (active ? " active" : "");
    button.textContent = label;
    button.type = "button";

    button.addEventListener("click", () => {
        document
            .querySelectorAll(".filter-btn")
            .forEach(btn => btn.classList.remove("active"));

        button.classList.add("active");
        currentCategory = value;
        renderGallery(value);
    });

    return button;
}

// ============================================================
// RENDER GALLERY
// ============================================================

function renderGallery(category) {
    gallery.innerHTML = "";

    if (category === "all") {
        visibleImages = [...images];
    } else {
        visibleImages = images.filter(
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
    const image = getCurrentImage();

    if (!image) {
        return;
    }

    lightboxImage.src = image.url;
    lightboxImage.alt = image.name;
    lightboxFilename.textContent = `${image.name} • ${image.category}`;

    prevBtn.disabled = visibleImages.length <= 1;
    nextBtn.disabled = visibleImages.length <= 1;
}

function closeLightbox() {
    if (renameModal.classList.contains("open") || deleteModal.classList.contains("open")) {
        closeActionModals();
    }

    setLightboxOpen(false);
    lightboxImage.src = "";
    lightboxFilename.textContent = "";
}

function showPrevious() {
    if (visibleImages.length === 0) {
        return;
    }

    currentIndex = (
        currentIndex - 1 + visibleImages.length
    ) % visibleImages.length;

    updateLightbox();
}

function showNext() {
    if (visibleImages.length === 0) {
        return;
    }

    currentIndex = (
        currentIndex + 1
    ) % visibleImages.length;

    updateLightbox();
}

// ============================================================
// RENAME
// ============================================================

function openRenameModal() {
    const image = getCurrentImage();

    if (!image) {
        return;
    }

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
    } else {
        document.body.style.overflow = "";
    }
}

async function submitRename() {
    const image = getCurrentImage();

    if (!image) {
        return;
    }

    const newName = renameFilename.value.trim();
    const password = renamePassword.value;
    const validationError = validateNewFilename(newName, image.name);

    if (validationError) {
        renameError.textContent = validationError;
        return;
    }

    if (!password) {
        renameError.textContent = "Please enter the gallery password.";
        return;
    }

    setActionBusy(renameSaveBtn, "Saving...", true);
    renameError.textContent = "";

    try {
        const data = await postAction("/api/rename", {
            path: image.path,
            new_name: newName,
            password
        });

        const newPath = data.path || `${image.category}/${data.name || newName}`;

        closeRenameModal();
        showStatus("Image renamed successfully.");

        await loadGallery(newPath, true);
    } catch (error) {
        console.error("Rename failed:", error);
        renameError.textContent = error.message;
    } finally {
        setActionBusy(renameSaveBtn, "Save", false);
        renamePassword.value = "";
    }
}

// ============================================================
// DELETE
// ============================================================

function openDeleteModal() {
    const image = getCurrentImage();

    if (!image) {
        return;
    }

    deleteFilename.textContent = image.name;
    deletePassword.value = "";
    deleteConfirmation.value = "";
    deleteError.textContent = "";

    setModalOpen(deleteModal, true);
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
        deletePassword.focus();
    });
}

function closeDeleteModal() {
    setModalOpen(deleteModal, false);
    deletePassword.value = "";
    deleteConfirmation.value = "";
    deleteError.textContent = "";

    if (lightbox.classList.contains("open")) {
        document.body.style.overflow = "hidden";
    } else {
        document.body.style.overflow = "";
    }
}

async function submitDelete() {
    const image = getCurrentImage();

    if (!image) {
        return;
    }

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

    setActionBusy(deleteConfirmBtn, "Deleting...", true);
    deleteError.textContent = "";

    try {
        await postAction("/api/delete", {
            path: image.path,
            password,
            confirmation: "DELETE"
        });

        closeDeleteModal();
        closeLightbox();
        showStatus("Image deleted successfully.");

        await loadGallery();
    } catch (error) {
        console.error("Delete failed:", error);
        deleteError.textContent = error.message;
    } finally {
        setActionBusy(deleteConfirmBtn, "Delete permanently", false);
        deletePassword.value = "";
    }
}

function closeActionModals() {
    closeRenameModal();
    closeDeleteModal();
    clearActionFields();
}

// ============================================================
// EVENT LISTENERS
// ============================================================

closeBtn.addEventListener("click", closeLightbox);
prevBtn.addEventListener("click", showPrevious);
nextBtn.addEventListener("click", showNext);
renameBtn.addEventListener("click", openRenameModal);
deleteBtn.addEventListener("click", openDeleteModal);

renameCancelBtn.addEventListener("click", closeRenameModal);
renameSaveBtn.addEventListener("click", submitRename);

deleteCancelBtn.addEventListener("click", closeDeleteModal);
deleteConfirmBtn.addEventListener("click", submitDelete);

// Allow Enter to submit the rename form.
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

// Allow Enter in the delete confirmation field.
deleteConfirmation.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        submitDelete();
    }
});

// Close lightbox by clicking the backdrop.
lightbox.addEventListener("click", event => {
    if (event.target === lightbox) {
        closeLightbox();
    }
});

// Close action modals by clicking the backdrop.
renameModal.addEventListener("click", event => {
    if (event.target === renameModal) {
        closeRenameModal();
    }
});

deleteModal.addEventListener("click", event => {
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
});

// Keyboard controls.
document.addEventListener("keydown", event => {
    if (renameModal.classList.contains("open") || deleteModal.classList.contains("open")) {
        if (event.key === "Escape") {
            closeActionModals();
        }
        return;
    }

    if (!lightbox.classList.contains("open")) {
        return;
    }

    if (event.key === "Escape") {
        closeLightbox();
    } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrevious();
    } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
    }
});

// ============================================================
// START GALLERY
// ============================================================

loadGallery();
