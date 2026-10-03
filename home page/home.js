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
  
  // 1. Expand navbar to full screen width after scrolling down 50px
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  // 2. Highlight works menu link when scrolled down past 200px
  if (window.scrollY > 200 && window.scrollY < 1000) {
    targetText.classList.add('decorated');
  } else {
    targetText.classList.remove('decorated');
  }
});


// gallery section starts here

const HOME_GALLERY_API =
    "https://gallery.alaminn.com/api/images";

const homeGalleryGrid =
    document.getElementById(
        "homeGalleryGrid"
    );

 /*
 * The newest image from each category
 * is used.
 */

const HOME_GALLERY_PREFERRED_CATEGORIES = [
    "Circuit Works",
    "Devices Made",
    "3d Works",
    "Hardware Works",
    "Infrastructure Works",
    "Interior Works"
];

//    LOAD SELECTED GALLERY IMAGES
async function loadHomeGalleryPreview() {
    if (!homeGalleryGrid) {
        return;
    }
    try {
        const response =
            await fetch(
                HOME_GALLERY_API +
                "?t=" +
                Date.now(),
                {
                    cache: "no-store"
                }
            );
        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }
        const data =
            await response.json();
        const allImages =
            Array.isArray(data.images)
                ? data.images
                : [];
        /*
         * Select one image from each
         * preferred category.
         */
        const selected = [];
        HOME_GALLERY_PREFERRED_CATEGORIES
            .forEach(category => {
                const match =
                    allImages.find(
                        image =>
                            image.category ===
                            category
                    );
                if (match) {
                    selected.push(
                        match
                    );
                }
            });

        /*
         * Limit homepage preview
         * to six images.
         */

        const previewImages =
            selected.slice(0, 6);

        renderHomeGalleryPreview(
            previewImages
        );
    }

    catch (error) {
        console.error(
            "Homepage gallery preview failed:",
            error
        );
        homeGalleryGrid.innerHTML = `
            <div
                class="home_gallery_loading"
            >
                Gallery preview is
                temporarily unavailable.
            </div>
        `;
    }
}

//    RENDER HOMEPAGE GALLERY
function renderHomeGalleryPreview(
    images
) {
    homeGalleryGrid.innerHTML = "";
    if (
        images.length === 0
    ) {
        homeGalleryGrid.innerHTML = `
            <div
                class="home_gallery_loading"
            >
                No gallery images available yet.
            </div>
        `;
        return;
    }

    images.forEach(
        image => {
            /*
             * Each card links to the
             * complete gallery.
             */
            const card =
                document.createElement("a");
            card.href =
                "gallery.html";
            card.className =
                "home_gallery_card";
            card.setAttribute(
                "aria-label",
                `View ${image.name.replace(/\.[^/.]+$/, "")}`
            );
            //    IMAGE
            const img =
                document.createElement("img");
            img.src =
                image.url;
            img.alt =
                image.name;
            img.loading =
                "lazy";
            img.decoding =
                "async";

            //    CARD INFORMATION
            const info =
                document.createElement("div");
            info.className =
                "home_gallery_card_info";
            const category =
                document.createElement("div");
            category.className =
                "home_gallery_card_category";
            category.textContent =
                image.category;
            const name =
                document.createElement("div");
            name.className =
                "home_gallery_card_name";
            name.textContent =
                image.name;
            info.appendChild(
                category
            );
            info.appendChild(
                name
            );
            card.appendChild(
                img
            );
            card.appendChild(
                info
            );
            homeGalleryGrid.appendChild(
                card
            );
        }
    );
}
//    START gallery
loadHomeGalleryPreview();
