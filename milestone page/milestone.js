const navbarToggle = document.getElementById("navbar_toggle");
const mobileMenu = document.querySelector(".mobile_menu_container");
const navbar = document.querySelector(".navbar"); // Grab the navbar element

navbarToggle.addEventListener("click", () => {
    mobileMenu.classList.toggle("active");
});

document.addEventListener("click", (e) => {
    if (!mobileMenu.contains(e.target) && !navbarToggle.contains(e.target)) {
        mobileMenu.classList.remove("active");
    }
});

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