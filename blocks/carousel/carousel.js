import { fetchPlaceholders } from '../../scripts/placeholders.js';

let carouselId = 0;

export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-${carouselId}`);

  const placeholders = await fetchPlaceholders();

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');

  // Create slides container
  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-slides');

  container.append(slidesWrapper);
  block.append(container);

  // Prepare slides from EDS reference fields
  const slides = [];
  ['slide1', 'slide2', 'slide3'].forEach((slideName, idx) => {
    const slideData = block.querySelector(`[data-name="${slideName}"]`);
    if (slideData) {
      const imgRef = slideData.querySelector('[data-name$="Image"]');
      if (imgRef && imgRef.dataset && imgRef.dataset.href) {
        const li = document.createElement('li');
        li.classList.add('carousel-slide');
        li.dataset.slideIndex = idx;

        const div = document.createElement('div');
        div.classList.add('carousel-slide-image');

        const img = document.createElement('img');
        img.src = imgRef.dataset.href; // Franklin stores uploaded image URL in data-href
        img.alt = ''; // optional: add alt if needed

        div.append(img);
        li.append(div);
        slidesWrapper.append(li);
        slides.push(li);
      }
    }
  });

  // ----------------- Function Declarations -----------------

  function updateActiveSlide(slide) {
    const slideIndex = parseInt(slide.dataset.slideIndex, 10);
    block.dataset.activeSlide = slideIndex;

    slides.forEach((s, idx) => {
      s.setAttribute('aria-hidden', idx !== slideIndex);
    });

    const indicators = block.querySelectorAll('.carousel-slide-indicator button');
    indicators.forEach((btn, idx) => {
      if (idx === slideIndex) {
        btn.setAttribute('disabled', true);
        btn.setAttribute('aria-current', true);
      } else {
        btn.removeAttribute('disabled');
        btn.removeAttribute('aria-current');
      }
    });
  }

  function showSlide(slideIndex = 0) {
    let idx = slideIndex;
    if (idx < 0) idx = slides.length - 1;
    if (idx >= slides.length) idx = 0;

    updateActiveSlide(slides[idx]);
    block.querySelector('.carousel-slides').scrollTo({
      top: 0,
      left: slides[idx].offsetLeft,
      behavior: 'smooth',
    });
  }

  function createIndicators() {
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');

    const ol = document.createElement('ol');
    ol.classList.add('carousel-slide-indicators');
    nav.append(ol);
    block.append(nav);

    slides.forEach((slide, idx) => {
      const li = document.createElement('li');
      li.classList.add('carousel-slide-indicator');
      li.dataset.targetSlide = idx;
      li.innerHTML = `<button type="button" aria-label="Show slide ${idx + 1}"></button>`;
      ol.append(li);
    });
  }

  function createNavButtons() {
    const navButtons = document.createElement('div');
    navButtons.classList.add('carousel-navigation-buttons');
    navButtons.innerHTML = `
      <button type="button" class="slide-prev" aria-label="Previous Slide"></button>
      <button type="button" class="slide-next" aria-label="Next Slide"></button>
    `;
    container.append(navButtons);
  }

  function bindEvents() {
    block.querySelector('.slide-prev')?.addEventListener('click', () => {
      showSlide(parseInt(block.dataset.activeSlide, 10) - 1);
    });
    block.querySelector('.slide-next')?.addEventListener('click', () => {
      showSlide(parseInt(block.dataset.activeSlide, 10) + 1);
    });

    block.querySelectorAll('.carousel-slide-indicator button').forEach((btn, idx) => {
      btn.addEventListener('click', () => showSlide(idx));
    });
  }

  // ----------------- Initialize Carousel -----------------

  if (slides.length > 1) {
    createIndicators();
    createNavButtons();
    bindEvents();
  }

  if (slides.length > 0) {
    block.dataset.activeSlide = 0;
    slides[0].setAttribute('aria-hidden', 'false');
  }
}
