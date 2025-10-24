(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const h of document.querySelectorAll('link[rel="modulepreload"]'))c(h);new MutationObserver(h=>{for(const g of h)if(g.type==="childList")for(const D of g.addedNodes)D.tagName==="LINK"&&D.rel==="modulepreload"&&c(D)}).observe(document,{childList:!0,subtree:!0});function m(h){const g={};return h.integrity&&(g.integrity=h.integrity),h.referrerPolicy&&(g.referrerPolicy=h.referrerPolicy),h.crossOrigin==="use-credentials"?g.credentials="include":h.crossOrigin==="anonymous"?g.credentials="omit":g.credentials="same-origin",g}function c(h){if(h.ep)return;h.ep=!0;const g=m(h);fetch(h.href,g)}})();document.addEventListener("DOMContentLoaded",()=>{const s={modal:document.getElementById("trackModal"),searchInput:document.getElementById("searchInput"),content:document.querySelector(".content"),logo:document.getElementById("logo"),muteButton:document.getElementById("muteButton"),favoriteButton:document.getElementById("favoriteButton"),filterSelect:document.getElementById("filterSelect"),randomButton:document.getElementById("randomButton")},e={tracksData:[],loadedTracks:0,currentTrackIndex:-1,currentFilteredTracks:[],isMuted:localStorage.getItem("isMuted")==="true",currentPreviewUrl:"",currentTrack:null,favorites:JSON.parse(localStorage.getItem("favoriteTracks")||"[]"),loopTimeout:null,countdownInterval:null,pendingAudioPlay:!1,fadeInterval:null,infiniteScrollHandler:null,forceFilteredView:!1},m={tracksPerPage:20,initialLoad:40,audioVolume:.2,marqueeObserverMargin:"100px",resizeDebounceDelay:250,marqueeCheckDelay:150,loopDelay:3e3,fadeDuration:500},c=new Audio;c.volume=m.audioVolume;const h=new IntersectionObserver(t=>{t.forEach(a=>{a.isIntersecting?setTimeout(()=>{a.target.querySelectorAll(".marquee-text").forEach(x)},m.marqueeCheckDelay):a.target.querySelectorAll(".marquee-text").forEach(q)})},{rootMargin:m.marqueeObserverMargin});_(),X(),g(),e.isMuted&&(c.volume=0);function g(){const t=s.muteButton.querySelector(".volume-icon"),a=s.muteButton.querySelector(".muted-icon");e.isMuted?(t.style.display="none",a.style.display="block"):(t.style.display="block",a.style.display="none")}function D(){e.isMuted=!e.isMuted,c.volume=e.isMuted?0:m.audioVolume,localStorage.setItem("isMuted",e.isMuted),g()}function C(t){e.fadeInterval&&(clearInterval(e.fadeInterval),e.fadeInterval=null),c.volume=0;const a=20,n=t/a,r=m.audioVolume/a;let l=0;e.fadeInterval=setInterval(()=>{l++,l>=a||e.isMuted?(c.volume=e.isMuted?0:m.audioVolume,clearInterval(e.fadeInterval),e.fadeInterval=null):c.volume=r*l},n)}function U(t,a){e.fadeInterval&&(clearInterval(e.fadeInterval),e.fadeInterval=null);const n=20,r=t/n,l=c.volume,i=l/n;let u=0;e.fadeInterval=setInterval(()=>{u++,u>=n?(c.volume=0,clearInterval(e.fadeInterval),e.fadeInterval=null,a&&a()):c.volume=l-i*u},r)}function A(){e.loopTimeout&&clearTimeout(e.loopTimeout);const t=(c.duration-c.currentTime)*1e3-m.fadeDuration;t>0&&(e.loopTimeout=setTimeout(()=>{e.currentPreviewUrl&&s.modal.style.display==="flex"&&U(m.fadeDuration,()=>{setTimeout(()=>{e.currentPreviewUrl&&s.modal.style.display==="flex"&&(c.currentTime=0,c.play().then(()=>{e.pendingAudioPlay=!1,C(m.fadeDuration),A()}).catch(a=>{a.name==="NotAllowedError"?(console.log("Waiting for user interaction to resume audio..."),e.pendingAudioPlay=!0):console.error("Error playing audio:",a)}))},m.loopDelay)})},t))}function P(t){e.currentTrackIndex=e.currentFilteredTracks.findIndex(a=>a.title===t.title&&a.artist===t.artist),e.currentTrack=t,$(t)}function $(t){const{id:a,title:n,artist:r,releaseYear:l,cover:i,bpm:u,duration:v,difficulties:p,createdAt:w,lastFeatured:y,previewUrl:S}=t;s.modal.querySelector("#modalCover").src=i,s.modal.querySelector("#modalTitle").textContent=n,s.modal.querySelector("#modalArtist").textContent=r,requestAnimationFrame(()=>{const b=s.modal.querySelector("#modalTitle"),E=s.modal.querySelector("#modalArtist");x(b),x(E)});const k=s.modal.querySelector("#modalLabels");k.innerHTML="";const B=N(t,!0);if(k.appendChild(B),e.favorites.includes(a)?s.favoriteButton.classList.add("favorited"):s.favoriteButton.classList.remove("favorited"),s.modal.querySelector("#modalDetails").innerHTML=`
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Duration</span>
          <span class="detail-value">${v}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">BPM</span>
          <span class="detail-value">${u}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Release Year</span>
          <span class="detail-value">${l}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Created</span>
          <span class="detail-value">${new Date(w).toLocaleDateString()}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Last Featured</span>
          <span class="detail-value">${y?new Date(y).toLocaleDateString():"Never"}</span>
        </div>
      </div>
    `,J(p,s.modal.querySelector("#modalDifficulties")),s.modal.style.display="flex",s.modal.classList.add("modal-open"),document.body.classList.add("modal-open"),S){e.loopTimeout&&(clearTimeout(e.loopTimeout),e.loopTimeout=null),e.fadeInterval&&(clearInterval(e.fadeInterval),e.fadeInterval=null),c.pause(),c.currentTime=0,c.volume=0,c.src=S,e.currentPreviewUrl=S,c.load();const b=c.play();b!==void 0&&b.then(()=>{console.log("Audio playing successfully"),e.pendingAudioPlay=!1,C(m.fadeDuration),A()}).catch(E=>{E.name!=="AbortError"&&(E.name==="NotAllowedError"?(console.log("Waiting for user interaction to play audio..."),e.pendingAudioPlay=!0):(console.error("Failed to play audio:",E),console.log("Preview URL:",S)))})}else console.warn("No preview URL for track:",n);z()}function H(){if(!e.currentTrack)return;const t=e.currentTrack.id,a=e.favorites.indexOf(t);a>-1?(e.favorites.splice(a,1),s.favoriteButton.classList.remove("favorited")):(e.favorites.push(t),s.favoriteButton.classList.add("favorited")),localStorage.setItem("favoriteTracks",JSON.stringify(e.favorites)),s.filterSelect.value==="favorites"?T():s.filterSelect.value==="all"&&!s.searchInput.value&&O()}function z(){const t=s.modal.querySelector(".modal-prev"),a=s.modal.querySelector(".modal-next");t.style.display=e.currentTrackIndex>0?"block":"none",a.style.display=e.currentTrackIndex<e.currentFilteredTracks.length-1?"block":"none"}function M(){s.modal.style.display="none",s.modal.classList.remove("modal-open"),document.body.classList.remove("modal-open"),e.loopTimeout&&(clearTimeout(e.loopTimeout),e.loopTimeout=null),U(m.fadeDuration,()=>{c.pause(),c.currentTime=0,c.src="",e.currentPreviewUrl=""})}function F(t){const a=e.currentTrackIndex+t;a>=0&&a<e.currentFilteredTracks.length&&(e.loopTimeout&&(clearTimeout(e.loopTimeout),e.loopTimeout=null),e.currentTrackIndex=a,e.currentTrack=e.currentFilteredTracks[a],$(e.currentFilteredTracks[a]))}function q(t){t&&(t.classList.remove("scrolling"),t.style.setProperty("--scroll-distance","0px"),t.style.setProperty("--marquee-duration","10s"))}function x(t){if(!t?.parentElement)return;const a=t.parentElement;q(t),requestAnimationFrame(()=>{requestAnimationFrame(()=>{const n=a.clientWidth,r=t.scrollWidth;if(r>n+5){const l=r-n;t.style.setProperty("--scroll-distance",`-${l}px`);const u=Math.max(5,Math.min(18,l/35)),v=Math.random()*2;t.style.setProperty("--marquee-delay",`${v}s`),t.style.setProperty("--marquee-duration",`${u}s`),t.offsetWidth,t.classList.add("scrolling")}})})}function L(t){const a=document.createElement("div");a.classList.add("jam-track");const n=document.createElement("div");n.className="loading-spinner";const r=new Image;return r.src=t.cover,r.alt=`${t.title} Cover`,r.style.display="none",r.onload=()=>{n.remove(),r.style.display="",r.classList.add("loaded")},a.innerHTML=`
      <div class="track-text-content">
        <div class="marquee-container">
          <h2 class="marquee-text" translate="no">${t.title}</h2>
        </div>
        <div class="marquee-container">
          <p class="marquee-text" translate="no">${t.artist}</p>
        </div>
      </div>
    `,a.insertBefore(n,a.firstChild),a.insertBefore(r,a.firstChild),a.appendChild(N(t)),a.addEventListener("click",()=>P(t)),a}function V(t){const a=document.createElement("div");return a.textContent=t,a.innerHTML.trim()}function T(t=!0){const a=s.searchInput.value,n=V(a).toLowerCase(),r=s.filterSelect.value,l=e.tracksData.filter(i=>i.title.toLowerCase().includes(n)||i.artist.toLowerCase().includes(n)?j(i,r):!1);e.currentFilteredTracks=W(l,r),Y(n,r,t)}function j(t,a){switch(a){case"featured":return t.featured;case"rotated":const n=new Date;n.setUTCHours(0,0,0,0);const r=new Date(n);return r.setDate(r.getDate()-1),t.lastFeatured&&new Date(t.lastFeatured)>=r&&new Date(t.lastFeatured)<n&&!t.featured;case"new":const l=new Date(Date.now()-10080*60*1e3);return new Date(t.createdAt)>l;case"favorites":return e.favorites.includes(t.id);default:return!0}}function O(){const t=new Date,a=new Date(t-10080*60*1e3),n=e.tracksData.filter(o=>new Date(o.createdAt)>a),r=e.tracksData.filter(o=>o.featured).sort((o,d)=>{const f=o.lastFeatured?new Date(o.lastFeatured):new Date(0);return(d.lastFeatured?new Date(d.lastFeatured):new Date(0))-f}),l=e.tracksData.filter(o=>{if(!o.lastFeatured||o.featured)return!1;const d=new Date(o.lastFeatured),f=new Date(t-10080*60*1e3);return d>=f}).sort((o,d)=>{const f=new Date(o.lastFeatured);return new Date(d.lastFeatured)-f}),i=e.tracksData.filter(o=>e.favorites.includes(o.id)).sort((o,d)=>{const f=e.favorites.indexOf(o.id);return e.favorites.indexOf(d.id)-f}),u=e.tracksData.filter(o=>{const d=new Date(o.createdAt)>a,f=o.featured,I=!o.featured&&o.lastFeatured,ee=e.favorites.includes(o.id);return!d&&!f&&!I&&!ee}).sort((o,d)=>new Date(d.createdAt)-new Date(o.createdAt)),v=new Date;v.setUTCDate(v.getUTCDate()+1),v.setUTCHours(0,0,0,0);const p=new Date;p.setUTCHours(0,0,0,0);const w=new Date(p);w.setUTCMinutes(2);let y="";if(t>=p&&t<=w)y="Updating...";else{const o=v-t,d=Math.floor(o/(1e3*60*60)),f=Math.floor(o%(1e3*60*60)/(1e3*60)),I=Math.floor(o%(1e3*60)/1e3);f===0&&d===0?y=`${I}s`:y=`${d}h ${f}m`}const k=new Date("2025-11-29T08:00:00Z")-t,B=Math.floor(k/(1e3*60*60*24)),R=Math.floor(k%(1e3*60*60*24)/(1e3*60*60)),b=`${B}d ${R}h`;if(s.content.innerHTML=`
      <div class="info-section">
        <div class="track-stats">
          <div class="stat">
            <span class="stat-value">${e.tracksData.length}</span>
            <span class="stat-label">Total Tracks</span>
          </div>
          <div class="stat">
            <span class="stat-value" id="seasonCountdown" translate="no">${b}</span>
            <span class="stat-label">Until Season End</span>
          </div>
          <div class="stat">
            <span class="stat-value" id="updateCountdown" translate="no">${y}</span>
            <span class="stat-label">Until Daily Update</span>
          </div>
        </div>
      </div>

      ${n.length>0?`
        <div class="track-section">
          <div class="section-header" tabindex="0" role="button" data-filter="new">
            <h2>New Tracks</h2>
            <span class="section-count">${n.length}</span>
          </div>
          <p class="section-description">New tracks are usually announced on Tuesday and arrive with the Thursday shop reset.</p>
          <div class="tracks-grid" data-section="new"></div>
        </div>
      `:""}

      ${r.length>0?`
        <div class="track-section">
          <div class="section-header" tabindex="0" role="button" data-filter="featured">
            <h2>Featured</h2>
            <span class="section-count">${r.length}</span>
          </div>
          <div class="tracks-grid" data-section="daily"></div>
          ${r.length>6?'<button class="show-all-btn" data-filter="featured">Show All Featured</button>':""}
        </div>
      `:""}

      ${l.length>0?`
        <div class="track-section">
          <div class="section-header" tabindex="0" role="button" data-filter="rotated">
            <h2>Rotated Out</h2>
            <span class="section-count">${l.length}</span>
          </div>
          <div class="tracks-grid" data-section="rotated"></div>
          ${l.length>6?'<button class="show-all-btn" data-filter="rotated">Show All Rotated Out</button>':""}
        </div>
      `:""}

      ${i.length>0?`
        <div class="track-section">
          <div class="section-header" tabindex="0" role="button" data-filter="favorites">
            <h2>Your Favorites</h2>
            <span class="section-count">${i.length}</span>
          </div>
          <div class="tracks-grid" data-section="favorites"></div>
          ${i.length>6?'<button class="show-all-btn" data-filter="favorites">Show All Favorites</button>':""}
        </div>
      `:""}

      <div class="track-section">
        <div class="section-header" tabindex="0" role="button" data-filter="all">
          <h2>Other Tracks</h2>
          <span class="section-count">${u.length}</span>
        </div>
        <div class="tracks-grid" data-section="other"></div>
        <button class="show-all-btn" data-filter="all">Show All Tracks</button>
      </div>
    `,n.length>0){const o=s.content.querySelector('[data-section="new"]');n.slice(0,6).forEach(f=>o.appendChild(L(f)))}if(r.length>0){const o=s.content.querySelector('[data-section="daily"]');r.slice(0,6).forEach(f=>o.appendChild(L(f)))}if(l.length>0){const o=s.content.querySelector('[data-section="rotated"]');l.slice(0,6).forEach(f=>o.appendChild(L(f)))}if(i.length>0){const o=s.content.querySelector('[data-section="favorites"]');i.slice(0,6).forEach(f=>o.appendChild(L(f)))}const E=s.content.querySelector('[data-section="other"]');u.slice(0,6).forEach(o=>E.appendChild(L(o))),s.content.querySelectorAll(".section-header").forEach(o=>{const d=o.dataset.filter;d&&(o.addEventListener("click",()=>{window.scrollTo({top:0,behavior:"smooth"}),s.filterSelect.value=d,s.searchInput.value="",e.forceFilteredView=d==="all",T(),e.forceFilteredView=!1}),o.addEventListener("keydown",f=>{(f.key==="Enter"||f.key===" ")&&(f.preventDefault(),window.scrollTo({top:0,behavior:"smooth"}),s.filterSelect.value=d,s.searchInput.value="",e.forceFilteredView=d==="all",T(),e.forceFilteredView=!1)}))}),s.content.querySelectorAll(".show-all-btn").forEach(o=>{o.addEventListener("click",()=>{const d=o.dataset.filter;s.filterSelect.value=d,s.searchInput.value="",window.scrollTo({top:0,behavior:"smooth"}),e.forceFilteredView=d==="all",T(),e.forceFilteredView=!1})}),G(),requestAnimationFrame(()=>{s.content.querySelectorAll(".jam-track").forEach(o=>{h.observe(o)})})}function G(){e.countdownInterval&&clearInterval(e.countdownInterval),e.countdownInterval=setInterval(()=>{const t=document.getElementById("updateCountdown"),a=document.getElementById("seasonCountdown");if(!t){clearInterval(e.countdownInterval);return}const n=new Date,r=new Date;r.setUTCDate(r.getUTCDate()+1),r.setUTCHours(0,0,0,0);const l=new Date;l.setUTCHours(0,0,0,0);const i=new Date(l);if(i.setUTCMinutes(2),n>=l&&n<=i)t.textContent="Updating...";else{const u=r-n,v=Math.floor(u/(1e3*60*60)),p=Math.floor(u%(1e3*60*60)/(1e3*60)),w=Math.floor(u%(1e3*60)/1e3);p===0&&v===0?t.textContent=`${w}s`:t.textContent=`${v}h ${p}m`}if(a){const v=new Date("2025-11-29T08:00:00Z")-n,p=Math.floor(v/(1e3*60*60*24)),w=Math.floor(v%(1e3*60*60*24)/(1e3*60*60));a.textContent=`${p}d ${w}h`}},1e3)}function W(t,a){return t.sort((n,r)=>a==="rotated"?new Date(r.lastFeatured)-new Date(n.lastFeatured):a==="new"?new Date(r.createdAt)-new Date(n.createdAt):n.featured&&!r.featured?-1:!n.featured&&r.featured?1:new Date(r.createdAt)-new Date(n.createdAt))}function Y(t,a,n=!0){if(e.infiniteScrollHandler&&(window.removeEventListener("scroll",e.infiniteScrollHandler),e.infiniteScrollHandler=null),e.loadedTracks=0,window.scrollTo({top:0,behavior:"smooth"}),!t&&a==="all"&&!e.forceFilteredView)O();else{const r=t?`Search results for "${t}"`:a==="featured"?"Featured Tracks":a==="rotated"?"Recently Rotated":a==="new"?"New Tracks":a==="favorites"?"Your Favorites":"All Tracks";s.content.innerHTML=`
        <div class="page-header">
          <h1>${r}</h1>
          <p class="track-count">${e.currentFilteredTracks.length} tracks</p>
        </div>
        <div class="tracks-grid"></div>
      `;const l=s.content.querySelector(".tracks-grid");e.currentFilteredTracks.slice(0,m.initialLoad).forEach(u=>{l.appendChild(L(u))}),requestAnimationFrame(()=>{l.querySelectorAll(".jam-track").forEach(u=>{h.observe(u)})}),e.loadedTracks=Math.min(m.initialLoad,e.currentFilteredTracks.length),e.currentFilteredTracks.length>m.initialLoad&&Z(e.currentFilteredTracks,l)}n&&Q(t,a)}function Q(t,a){const n=new URL(window.location);t?n.searchParams.set("q",t):n.searchParams.delete("q"),a&&a!=="all"?n.searchParams.set("filter",a):n.searchParams.delete("filter"),window.history.pushState({query:t,filterValue:a},"",n)}function Z(t,a){let n=!1;const r=()=>{if(n||e.loadedTracks>=t.length)return;const l=window.scrollY+window.innerHeight;if(a.offsetTop+a.offsetHeight-l<800){n=!0;const v=t.slice(e.loadedTracks,e.loadedTracks+m.tracksPerPage);v.forEach(p=>{a.appendChild(L(p))}),e.loadedTracks+=m.tracksPerPage,requestAnimationFrame(()=>{const p=a.children.length-v.length;for(let w=p;w<a.children.length;w++){const y=a.children[w];y.classList.contains("jam-track")&&h.observe(y)}}),n=!1,setTimeout(()=>r(),100)}};e.infiniteScrollHandler=r,window.addEventListener("scroll",r,{passive:!0}),setTimeout(()=>r(),100)}function J(t,a){a.innerHTML="";const n=7,r={guitar:"Lead",drums:"Drums",bass:"Bass",vocals:"Vocals",plasticGuitar:"Guitar",plasticDrums:"Drums",plasticBass:"Bass","plastic-guitar":"Guitar","plastic-drums":"Drums","plastic-bass":"Bass"},l=["guitar","plasticGuitar","plastic-guitar","bass","plasticBass","plastic-bass","drums","plasticDrums","plastic-drums","vocals"];Object.entries(t).sort((u,v)=>{const p=l.indexOf(u[0]),w=l.indexOf(v[0]);return(p===-1?999:p)-(w===-1?999:w)}).forEach(([u,v])=>{const p=document.createElement("div");p.classList.add("difficulty");const w=Array.from({length:n},(S,k)=>`<div class="difficulty-bar"><span class="${k<=v?"active":""}"></span></div>`).join(""),y=r[u]||u.charAt(0).toUpperCase()+u.slice(1).replace(/([A-Z])/g," $1").trim();p.innerHTML=`
        <div class="instrument-name">${y}</div>
        <div class="difficulty-bars">${w}</div>
      `,a.appendChild(p)})}function N(t,a=!1){const n=document.createElement("div");n.classList.add("label-container");const r=10080*60*1e3;if(Date.now()-new Date(t.createdAt)<r){const i=document.createElement("span");i.classList.add("new-label"),a?i.innerHTML=`
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.56.56 0 0 0-.163-.505L1.71 6.745l4.052-.576a.53.53 0 0 0 .393-.288L8 2.223l1.847 3.658a.53.53 0 0 0 .393.288l4.052.575-2.906 2.77a.56.56 0 0 0-.163.506l.694 3.957-3.686-1.894a.5.5 0 0 0-.461 0z"/>
          </svg>
          <span class="label-text">New</span>
        `:i.innerHTML=`
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.56.56 0 0 0-.163-.505L1.71 6.745l4.052-.576a.53.53 0 0 0 .393-.288L8 2.223l1.847 3.658a.53.53 0 0 0 .393.288l4.052.575-2.906 2.77a.56.56 0 0 0-.163.506l.694 3.957-3.686-1.894a.5.5 0 0 0-.461 0z"/>
          </svg>
        `,n.appendChild(i)}if(t.featured){const i=document.createElement("span");i.classList.add("featured-label"),a?i.innerHTML=`
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
          </svg>
          <span class="label-text">Featured</span>
        `:i.innerHTML=`
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
          </svg>
        `,n.appendChild(i)}if(e.favorites.includes(t.id)){const i=document.createElement("span");i.classList.add("favorite-label"),a?i.innerHTML=`
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/>
          </svg>
          <span class="label-text">Favorite</span>
        `:i.innerHTML=`
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/>
          </svg>
        `,n.appendChild(i)}return n}function _(){const t=new Date,a=new Date;a.setUTCHours(0,2,0,0),t.getUTCHours()===0&&t.getUTCMinutes()<2&&a.setUTCDate(a.getUTCDate()-1);const n=a.getTime();fetch(`data/jam_tracks.json?v=${n}`).then(r=>r.json()).then(r=>{e.tracksData=Object.entries(r).map(([l,i])=>({...i,id:l})),K(),T()}).catch(r=>{console.error("Error loading tracks:",r)})}function K(){const t=new URLSearchParams(window.location.search),a=t.get("q"),n=t.get("filter");a&&(s.searchInput.value=a),n&&(s.filterSelect.value=n)}window.addEventListener("popstate",t=>{if(s.modal.classList.contains("modal-open")){M();return}const a=new URLSearchParams(window.location.search),n=a.get("q")||"",r=a.get("filter")||"all";s.searchInput.value=n,s.filterSelect.value=r,T(!1)});function X(){const t=()=>{e.pendingAudioPlay&&s.modal.style.display==="flex"&&e.currentPreviewUrl&&c.play().then(()=>{console.log("Audio playing after user interaction"),e.pendingAudioPlay=!1,C(m.fadeDuration),A()}).catch(n=>{n.name!=="NotAllowedError"&&console.error("Failed to play audio:",n)})};document.addEventListener("click",t,{once:!1}),document.addEventListener("keydown",t,{once:!1}),c.addEventListener("loadedmetadata",()=>{s.modal.style.display==="flex"&&e.currentPreviewUrl&&A()}),c.addEventListener("timeupdate",()=>{!e.loopTimeout&&s.modal.style.display==="flex"&&e.currentPreviewUrl&&A()}),s.modal.addEventListener("click",n=>{n.target===s.modal&&M()}),s.modal.querySelector(".modal-close").addEventListener("click",M),s.modal.querySelector(".modal-prev").addEventListener("click",()=>F(-1)),s.modal.querySelector(".modal-next").addEventListener("click",()=>F(1)),s.favoriteButton.addEventListener("click",n=>{n.stopPropagation(),H()}),s.logo.addEventListener("click",()=>{s.searchInput.value="",s.filterSelect.value="all",T()}),s.randomButton.addEventListener("click",()=>{if(e.tracksData.length>0){const n=Math.floor(Math.random()*e.tracksData.length),r=e.tracksData[n];e.currentFilteredTracks.length===0&&(e.currentFilteredTracks=[...e.tracksData]),P(r)}}),s.searchInput.addEventListener("input",T),s.filterSelect.addEventListener("change",T),s.muteButton.addEventListener("click",n=>{n.stopPropagation(),D()}),document.addEventListener("keydown",n=>{if(!(n.target.tagName==="INPUT"||n.target.tagName==="TEXTAREA"))if(s.modal.style.display==="flex")switch(n.key){case"ArrowLeft":n.preventDefault(),F(-1);break;case"ArrowRight":n.preventDefault(),F(1);break;case"Escape":M();break;case"f":case"F":n.preventDefault(),H();break;case"m":case"M":n.preventDefault(),D();break}else switch(n.key){case"m":case"M":n.preventDefault(),D();break}});let a;window.addEventListener("resize",()=>{clearTimeout(a),a=setTimeout(()=>{document.querySelectorAll(".jam-track").forEach(n=>{n.querySelectorAll(".marquee-text").forEach(r=>{q(r),x(r)})})},m.resizeDebounceDelay)})}});
