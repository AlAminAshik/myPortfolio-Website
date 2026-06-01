
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