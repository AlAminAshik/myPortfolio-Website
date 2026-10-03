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


(function() {
    emailjs.init({
        publicKey: "CyTEf38krNqlMHF21"
    });
})();
window.onload = function() {
    document.getElementById('contact_form').addEventListener('submit', function(event) {
        event.preventDefault();
        // these IDs from the previous steps
        emailjs.sendForm('service_vnstxq8', 'template_h0vzzlk', this)
            .then(() => {
                console.log('SUCCESS!');
                document.getElementById('status-display').textContent = 'Message sent successfully!';
                document.getElementById('status-display').className = 'status-box status-success';
                document.getElementById('status-display').classList.remove('hidden');
            }, (error) => {
                console.log('Failed unexpectedly. Contact me directly!', error);
                document.getElementById('status-display').textContent = 'Failed to send message. Please contact me directly!';
                document.getElementById('status-display').className = 'status-box status-error';
                document.getElementById('status-display').classList.remove('hidden');
            });
    });
}
