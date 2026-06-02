const navbarToggle = document.getElementById("navbar_toggle");
const mobileMenu = document.querySelector(".mobile_menu_container");

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

// highlight works on navbar when scrolled down
window.addEventListener('scroll', () => {
  const targetText = document.getElementById('works_active');
  
  // Check if the user has scrolled down more than 200px
  if (window.scrollY > 200) {
    targetText.classList.add('decorated');
  } else {
    targetText.classList.remove('decorated');
  }
});
