/* Shared script for index and ask pages */
(function(){
  // Carousel
  const slidesEl = document.getElementById('slides');
  const slides = slidesEl ? slidesEl.children : [];
  let idx = 0;
  let audioPlayed = false;

  function showIndex(i){
    if(!slidesEl) return;
    idx = (i + slides.length) % slides.length;
    slidesEl.style.transform = `translateX(${ -idx * 100 }%)`;
  }

  function next(){ showIndex(idx+1) }
  function prev(){ showIndex(idx-1) }

  if(document.getElementById('next')) document.getElementById('next').addEventListener('click', next);
  if(document.getElementById('prev')) document.getElementById('prev').addEventListener('click', prev);

  // generated melody using WebAudio (attempt to start when carousel comes into view)
  let audioCtx = null;
  // try to load an external MP3 first (place at assets/audio/song.mp3)
  const audioEl = new Audio('assets/StephenSanchez-UntilIFoundYou.mp3');
  let audioAvailable = false;
  audioEl.addEventListener('canplaythrough', ()=>{ audioAvailable = true; });
  audioEl.addEventListener('error', ()=>{ audioAvailable = false; });
  // begin loading the audio so browser can fetch it early
  try{ audioEl.load(); }catch(e){}
  // audio control UI elements
  const audioControl = document.getElementById('audio-control');
  const audioToggle = document.getElementById('audio-toggle');
  function showAudioControls(){ if(audioControl){ audioControl.style.display='flex'; audioControl.setAttribute('aria-hidden','false'); } }
  function hideAudioControls(){ if(audioControl){ audioControl.style.display='none'; audioControl.setAttribute('aria-hidden','true'); } }
  function updateAudioButton(){ if(!audioToggle) return; audioToggle.textContent = audioEl && !audioEl.paused ? 'Pause music' : 'Play music'; }
  if(audioToggle){ audioToggle.addEventListener('click', ()=>{
    if(audioEl.paused){ audioEl.play().catch(()=>{}); } else { audioEl.pause(); }
    updateAudioButton();
  });
  }
  function startSong(){
    if(audioPlayed) return;
    audioPlayed = true;
    // if external audio loaded, play it
    if(audioAvailable){
      audioEl.play().then(()=>{
        updateAudioButton();
      }).catch(()=>{ /* autoplay blocked; show manual control */ showAudioControls(); });
      return;
    }
    // otherwise fallback to generated melody
    try{
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.value = 0.0001;
      osc.start();

      const notes = [440, 660, 880, 660, 440, 330];
      let t = audioCtx.currentTime + 0.05;
      notes.forEach((f,i)=>{
        osc.frequency.setValueAtTime(f, t + i*0.35);
        gain.gain.exponentialRampToValueAtTime(0.08, t + i*0.35 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + i*0.35 + 0.32);
      });
      setTimeout(()=>{try{osc.stop()}catch(e){}}, (notes.length*350)+400);
    }catch(e){console.warn('Audio failed', e)}
  }

  // Observe carousel to trigger slide reveal, autoplay advance and audio
  const carousel = document.getElementById('carousel');
  let autoAdvanceId = null;
  if(carousel && 'IntersectionObserver' in window){
    const slidesContainer = document.getElementById('slides');
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          // reveal slides
          if(slidesContainer) slidesContainer.classList.add('inview');
          // start audio and autoplay
          startSong();
          if(!autoAdvanceId){ autoAdvanceId = setInterval(next, 3800); }
          // try to auto-hide audio controls if audio started
          setTimeout(()=>{ if(!audioAvailable) showAudioControls(); }, 500);
        } else {
          if(slidesContainer) slidesContainer.classList.remove('inview');
          if(autoAdvanceId){ clearInterval(autoAdvanceId); autoAdvanceId = null; }
        }
      });
    },{threshold:0.45});
    io.observe(carousel);
  } else if(carousel){
    // fallback: reveal immediately and start autoplay
    const slidesContainer = document.getElementById('slides');
    if(slidesContainer) slidesContainer.classList.add('inview');
    startSong();
    autoAdvanceId = setInterval(next, 3800);
  }

  // Click me button navigates to ask page — use assign for clarity
  const clickme = document.getElementById('clickme');
  if(clickme) clickme.addEventListener('click', (e)=>{ e.preventDefault(); clickme.disabled=true; clickme.textContent='Opening...'; location.assign('ask.html'); });

  // If user taps anywhere and audio controls are visible, attempt to play (useful for Chrome autoplay policies)
  document.addEventListener('click', (ev)=>{
    if(audioControl && audioControl.getAttribute('aria-hidden')==='false'){
      audioEl.play().then(()=>{ hideAudioControls(); updateAudioButton(); }).catch(()=>{});
    }
  }, {passive:true});

  // If on ask page, run the typing/reveal flow
  if(document.querySelector('.ask-page')){
    const messageEl = document.getElementById('message');
    const finalEl = document.getElementById('final');
    const yes = document.getElementById('yes');
    const no = document.getElementById('no');

    const lines = [
      "You make ordinary moments feel like magic.",
      "From our laughs to our quiet talks—I'm grateful for every day.",
      "To more memories and growing as a couple."
    ];

    const revealDelay = parseInt(document.querySelector('.ask-page')?.dataset.revealDelay) || 900;

    function typeText(el, text, cb){
      el.textContent = '';
      let i=0; const iv = setInterval(()=>{ el.textContent += text[i++] || ''; if(i>text.length){ clearInterval(iv); cb(); }}, 36);
    }

    function runLines(i){
      if(i>=lines.length){
        setTimeout(()=>{ finalEl.hidden=false; finalEl.classList.add('show'); document.getElementById('line-a').style.opacity=1; setTimeout(()=>document.getElementById('line-b').style.opacity=1,500); },revealDelay);
        return;
      }
      const p = document.createElement('p'); p.className='line'; messageEl.appendChild(p);
      typeText(p, lines[i], ()=> setTimeout(()=> runLines(i+1), revealDelay));
    }

    runLines(0);

    // No button behavior: dodges on hover, and cycles messages on clicks
    function moveNo(){
      const parent = no.parentElement;
      const pw = parent.offsetWidth, ph = parent.offsetHeight;
      const nx = Math.max(8, Math.random()*(pw-80));
      const ny = Math.max(0, Math.random()*(ph-40));
      no.style.transform = `translate(${nx - (parent.offsetWidth - 120)}px, ${ny}px)`;
    }

    no.addEventListener('mouseenter', moveNo);

    const noMessages = ["Oops — I think that was a mistake.", "Not an option."];
    let noClicks = 0;
    no.addEventListener('click', (e)=>{
      e.preventDefault();
      moveNo();
      // append the alternating message
      const msg = noMessages[ noClicks % noMessages.length ];
      const p = document.createElement('p'); p.className='no-msg'; messageEl.appendChild(p);
      typeText(p, msg, ()=>{});
      noClicks++;
    });

    yes.addEventListener('click', ()=>{
      // show nicer modal with share options
      launchConfetti();
      showYesModal();
    });

    // Modal handlers
    function showYesModal(){
      const modal = document.getElementById('yes-modal');
      if(!modal) return;
      // show via class so CSS controls visibility
      modal.hidden = false;
      modal.classList.add('show');
      // wire actions
      const copyBtn = document.getElementById('copy-link');
      const shareBtn = document.getElementById('web-share');
      const tweetBtn = document.getElementById('tweet');
      const closeBtn = document.getElementById('modal-close');
      const note = document.getElementById('modal-note');
      if(copyBtn) copyBtn.onclick = ()=>{ navigator.clipboard?.writeText(location.href).then(()=>{ if(note) note.textContent='Link copied to clipboard'; }); };
      if(shareBtn) shareBtn.onclick = ()=>{ if(navigator.share){ navigator.share({title:document.title,text:'She said YES! 💖',url:location.href}).catch(()=>{ if(note) note.textContent='Share cancelled'; }); } else { if(note) note.textContent='Share not supported on this device'; } };
      if(tweetBtn) tweetBtn.onclick = ()=>{ window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent('She said YES! 💖')+'&url='+encodeURIComponent(location.href),'_blank'); };
      if(closeBtn) closeBtn.onclick = ()=>{ modal.classList.remove('show'); modal.hidden=true; };
    }

    function launchConfetti(){
      const count = 30;
      for(let i=0;i<count;i++){
        const el=document.createElement('div');
        el.className='confetti';
        el.style.position='fixed'; el.style.left=(Math.random()*100)+'%'; el.style.top='-10px';
        el.style.width='10px'; el.style.height='14px'; el.style.background=['#ff6b81','#ffd166','#36d399','#60a5fa'][i%4];
        el.style.opacity='0.95'; el.style.transform=`rotate(${Math.random()*360}deg)`;
        document.body.appendChild(el);
        const dur = 2000 + Math.random()*1200;
        el.animate([{transform:el.style.transform, top:'-10px'},{transform:`translateY(${window.innerHeight+50}px) rotate(${Math.random()*720}deg)` , top:`${window.innerHeight+50}px`}],{duration:dur, easing:'cubic-bezier(.2,.7,.2,1)'});
        setTimeout(()=>el.remove(), dur+100);
      }
    }
  }

  // init visible index
  showIndex(0);
})();
