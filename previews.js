(() => {
  const previews = [...document.querySelectorAll('.research-video')].map(video => {
    const button = document.querySelector(`[aria-controls="${video.id}"]`);
    const state = { video, button, visible: false, choice: null };
    video.defaultMuted = true;
    video.muted = true;
    button.hidden = false;

    const refreshButton = () => {
      const action = video.paused ? 'Play' : 'Pause';
      button.textContent = action;
      button.setAttribute('aria-label', `${action} ${button.dataset.project} preview`);
    };
    state.sync = () => {
      const enabled = state.choice ?? true;
      if (enabled && state.visible && !document.hidden) {
        video.play().catch(refreshButton);
      } else {
        video.pause();
      }
    };
    button.addEventListener('click', () => {
      state.choice = video.paused;
      state.sync();
    });
    video.addEventListener('loadeddata', () => state.sync());
    video.addEventListener('canplay', () => state.sync());
    video.addEventListener('play', refreshButton);
    video.addEventListener('pause', refreshButton);
    video.addEventListener('error', () => {
      button.hidden = true;
      const poster = document.createElement('img');
      poster.src = video.poster;
      poster.alt = video.getAttribute('aria-label');
      video.replaceWith(poster);
    });
    return state;
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const state = previews.find(item => item.video === entry.target);
      state.visible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
      state.sync();
    });
  }, { threshold: [0, 0.25] });
  previews.forEach(state => observer.observe(state.video));
  document.addEventListener('visibilitychange', () => previews.forEach(state => state.sync()));
  window.addEventListener('pageshow', () => previews.forEach(state => state.sync()));

  // Preserve the source clips' speed labels in the side-by-side transfer preview.
  const transfer = document.getElementById('preview-umi-bridge');
  fetch('assets/research/umi-transfer-timing.json')
    .then(response => {
      if (!response.ok) throw new Error('Timing metadata unavailable');
      return response.json();
    })
    .then(timing => {
      const refreshSpeed = () => {
        Object.entries(timing).forEach(([side, segments]) => {
          const segment = segments.find(item => transfer.currentTime >= item.start && transfer.currentTime < item.end);
          const label = document.querySelector(`[data-transfer-speed="${side}"]`);
          if (segment && label) label.textContent = segment.label;
        });
      };
      transfer.addEventListener('timeupdate', refreshSpeed);
      refreshSpeed();
    })
    .catch(() => {}); // The HTML retains descriptive labels if metadata cannot load.
})();
