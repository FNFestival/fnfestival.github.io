(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const h of document.querySelectorAll('link[rel="modulepreload"]'))u(h);new MutationObserver(h=>{for(const T of h)if(T.type==="childList")for(const E of T.addedNodes)E.tagName==="LINK"&&E.rel==="modulepreload"&&u(E)}).observe(document,{childList:!0,subtree:!0});function v(h){const T={};return h.integrity&&(T.integrity=h.integrity),h.referrerPolicy&&(T.referrerPolicy=h.referrerPolicy),h.crossOrigin==="use-credentials"?T.credentials="include":h.crossOrigin==="anonymous"?T.credentials="omit":T.credentials="same-origin",T}function u(h){if(h.ep)return;h.ep=!0;const T=v(h);fetch(h.href,T)}})();document.addEventListener("DOMContentLoaded",()=>{const n={modal:document.getElementById("trackModal"),searchInput:document.getElementById("searchInput"),content:document.querySelector(".content"),logo:document.getElementById("logo"),muteButton:document.getElementById("muteButton"),favoriteButton:document.getElementById("favoriteButton"),filterSelect:document.getElementById("filterSelect"),randomButton:document.getElementById("randomButton")},t={tracksData:[],loadedTracks:0,currentTrackIndex:-1,currentFilteredTracks:[],isMuted:localStorage.getItem("isMuted")==="true",currentPreviewUrl:"",currentTrack:null,favorites:JSON.parse(localStorage.getItem("favoriteTracks")||"[]"),loopTimeout:null,countdownInterval:null,fadeInterval:null,infiniteScrollHandler:null,forceFilteredView:!1},v={tracksPerPage:20,initialLoad:40,audioVolume:.2,marqueeObserverMargin:"100px",resizeDebounceDelay:250,marqueeCheckDelay:150,loopDelay:3e3,fadeDuration:500},u=new Audio;u.volume=v.audioVolume;const h=new IntersectionObserver(a=>{a.forEach(e=>{e.isIntersecting?setTimeout(()=>{e.target.querySelectorAll(".marquee-text").forEach(B)},v.marqueeCheckDelay):e.target.querySelectorAll(".marquee-text").forEach(P)})},{rootMargin:v.marqueeObserverMargin});se(),re(),T(),t.isMuted&&(u.volume=0);function T(){const a=n.muteButton.querySelector(".volume-icon"),e=n.muteButton.querySelector(".muted-icon");t.isMuted?(a.style.display="none",e.style.display="block"):(a.style.display="block",e.style.display="none")}function E(){t.isMuted=!t.isMuted,u.volume=t.isMuted?0:v.audioVolume,localStorage.setItem("isMuted",t.isMuted),T()}function O(a){t.fadeInterval&&(clearInterval(t.fadeInterval),t.fadeInterval=null),u.volume=0;const e=20,s=a/e,o=v.audioVolume/e;let l=0;t.fadeInterval=setInterval(()=>{l++,l>=e||t.isMuted?(u.volume=t.isMuted?0:v.audioVolume,clearInterval(t.fadeInterval),t.fadeInterval=null):u.volume=o*l},s)}function R(a,e){t.fadeInterval&&(clearInterval(t.fadeInterval),t.fadeInterval=null);const s=20,o=a/s,l=u.volume,d=l/s;let r=0;t.fadeInterval=setInterval(()=>{r++,r>=s?(u.volume=0,clearInterval(t.fadeInterval),t.fadeInterval=null,e&&e()):u.volume=l-d*r},o)}function A(){t.loopTimeout&&clearTimeout(t.loopTimeout);const a=(u.duration-u.currentTime)*1e3-v.fadeDuration;a>0&&(t.loopTimeout=setTimeout(()=>{t.currentPreviewUrl&&n.modal.style.display==="flex"&&R(v.fadeDuration,()=>{setTimeout(()=>{t.currentPreviewUrl&&n.modal.style.display==="flex"&&(u.currentTime=0,u.play().then(()=>{O(v.fadeDuration),A()}).catch(e=>{console.error("Error playing audio:",e)}))},v.loopDelay)})},a))}function z(a){t.currentTrackIndex=t.currentFilteredTracks.findIndex(e=>e.title===a.title&&e.artist===a.artist),t.currentTrack=a,j(a)}function j(a){const{id:e,title:s,artist:o,cover:l,bpm:d,duration:r,difficulties:m,createdAt:w,lastFeatured:p,previewUrl:i,releaseYear:L}=a;n.modal.querySelector("#modalCover").src=l,n.modal.querySelector("#modalTitle").textContent=s,n.modal.querySelector("#modalArtist").textContent=o,requestAnimationFrame(()=>{const D=n.modal.querySelector("#modalTitle"),F=n.modal.querySelector("#modalArtist");B(D),B(F)});const y=n.modal.querySelector("#modalLabels");y.innerHTML="";const b=Y(a,!0);if(y.appendChild(b),t.favorites.includes(e)?n.favoriteButton.classList.add("favorited"):n.favoriteButton.classList.remove("favorited"),n.modal.querySelector("#modalDetails").innerHTML=`
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Duration</span>
          <span class="detail-value">${r}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">BPM/Tempo</span>
          <span class="detail-value">${d}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Release Year</span>
          <span class="detail-value">${L}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Created</span>
          <span class="detail-value">${new Date(w).toLocaleDateString()}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Last Featured</span>
          <span class="detail-value">${p?new Date(p).toLocaleDateString():"Never"}</span>
        </div>
      </div>
    `,ne(m,n.modal.querySelector("#modalDifficulties")),n.modal.style.display="flex",n.modal.classList.add("modal-open"),document.body.classList.add("modal-open"),i){t.loopTimeout&&(clearTimeout(t.loopTimeout),t.loopTimeout=null),t.fadeInterval&&(clearInterval(t.fadeInterval),t.fadeInterval=null),u.pause(),u.currentTime=0,u.volume=0,u.src=i,t.currentPreviewUrl=i,u.load();const D=u.play();D!==void 0&&D.then(()=>{console.log("Audio playing successfully"),O(v.fadeDuration),A()}).catch(F=>{F.name!=="AbortError"&&(console.error("Failed to play audio:",F),console.log("Preview URL:",i))})}else console.warn("No preview URL for track:",s);G()}function V(){if(!t.currentTrack)return;const a=t.currentTrack.id,e=t.favorites.indexOf(a);e>-1?(t.favorites.splice(e,1),n.favoriteButton.classList.remove("favorited")):(t.favorites.push(a),n.favoriteButton.classList.add("favorited")),localStorage.setItem("favoriteTracks",JSON.stringify(t.favorites)),n.filterSelect.value==="favorites"?S():n.filterSelect.value==="all"&&!n.searchInput.value&&W()}function G(){const a=n.modal.querySelector(".modal-prev"),e=n.modal.querySelector(".modal-next");a.style.display=t.currentTrackIndex>0?"block":"none",e.style.display=t.currentTrackIndex<t.currentFilteredTracks.length-1?"block":"none"}function q(){n.modal.style.display="none",n.modal.classList.remove("modal-open"),document.body.classList.remove("modal-open"),t.loopTimeout&&(clearTimeout(t.loopTimeout),t.loopTimeout=null),R(v.fadeDuration,()=>{u.pause(),u.currentTime=0,u.src="",t.currentPreviewUrl=""})}function U(a){const e=t.currentTrackIndex+a;e>=0&&e<t.currentFilteredTracks.length&&(t.loopTimeout&&(clearTimeout(t.loopTimeout),t.loopTimeout=null),t.currentTrackIndex=e,t.currentTrack=t.currentFilteredTracks[e],j(t.currentFilteredTracks[e]))}function P(a){a&&(a.classList.remove("scrolling"),a.style.setProperty("--scroll-distance","0px"),a.style.setProperty("--marquee-duration","10s"))}function B(a){if(!a?.parentElement)return;const e=a.parentElement;P(a),requestAnimationFrame(()=>{const s=e.clientWidth,o=a.scrollWidth;if(o>s+5){const l=o-s,d=Math.max(5,Math.min(18,l/35)),r=Math.random()*2;a.style.cssText+=`
          --scroll-distance: -${l}px;
          --marquee-delay: ${r}s;
          --marquee-duration: ${d}s;
        `,a.offsetWidth,a.classList.add("scrolling")}})}function H(a){const e=document.createElement("div");e.classList.add("jam-track");const s=document.createElement("div");s.className="loading-spinner";const o=new Image;return o.src=a.cover,o.alt=`${a.title} Cover`,o.style.display="none",o.onload=()=>{s.remove(),o.style.display="",o.classList.add("loaded")},e.innerHTML=`
      <div class="track-text-content">
        <div class="marquee-container">
          <h2 class="marquee-text" translate="no">${a.title}</h2>
        </div>
        <div class="marquee-container">
          <p class="marquee-text" translate="no">${a.artist}</p>
        </div>
      </div>
    `,e.insertBefore(s,e.firstChild),e.insertBefore(o,e.firstChild),e.appendChild(Y(a)),e.addEventListener("click",()=>z(a)),e}function J(a){const e=document.createElement("div");return e.textContent=a,e.innerHTML.trim()}function S(a=!0){const e=n.searchInput.value,s=J(e).toLowerCase(),o=n.filterSelect.value;Z();const l=t.tracksData.filter(d=>d.title.toLowerCase().includes(s)||d.artist.toLowerCase().includes(s)?_(d,o):!1);t.currentFilteredTracks=X(l,o),ee(s,o,a)}const I={now:0,oneDayAgo:0,sevenDaysAgo:0,favoritesSet:new Set};function Z(){const a=Date.now();I.now=a,I.oneDayAgo=a-1440*60*1e3,I.sevenDaysAgo=a-10080*60*1e3,I.favoritesSet=new Set(t.favorites)}function _(a,e){switch(e){case"featured":return a.lastFeatured?new Date(a.lastFeatured).getTime()>=I.oneDayAgo:!1;case"rotated":if(!a.lastFeatured)return!1;const s=new Date(a.lastFeatured).getTime();return s<I.oneDayAgo&&s>=I.sevenDaysAgo;case"new":return new Date(a.createdAt).getTime()>I.sevenDaysAgo;case"favorites":return I.favoritesSet.has(a.id);default:return!0}}function W(){const a=Date.now(),e=1440*60*1e3,s=7*e,o=a-e,l=a-s,d=new Set(t.favorites),r={new:[],featured:[],rotated:[],favorites:[],other:[]};t.tracksData.forEach(c=>{const f=new Date(c.createdAt).getTime(),g=c.lastFeatured?new Date(c.lastFeatured).getTime():0,k=f>l,x=g>=o,N=g<o&&g>=l,$=d.has(c.id);k&&r.new.push(c),x&&r.featured.push(c),N&&r.rotated.push(c),$&&r.favorites.push(c),!k&&!x&&!N&&!$&&r.other.push(c)});const m=r.new,w=r.featured.sort((c,f)=>{const g=c.lastFeatured?new Date(c.lastFeatured).getTime():0;return(f.lastFeatured?new Date(f.lastFeatured).getTime():0)-g}),p=r.rotated.sort((c,f)=>{const g=new Date(c.lastFeatured).getTime();return new Date(f.lastFeatured).getTime()-g}),i=r.favorites.sort((c,f)=>{const g=t.favorites.indexOf(c.id);return t.favorites.indexOf(f.id)-g}),L=r.other.sort((c,f)=>new Date(f.createdAt).getTime()-new Date(c.createdAt).getTime()),y=new Date;y.setUTCDate(y.getUTCDate()+1),y.setUTCHours(0,0,0,0);const b=new Date;b.setUTCHours(0,0,0,0);const M=new Date(b);M.setUTCMinutes(2);let D="";if(a>=b&&a<=M)D="Updating...";else{const c=y-a,f=Math.floor(c/(1e3*60*60)),g=Math.floor(c%(1e3*60*60)/(1e3*60)),k=Math.floor(c%(1e3*60)/1e3);g===0&&f===0?D=`${k}s`:D=`${f}h ${g}m`}const Q=new Date("2025-11-29T08:00:00Z")-a,le=Math.floor(Q/(1e3*60*60*24)),ie=Math.floor(Q%(1e3*60*60*24)/(1e3*60*60)),ce=`${le}d ${ie}h`;n.content.innerHTML=`
      <div class="info-section">
        <div class="track-stats">
          <div class="stat">
            <span class="stat-value">${t.tracksData.length}</span>
            <span class="stat-label">Total Tracks</span>
          </div>
          <div class="stat">
            <span class="stat-value" id="seasonCountdown" translate="no">${ce}</span>
            <span class="stat-label">Until Season End</span>
          </div>
          <div class="stat">
            <span class="stat-value" id="updateCountdown" translate="no">${D}</span>
            <span class="stat-label">Until Daily Update</span>
          </div>
        </div>
      </div>

      ${m.length>0?`
        <div class="track-section">
          <div class="section-header" tabindex="0" role="button" data-filter="new">
            <h2>New Tracks</h2>
            <span class="section-count">${m.length}</span>
          </div>
          <p class="section-description">New tracks are usually announced on Tuesday and arrive with the Thursday shop reset.</p>
          <div class="tracks-grid" data-section="new"></div>
        </div>
      `:""}

      ${w.length>0?`
        <div class="track-section">
          <div class="section-header" tabindex="0" role="button" data-filter="featured">
            <h2>Featured</h2>
            <span class="section-count">${w.length}</span>
          </div>
          <div class="tracks-grid" data-section="daily"></div>
          ${w.length>6?'<button class="show-all-btn" data-filter="featured">Show All Featured</button>':""}
        </div>
      `:""}

      ${p.length>0?`
        <div class="track-section">
          <div class="section-header" tabindex="0" role="button" data-filter="rotated">
            <h2>Recently Rotated</h2>
            <span class="section-count">${p.length}</span>
          </div>
          <div class="tracks-grid" data-section="rotated"></div>
          ${p.length>6?'<button class="show-all-btn" data-filter="rotated">Show All Recently Rotated</button>':""}
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
          <span class="section-count">${L.length}</span>
        </div>
        <div class="tracks-grid" data-section="other"></div>
        <button class="show-all-btn" data-filter="all">Show All Tracks</button>
      </div>
    `;const C=(c,f,g=6)=>{const k=n.content.querySelector(c);if(!k)return;const x=document.createDocumentFragment();f.slice(0,g).forEach($=>x.appendChild(H($))),k.appendChild(x)};m.length>0&&C('[data-section="new"]',m),w.length>0&&C('[data-section="daily"]',w),p.length>0&&C('[data-section="rotated"]',p),i.length>0&&C('[data-section="favorites"]',i),C('[data-section="other"]',L),n.content.querySelectorAll(".section-header").forEach(c=>{const f=c.dataset.filter;f&&(c.addEventListener("click",()=>{window.scrollTo({top:0,behavior:"smooth"}),n.filterSelect.value=f,n.searchInput.value="",t.forceFilteredView=f==="all",S(),t.forceFilteredView=!1}),c.addEventListener("keydown",g=>{(g.key==="Enter"||g.key===" ")&&(g.preventDefault(),window.scrollTo({top:0,behavior:"smooth"}),n.filterSelect.value=f,n.searchInput.value="",t.forceFilteredView=f==="all",S(),t.forceFilteredView=!1)}))}),n.content.querySelectorAll(".show-all-btn").forEach(c=>{c.addEventListener("click",()=>{const f=c.dataset.filter;n.filterSelect.value=f,n.searchInput.value="",window.scrollTo({top:0,behavior:"smooth"}),t.forceFilteredView=f==="all",S(),t.forceFilteredView=!1})}),K(),requestAnimationFrame(()=>{n.content.querySelectorAll(".jam-track").forEach(c=>{h.observe(c)})})}function K(){t.countdownInterval&&clearInterval(t.countdownInterval),t.countdownInterval=setInterval(()=>{const a=document.getElementById("updateCountdown"),e=document.getElementById("seasonCountdown");if(!a){clearInterval(t.countdownInterval);return}const s=new Date,o=new Date;o.setUTCDate(o.getUTCDate()+1),o.setUTCHours(0,0,0,0);const l=new Date;l.setUTCHours(0,0,0,0);const d=new Date(l);if(d.setUTCMinutes(2),s>=l&&s<=d)a.textContent="Updating...";else{const r=o-s,m=Math.floor(r/(1e3*60*60)),w=Math.floor(r%(1e3*60*60)/(1e3*60)),p=Math.floor(r%(1e3*60)/1e3);w===0&&m===0?a.textContent=`${p}s`:a.textContent=`${m}h ${w}m`}if(e){const m=new Date("2025-11-29T08:00:00Z")-s,w=Math.floor(m/(1e3*60*60*24)),p=Math.floor(m%(1e3*60*60*24)/(1e3*60*60));e.textContent=`${w}d ${p}h`}},1e3)}function X(a,e){const o=Date.now()-1440*60*1e3;return a.sort((l,d)=>{if(e==="rotated"||e==="featured")return new Date(d.lastFeatured)-new Date(l.lastFeatured);if(e==="new")return new Date(d.createdAt)-new Date(l.createdAt);{const r=l.lastFeatured&&new Date(l.lastFeatured).getTime()>=o,m=d.lastFeatured&&new Date(d.lastFeatured).getTime()>=o;return r&&!m?-1:!r&&m?1:new Date(d.createdAt)-new Date(l.createdAt)}})}function ee(a,e,s=!0){if(t.infiniteScrollHandler&&(window.removeEventListener("scroll",t.infiniteScrollHandler),t.infiniteScrollHandler=null),t.loadedTracks=0,window.scrollTo({top:0,behavior:"smooth"}),!a&&e==="all"&&!t.forceFilteredView)W();else{const o=a?`Search results for "${a}"`:e==="featured"?"Featured Tracks":e==="rotated"?"Recently Rotated":e==="new"?"New Tracks":e==="favorites"?"Your Favorites":"All Tracks";n.content.innerHTML=`
        <div class="page-header">
          <h1>${o}</h1>
          <p class="track-count">${t.currentFilteredTracks.length} tracks</p>
        </div>
        <div class="tracks-grid"></div>
      `;const l=n.content.querySelector(".tracks-grid");t.currentFilteredTracks.slice(0,v.initialLoad).forEach(r=>{l.appendChild(H(r))}),requestAnimationFrame(()=>{l.querySelectorAll(".jam-track").forEach(r=>{h.observe(r)})}),t.loadedTracks=Math.min(v.initialLoad,t.currentFilteredTracks.length),t.currentFilteredTracks.length>v.initialLoad&&ae(t.currentFilteredTracks,l)}s&&te(a,e)}function te(a,e){const s=new URL(window.location);a?s.searchParams.set("q",a):s.searchParams.delete("q"),e&&e!=="all"?s.searchParams.set("filter",e):s.searchParams.delete("filter"),window.history.pushState({query:a,filterValue:e},"",s)}function ae(a,e){let s=!1;const o=()=>{if(s||t.loadedTracks>=a.length)return;const l=window.scrollY+window.innerHeight;if(e.offsetTop+e.offsetHeight-l<800){s=!0;const m=a.slice(t.loadedTracks,t.loadedTracks+v.tracksPerPage);m.forEach(w=>{e.appendChild(H(w))}),t.loadedTracks+=v.tracksPerPage,requestAnimationFrame(()=>{const w=e.children.length-m.length;for(let p=w;p<e.children.length;p++){const i=e.children[p];i.classList.contains("jam-track")&&h.observe(i)}}),s=!1,setTimeout(()=>o(),100)}};t.infiniteScrollHandler=o,window.addEventListener("scroll",o,{passive:!0}),setTimeout(()=>o(),100)}function ne(a,e){e.innerHTML="";const s=7;function o(i){if(i.startsWith("plastic")){const L=i.replace(/^plastic-?/i,""),y=L.charAt(0).toUpperCase()+L.slice(1);return y==="Guitar"?"Pro Lead":`Pro ${y}`}return i==="guitar"?"Lead":i.charAt(0).toUpperCase()+i.slice(1)}const l=[],d=[];Object.entries(a).forEach(([i,L])=>{(i.startsWith("plastic")?d:l).push([i,L])});const r=i=>i.replace(/^plastic/,"").toLowerCase(),m={vocals:0,guitar:1,bass:2,drums:3},w=(i,L)=>(m[r(i[0])]??999)-(m[r(L[0])]??999);l.sort(w),d.sort(w);const p=[];for(let i=0;i<Math.max(l.length,d.length);i++)l[i]&&p.push(l[i]),d[i]&&p.push(d[i]);p.forEach(([i,L])=>{const y=document.createElement("div");y.classList.add("difficulty");const b=Array.from({length:s},(D,F)=>`<div class="difficulty-bar"><span class="${F<=L?"active":""}"></span></div>`).join(""),M=o(i);y.innerHTML=`
        <div class="instrument-name">${M}</div>
        <div class="difficulty-bars">${b}</div>
      `,e.appendChild(y)})}function Y(a,e=!1){const s=document.createElement("div");s.classList.add("label-container");const o=10080*60*1e3;if(Date.now()-new Date(a.createdAt)<o){const r=document.createElement("span");r.classList.add("new-label"),e?r.innerHTML=`
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.56.56 0 0 0-.163-.505L1.71 6.745l4.052-.576a.53.53 0 0 0 .393-.288L8 2.223l1.847 3.658a.53.53 0 0 0 .393.288l4.052.575-2.906 2.77a.56.56 0 0 0-.163.506l.694 3.957-3.686-1.894a.5.5 0 0 0-.461 0z"/>
          </svg>
          <span class="label-text">New</span>
        `:r.innerHTML=`
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.56.56 0 0 0-.163-.505L1.71 6.745l4.052-.576a.53.53 0 0 0 .393-.288L8 2.223l1.847 3.658a.53.53 0 0 0 .393.288l4.052.575-2.906 2.77a.56.56 0 0 0-.163.506l.694 3.957-3.686-1.894a.5.5 0 0 0-.461 0z"/>
          </svg>
        `,s.appendChild(r)}if(a.lastFeatured&&Date.now()-new Date(a.lastFeatured).getTime()<1440*60*1e3){const r=document.createElement("span");r.classList.add("featured-label"),e?r.innerHTML=`
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
          </svg>
          <span class="label-text">Featured</span>
        `:r.innerHTML=`
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
          </svg>
        `,s.appendChild(r)}if(t.favorites.includes(a.id)){const r=document.createElement("span");r.classList.add("favorite-label"),e?r.innerHTML=`
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/>
          </svg>
          <span class="label-text">Favorite</span>
        `:r.innerHTML=`
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/>
          </svg>
        `,s.appendChild(r)}return s}function se(){n.content.innerHTML=`
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading jam tracks...</p>
      </div>
    `;const a=new Date,e=new Date;e.setUTCHours(0,2,0,0),a.getUTCHours()===0&&a.getUTCMinutes()<2&&e.setUTCDate(e.getUTCDate()-1);const s=e.getTime();fetch(`data/jam_tracks.json?v=${s}`).then(o=>{if(!o.ok)throw new Error(`HTTP error! status: ${o.status}`);return o.json()}).then(o=>{t.tracksData=Object.entries(o).map(([l,d])=>({...d,id:l})),oe(),S()}).catch(o=>{console.error("Error loading tracks:",o),n.content.innerHTML=`
          <div class="error-container">
            <h2>Failed to load tracks</h2>
            <p>${o.message}</p>
            <button onclick="location.reload()">Retry</button>
          </div>
        `})}function oe(){const a=new URLSearchParams(window.location.search),e=a.get("q"),s=a.get("filter");e&&(n.searchInput.value=e),s&&(n.filterSelect.value=s)}window.addEventListener("popstate",a=>{if(n.modal.classList.contains("modal-open")){q();return}const e=new URLSearchParams(window.location.search),s=e.get("q")||"",o=e.get("filter")||"all";n.searchInput.value=s,n.filterSelect.value=o,S(!1)});function re(){u.addEventListener("loadedmetadata",()=>{n.modal.style.display==="flex"&&t.currentPreviewUrl&&A()}),u.addEventListener("timeupdate",()=>{!t.loopTimeout&&n.modal.style.display==="flex"&&t.currentPreviewUrl&&A()}),n.modal.addEventListener("click",e=>{e.target===n.modal&&q()}),n.modal.querySelector(".modal-close").addEventListener("click",q),n.modal.querySelector(".modal-prev").addEventListener("click",()=>U(-1)),n.modal.querySelector(".modal-next").addEventListener("click",()=>U(1)),n.favoriteButton.addEventListener("click",e=>{e.stopPropagation(),V()}),n.logo.addEventListener("click",()=>{n.searchInput.value="",n.filterSelect.value="all",S()}),n.randomButton.addEventListener("click",()=>{if(t.tracksData.length>0){const e=Math.floor(Math.random()*t.tracksData.length),s=t.tracksData[e];t.currentFilteredTracks.length===0&&(t.currentFilteredTracks=[...t.tracksData]),z(s)}}),n.searchInput.addEventListener("input",S),n.filterSelect.addEventListener("change",S),n.muteButton.addEventListener("click",e=>{e.stopPropagation(),E()}),document.addEventListener("keydown",e=>{if(!(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA"))if(n.modal.style.display==="flex")switch(e.key){case"ArrowLeft":e.preventDefault(),U(-1);break;case"ArrowRight":e.preventDefault(),U(1);break;case"Escape":q();break;case"f":case"F":e.preventDefault(),V();break;case"m":case"M":e.preventDefault(),E();break}else switch(e.key){case"m":case"M":e.preventDefault(),E();break}});let a;window.addEventListener("resize",()=>{clearTimeout(a),a=setTimeout(()=>{document.querySelectorAll(".jam-track").forEach(e=>{e.querySelectorAll(".marquee-text").forEach(s=>{P(s),B(s)})})},v.resizeDebounceDelay)})}});
