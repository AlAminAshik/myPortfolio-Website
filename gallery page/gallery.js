
//    CONFIGURATION


const API_URL =
    "https://gallery.alaminn.com/api/images";



//    DOM ELEMENTS


const gallery =
    document.getElementById("gallery");

const filters =
    document.getElementById("filters");

const status =
    document.getElementById("status");

const lightbox =
    document.getElementById("lightbox");

const lightboxImage =
    document.getElementById("lightboxImage");

const closeBtn =
    document.getElementById("closeBtn");

const prevBtn =
    document.getElementById("prevBtn");

const nextBtn =
    document.getElementById("nextBtn");



//    GLOBAL STATE


let images = [];
let visibleImages = [];
let currentIndex = 0;



//    LOAD GALLERY


async function loadGallery() {

    try {

        /*
         * Timestamp prevents the browser from using
         * an old API response.
         */

        const response =
            await fetch(
                API_URL +
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


        images =
            Array.isArray(data.images)
                ? data.images
                : [];


        createFilters(
            data.categories || []
        );


        renderGallery("all");


        status.textContent =
            `${images.length} image${
                images.length === 1
                    ? ""
                    : "s"
            }`;

    }


    catch (error) {

        console.error(
            "Gallery loading failed:",
            error
        );


        status.textContent =
            "Unable to load gallery";


        gallery.innerHTML = `
            <div class="message">
                Gallery could not be loaded.
            </div>
        `;

    }

}




   //    CREATE CATEGORY FILTERS


function createFilters(categories) {

    filters.innerHTML = "";


    /*
     * ALL button
     */

    const allButton =
        createFilterButton(
            "All",
            "all",
            true
        );


    filters.appendChild(
        allButton
    );


    /*
     * Category buttons
     */

    categories.forEach(
        category => {

            const button =
                createFilterButton(
                    category,
                    category,
                    false
                );


            filters.appendChild(
                button
            );

        }
    );

}



   //    CREATE FILTER BUTTON


function createFilterButton(
    label,
    value,
    active
) {

    const button =
        document.createElement("button");


    button.className =
        "filter-btn" +
        (
            active
                ? " active"
                : ""
        );


    button.textContent =
        label;


    button.addEventListener(
        "click",
        () => {

            /*
             * Remove active state
             * from all buttons.
             */

            document
                .querySelectorAll(
                    ".filter-btn"
                )
                .forEach(
                    btn =>
                        btn.classList.remove(
                            "active"
                        )
                );


            /*
             * Activate clicked button.
             */

            button.classList.add(
                "active"
            );


            /*
             * Render selected category.
             */

            renderGallery(value);

        }
    );


    return button;

}



//    RENDER GALLERY


function renderGallery(category) {

    gallery.innerHTML = "";


    /*
     * Determine which images
     * should be displayed.
     */

    if (category === "all") {

        visibleImages =
            [...images];

    }

    else {

        visibleImages =
            images.filter(
                image =>
                    image.category ===
                    category
            );

    }


    /*
     * No images
     */

    if (
        visibleImages.length === 0
    ) {

        gallery.innerHTML = `
            <div class="message">
                No images in this category.
            </div>
        `;

        return;
    }


    /*
     * Create cards.
     */

    visibleImages.forEach(
        (image, index) => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "card";


            /* --------------------------
               IMAGE
            -------------------------- */

            const img =
                document.createElement(
                    "img"
                );


            img.src =
                image.url;


            img.alt =
                image.name;


            /*
             * Browser lazy loading.
             */

            img.loading =
                "lazy";


            img.decoding =
                "async";


            /* --------------------------
               OVERLAY
            -------------------------- */

            const overlay =
                document.createElement(
                    "div"
                );


            overlay.className =
                "overlay";


            /* --------------------------
               FILE NAME
            -------------------------- */

            const filename =
                document.createElement(
                    "div"
                );


            filename.className =
                "filename";


            filename.textContent =
                image.name;


            /* --------------------------
               CATEGORY
            -------------------------- */

            const categoryElement =
                document.createElement(
                    "div"
                );


            categoryElement.className =
                "category";


            categoryElement.textContent =
                image.category;


            /* --------------------------
               BUILD CARD
            -------------------------- */

            overlay.appendChild(
                filename
            );


            overlay.appendChild(
                categoryElement
            );


            card.appendChild(
                img
            );


            card.appendChild(
                overlay
            );


            /* --------------------------
               OPEN LIGHTBOX
            -------------------------- */

            card.addEventListener(
                "click",
                () =>
                    openLightbox(index)
            );


            gallery.appendChild(
                card
            );

        }
    );

}



//    OPEN LIGHTBOX


function openLightbox(index) {

    if (
        index < 0 ||
        index >= visibleImages.length
    ) {

        return;

    }


    currentIndex =
        index;


    updateLightbox();


    lightbox.classList.add(
        "open"
    );


    /*
     * Prevent the page behind
     * the lightbox from scrolling.
     */

    document.body.style.overflow =
        "hidden";

}



//    UPDATE LIGHTBOX IMAGE


function updateLightbox() {

    const image =
        visibleImages[currentIndex];


    if (!image) {
        return;
    }


    lightboxImage.src =
        image.url;


    lightboxImage.alt =
        image.name;

}



//    CLOSE LIGHTBOX


function closeLightbox() {

    lightbox.classList.remove(
        "open"
    );


    lightboxImage.src =
        "";


    document.body.style.overflow =
        "";

}



//    PREVIOUS IMAGE


function showPrevious() {

    if (
        visibleImages.length === 0
    ) {

        return;

    }


    currentIndex =
        (
            currentIndex -
            1 +
            visibleImages.length
        ) %
        visibleImages.length;


    updateLightbox();

}



//    NEXT IMAGE


function showNext() {

    if (
        visibleImages.length === 0
    ) {

        return;

    }


    currentIndex =
        (
            currentIndex +
            1
        ) %
        visibleImages.length;


    updateLightbox();

}



//    EVENT LISTENERS


closeBtn.addEventListener(
    "click",
    closeLightbox
);


prevBtn.addEventListener(
    "click",
    showPrevious
);


nextBtn.addEventListener(
    "click",
    showNext
);


/*
 * Close when clicking the
 * dark area outside the image.
 */

lightbox.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            lightbox
        ) {

            closeLightbox();

        }

    }
);


/*
 * Keyboard controls.
 */

document.addEventListener(
    "keydown",
    event => {

        if (
            !lightbox.classList.contains(
                "open"
            )
        ) {

            return;

        }


        if (
            event.key === "Escape"
        ) {

            closeLightbox();

        }


        if (
            event.key === "ArrowLeft"
        ) {

            showPrevious();

        }


        if (
            event.key === "ArrowRight"
        ) {

            showNext();

        }

    }
);



//    START GALLERY


loadGallery();