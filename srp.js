(function(){
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const fmt = n => '$' + Math.round(n).toLocaleString('en-US');

  /* nav */
  const nav = $('#nav'), mcta = $('#mcta');
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('solid', y > 40);
    const start = $('#start').getBoundingClientRect().top;
    mcta.classList.toggle('show', y > 600 && start > window.innerHeight);
    updateSteps();
  };
  window.addEventListener('scroll', onScroll, {passive:true});

  /* reveal */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
  }), {threshold:.12, rootMargin:'0px 0px -40px 0px'});
  $$('.rv').forEach(el => io.observe(el));

  /* quick check quiz */
  const state = {step:0, sale:null, when:null};
  const Q = [
    { h:'What kind of sale was it?', sub:'Choose the closest match — we\u2019ll confirm when we review the records.', key:'sale',
      opts:[['Foreclosure','Sold to pay off a mortgage'],['Tax sale','Sold for unpaid property taxes'],['Not sure','I just know it was sold',true]] },
    { h:'Roughly when was it sold?', sub:'Claim windows vary by state, so timing helps us prioritize.', key:'when',
      opts:[['Within the last year','Recent sale'],['1–3 years ago','Still worth checking'],['More than 3 years','Records may still exist'],['I don\u2019t know','That\u2019s okay']] },
  ];
  const body = $('#qbody'), next = $('#qnext'), back = $('#qback'), stepEl = $('#qstep');
  const bars = $$('.quiz-steps i');
  function renderQuiz(){
    bars.forEach((b,i)=>b.classList.toggle('on', i<=state.step));
    stepEl.textContent = Math.min(state.step+1,3);
    back.disabled = state.step===0 || state.step===3;
    $('#qfoot').style.display = state.step===3 ? 'none' : 'flex';
    if (state.step < 2){
      const q = Q[state.step];
      body.innerHTML = `<h3>${q.h}</h3><p class="sub">${q.sub}</p><div class="qopts">${
        q.opts.map(([t,d,w])=>`<button class="qopt${w?' wide':''}${state[q.key]===t?' sel':''}" data-v="${t}"><b>${t}</b><span>${d}</span></button>`).join('')
      }</div>`;
      body.querySelectorAll('.qopt').forEach(b=>b.onclick=()=>{state[q.key]=b.dataset.v;renderQuiz();});
      next.disabled = !state[q.key];
      next.innerHTML = 'Continue <span class="ar">→</span>';
    } else if (state.step===2){
      body.innerHTML = `<h3>Where should we send your review?</h3><p class="sub">${state.sale} · ${state.when}. A person on our team will follow up.</p>
        <div class="qrow"><div class="qfield"><label>Name</label><input id="qn" placeholder="Jane Doe"></div>
        <div class="qfield"><label>Phone</label><input id="qp" type="tel" placeholder="(000) 000-0000"></div></div>
        <div class="qfield"><label>Email</label><input id="qe" type="email" placeholder="you@email.com"></div>`;
      next.innerHTML = 'Request Free Evaluation <span class="ar">→</span>';
      const chk = ()=> next.disabled = !($('#qn').value.trim() && ($('#qe').value.includes('@') || $('#qp').value.trim().length>6));
      body.querySelectorAll('input').forEach(i=>i.oninput=chk); chk();
    } else {
      body.innerHTML = `<div class="qdone"><div class="seal"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 11.5l4 4 8-9"/></svg></div>
        <h3>Thank you — we\u2019ve got it.</h3><p class="sub" style="margin-bottom:0">Your request starts a manual review of the records. We\u2019ll reach out to explain what we find. No cost, no obligation.</p></div>`;
    }
  }
  next.onclick = ()=>{ state.step++; renderQuiz(); };
  back.onclick = ()=>{ state.step--; renderQuiz(); };
  renderQuiz();

  /* receipt calculator */
  const rs = $('#r-sale'), rd = $('#r-debt'), rf = $('#r-fees');
  function calc(){
    const s=+rs.value, d=+rd.value, f=+rf.value;
    const sur = Math.max(0, s-d-f);
    $('#o-sale').textContent = fmt(s);
    $('#o-debt').textContent = '− ' + fmt(d);
    $('#o-fees').textContent = '− ' + fmt(f);
    const val = $('#o-sur');
    val.textContent = fmt(sur);
    val.classList.toggle('zero', sur===0);
    const tot = Math.max(s, d+f);
    const pd = Math.min(d, s)/s*100, pf = Math.min(f, Math.max(0,s-d))/s*100, ps = sur/s*100;
    $('#b1').style.width = pd+'%'; $('#b3').style.width = pf+'%'; $('#b4').style.width = ps+'%';
    $('#b1').textContent = pd>12?'Debt':''; $('#b3').textContent = pf>12?'Costs':''; $('#b4').textContent = ps>12?'Surplus':'';
  }
  [rs,rd,rf].forEach(r=>r.addEventListener('input',calc)); calc();

  /* process steps scroll */
  const steps = $$('.step'), rail = $('#rail'), stepsWrap = $('#steps');
  function updateSteps(){
    if(!stepsWrap) return;
    const mid = window.innerHeight*0.55;
    let active = 0;
    steps.forEach((s,i)=>{ if (s.getBoundingClientRect().top < mid) active = i; });
    steps.forEach((s,i)=>s.classList.toggle('on', i<=active));
    $('#pnum').textContent = steps[active].dataset.n;
    $('#plabel').textContent = steps[active].dataset.l;
    const r = stepsWrap.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (mid - r.top) / (r.height - 40)));
    rail.style.height = (p * (r.height - 16)) + 'px';
  }

  /* faq */
  $$('.qa button').forEach(b=>b.onclick=()=>{
    const qa=b.parentElement, was=qa.classList.contains('open');
    $$('.qa').forEach(x=>x.classList.remove('open'));
    if(!was) qa.classList.add('open');
  });

  /* main form */
  $('#fsubmit').onclick = ()=>{
    const n=$('#f-name'), e=$('#f-email');
    if(!n.value.trim()){ n.focus(); n.style.borderColor='var(--red)'; return; }
    if(!e.value.includes('@')){ e.focus(); e.style.borderColor='var(--red)'; return; }
    $('#formbody').innerHTML = `<div class="qdone"><div class="seal"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 11.5l4 4 8-9"/></svg></div>
      <h3>Thank you, ${n.value.trim().split(' ')[0]}.</h3><p style="font-size:16px;color:rgba(15,29,26,.7);margin-top:10px">Your request has been received. A member of our team will manually review the records and reach out to explain what we find. There's no cost and no obligation.</p></div>`;
  };

  onScroll();
})();
