// Main JavaScript file for Superpowers website

document.addEventListener('DOMContentLoaded', function () {
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav a[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add hover effects to CTA buttons
    const ctaButtons = document.querySelectorAll('.cta-button, .cta-button-secondary, .header-cta');

    ctaButtons.forEach(button => {
        button.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-2px)';
            this.style.transition = 'transform 0.2s ease';
        });

        button.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add scroll effect to header
    const header = document.querySelector('.header');

    window.addEventListener('scroll', function () {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            header.style.background = 'var(--bg-white)';
            header.style.backdropFilter = 'none';
        }
    });

    // Add animation to feature cards on scroll
    const featureCards = document.querySelectorAll('.feature-card, .capability-card');

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Overscroll gradient blocks effect
    const overscrollBlocks = document.querySelector('.overscroll-blocks');
    const gradientBlocks = document.querySelectorAll('.gradient-block');
    let isOverscrolling = false;
    let animationEndCount = 0;

    // Listen for transition end on all gradient blocks
    gradientBlocks.forEach(block => {
        block.addEventListener('transitionend', function () {
            animationEndCount++;
            // If all blocks have finished transitioning, hide the container
            if (animationEndCount >= gradientBlocks.length) {
                overscrollBlocks.classList.remove('active');
                animationEndCount = 0;
            }
        });
    });

    // Reliable overscroll detection using scrollHeight calculation
    window.addEventListener('scroll', function () {
        const element = document.documentElement;
        const isAtBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 1;

        if (isAtBottom && !isOverscrolling) {
            // Trigger overscroll effect
            isOverscrolling = true;
            animationEndCount = 0; // Reset counter
            overscrollBlocks.classList.add('active');
        } else if (!isAtBottom && isOverscrolling) {
            // Hide overscroll effect when not at bottom
            isOverscrolling = false;
            overscrollBlocks.classList.remove('active');
        }
    });

    // Console welcome message
    console.log('🚀 Superpowers website loaded successfully!');
    console.log('💡 Check out our GitHub: https://github.com/superhq-ai/superpowers');
}); 
